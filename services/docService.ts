
// Access global libraries loaded via script tags
declare const mammoth: any;
declare const htmlDocx: any;
declare const html2canvas: any;

// jsPDF is available on window
declare global {
  interface Window {
    jspdf: any;
  }
}

export const parseWordDocument = async (file: File): Promise<string> => {
  try {
    console.log('Starting document parsing...', file.name, file.size, 'bytes');
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer loaded');
    
    // Enhanced options to preserve ALL formatting
    const options = {
        convertImage: mammoth.images.imgElement((image: any) => {
            return image.read("base64").then((imageBuffer: any) => {
                const contentType = image.contentType || "image/png";
                
                // Build style string for image
                let style = '';
                if (image.width) style += `width: ${image.width}px; `;
                if (image.height) style += `height: ${image.height}px; `;
                
                return {
                    src: "data:" + contentType + ";base64," + imageBuffer,
                    style: style
                };
            }).catch((e: any) => {
                console.warn("Failed to convert image", e);
                return { src: "" };
            });
        }),
        ignoreEmptyParagraphs: false,
        includeDefaultStyleMap: true,
        includeEmbeddedStyleMap: true,
        styleMap: [
            // Preserve all paragraph styles with inline styles
            "p[style-name='Title'] => h1.title:fresh",
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Body Text'] => p:fresh",
            "p[style-name='Table Paragraph'] => p:fresh",
            
            // Preserve character styles
            "r[style-name='Strong'] => strong",
            "r[style-name='Emphasis'] => em",
            
            // Preserve tables with all attributes
            "table => table.word-table:fresh",
            "tr => tr:fresh",
            "td => td:fresh",
            "th => th:fresh"
        ],
        
        // Transform to preserve inline styles
        transformDocument: mammoth.transforms.paragraph((element: any) => {
            return element;
        })
    };

    console.log('Converting to HTML...');
    const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer }, options);
    console.log('Conversion complete');
    
    if (result.messages.length > 0) {
        console.log("Mammoth messages:", result.messages.length);
        result.messages.forEach((msg: any, i: number) => {
          if (i < 5) { // Only log first 5 to avoid spam
            console.log(`  ${i + 1}. ${msg.type}: ${msg.message}`);
          }
        });
    }
    
    let html = result.value || "<p></p>";
    console.log('HTML length:', html.length);
    
    // Check if document is too large
    if (html.length > 500000) {
      console.warn('Document is very large (>500KB), this may cause performance issues');
    }
    
    // Enhanced post-processing to preserve formatting
    console.log('Post-processing HTML...');
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.querySelector('div');
    
    if (container) {
      // Process images - FIXED: Better sizing and positioning
      container.querySelectorAll('img').forEach(img => {
        const imgEl = img as HTMLElement;
        
        // Get original dimensions if available
        const origWidth = imgEl.getAttribute('width');
        const origHeight = imgEl.getAttribute('height');
        
        // Set reasonable max size (smaller than before)
        imgEl.style.maxWidth = '300px';
        imgEl.style.height = 'auto';
        
        // If original width is specified and small, use it
        if (origWidth) {
          const width = parseInt(origWidth);
          if (width < 300) {
            imgEl.style.width = width + 'px';
          }
        }
        
        // Check if image is in a paragraph (inline) or standalone
        const parent = imgEl.parentElement;
        if (parent && parent.tagName === 'P' && parent.textContent && parent.textContent.trim().length > 0) {
          // Image is inline with text - float left
          imgEl.style.float = 'left';
          imgEl.style.marginRight = '15px';
          imgEl.style.marginBottom = '10px';
        } else {
          // Standalone image - left align (not center)
          imgEl.style.display = 'block';
          imgEl.style.margin = '10px 0';
        }
      });
      
      // Process tables - preserve all formatting
      container.querySelectorAll('table').forEach(table => {
        table.classList.add('word-table');
        
        const tableEl = table as HTMLElement;
        
        // Ensure table has proper styling
        if (!tableEl.style.borderCollapse) {
          tableEl.style.borderCollapse = 'collapse';
        }
        if (!tableEl.style.width) {
          tableEl.style.width = '100%';
        }
        
        // Process table cells
        table.querySelectorAll('td, th').forEach(cell => {
          const cellEl = cell as HTMLElement;
          
          // Ensure cells have borders
          if (!cellEl.style.border) {
            cellEl.style.border = '1px solid #000';
          }
          
          // Ensure cells have padding
          if (!cellEl.style.padding) {
            cellEl.style.padding = '8px';
          }
          
          // Preserve background colors if they exist
          const bgColor = cellEl.style.backgroundColor;
          if (bgColor) {
            // Keep the background color
            console.log('Preserving cell background:', bgColor);
          }
          
          // Make header cells bold
          if (cell.tagName === 'TH' && !cellEl.style.fontWeight) {
            cellEl.style.fontWeight = 'bold';
          }
        });
      });
      
      // Process paragraphs - preserve alignment
      container.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(el => {
        const element = el as HTMLElement;
        const text = element.textContent?.trim() || '';
        
        // Detect centered content (all caps titles)
        if (text.length > 0 && text.length < 150) {
          const isAllCaps = text === text.toUpperCase() && /[A-Z]/.test(text);
          if (isAllCaps && !element.style.textAlign) {
            element.style.textAlign = 'center';
            element.style.fontWeight = 'bold';
          }
        }
      });
      
      html = container.innerHTML;
    }
    
    // Basic formatting fixes
    html = html.replace(/<br[^>]*page-break[^>]*>/gi, '<hr class="word-page-break">');
    html = html.replace(/<div[^>]*page-break[^>]*><\/div>/gi, '<hr class="word-page-break">');
    
    console.log('Document parsing complete');
    return html;
  } catch (error) {
    console.error("Error parsing Word Doc:", error);
    throw new Error("Failed to parse Word Document.");
  }
};

/**
 * Splits HTML based on Word's original page breaks AND adds visual page markers
 * Also handles overflow - if content is too long for a page, it auto-splits
 */
export const paginateHtml = async (fullHtml: string): Promise<string[]> => {
    if (!fullHtml || fullHtml.trim().length === 0) return ["<p><br/></p>"];

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${fullHtml}</div>`, 'text/html');
    const container = doc.querySelector('div');
    
    if (!container) return [fullHtml];

    // A4 page height in pixels (at 96 DPI)
    // 297mm - 50.8mm margins = 246.2mm ≈ 930px
    const MAX_PAGE_HEIGHT = 930;

    // Helper function to split content by height
    const splitByHeight = async (elements: HTMLElement[]): Promise<string[]> => {
        if (elements.length === 0) return [];
        
        // Create temp container to measure heights
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '210mm';
        tempContainer.style.padding = '25.4mm';
        tempContainer.style.fontFamily = 'Calibri, Arial, sans-serif';
        tempContainer.style.fontSize = '11pt';
        tempContainer.style.lineHeight = '1.5';
        
        // Add all elements to measure
        elements.forEach(el => tempContainer.appendChild(el.cloneNode(true)));
        document.body.appendChild(tempContainer);
        
        const pages: string[] = [];
        let currentPageNodes: HTMLElement[] = [];
        let currentHeight = 0;
        
        const children = Array.from(tempContainer.children) as HTMLElement[];
        
        for (const child of children) {
            const style = window.getComputedStyle(child);
            const marginTop = parseFloat(style.marginTop) || 0;
            const marginBottom = parseFloat(style.marginBottom) || 0;
            const height = child.offsetHeight + marginTop + marginBottom;
            
            if (currentHeight + height > MAX_PAGE_HEIGHT && currentPageNodes.length > 0) {
                // Page break needed - save current page
                const pageDiv = document.createElement('div');
                currentPageNodes.forEach(node => pageDiv.appendChild(node.cloneNode(true)));
                pages.push(pageDiv.innerHTML);
                
                currentPageNodes = [child];
                currentHeight = height;
            } else {
                currentPageNodes.push(child);
                currentHeight += height;
            }
        }
        
        // Add last page
        if (currentPageNodes.length > 0) {
            const pageDiv = document.createElement('div');
            currentPageNodes.forEach(node => pageDiv.appendChild(node.cloneNode(true)));
            pages.push(pageDiv.innerHTML);
        }
        
        document.body.removeChild(tempContainer);
        return pages;
    };

    // Check if there are explicit page break markers from Word or AI
    const hasExplicitBreaks = fullHtml.includes('word-page-break') || 
                              fullHtml.includes('page-break-marker') ||
                              fullHtml.includes('page-break-before') ||
                              fullHtml.includes('break-before');

    if (hasExplicitBreaks) {
        // First, split by explicit page break markers into sections
        const sections: HTMLElement[][] = [];
        let currentSection: HTMLElement[] = [];

        Array.from(container.childNodes).forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                
                // Check if this is a page break marker
                const isPageBreak = element.classList.contains('word-page-break') || 
                    element.classList.contains('page-break-marker') ||
                    element.style.pageBreakBefore === 'always' ||
                    element.style.breakBefore === 'page' ||
                    (element.getAttribute('style') || '').includes('page-break-before') ||
                    (element.getAttribute('style') || '').includes('break-before');
                
                if (isPageBreak) {
                    // Save current section and start new one
                    if (currentSection.length > 0) {
                        sections.push(currentSection);
                        currentSection = [];
                    }
                } else {
                    currentSection.push(element);
                }
            } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
                const p = document.createElement('p');
                p.textContent = node.textContent;
                currentSection.push(p);
            }
        });

        // Add last section
        if (currentSection.length > 0) {
            sections.push(currentSection);
        }

        // Now process each section - if a section is too long, split it by height
        const allPages: string[] = [];
        
        for (const section of sections) {
            const sectionPages = await splitByHeight(section);
            allPages.push(...sectionPages);
        }

        return allPages.length > 0 ? allPages : [fullHtml];
    }

    // No explicit breaks - calculate page breaks based on A4 height
    // This provides visual guidance for where pages will break in PDF
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '210mm';
    tempContainer.style.padding = '25.4mm';
    tempContainer.style.fontFamily = 'Calibri, Arial, sans-serif';
    tempContainer.style.fontSize = '11pt';
    tempContainer.style.lineHeight = '1.5';
    tempContainer.innerHTML = fullHtml;
    
    document.body.appendChild(tempContainer);

    const children = Array.from(tempContainer.children) as HTMLElement[];
    const pages: string[] = [];
    const pageHeight = 930; // Same as MAX_PAGE_HEIGHT defined above

    let currentPageNodes: HTMLElement[] = [];
    let currentHeight = 0;

    for (const child of children) {
        const style = window.getComputedStyle(child);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        const height = child.offsetHeight + marginTop + marginBottom;

        if (currentHeight + height > pageHeight && currentPageNodes.length > 0) {
            // Page break needed
            const pageDiv = document.createElement('div');
            currentPageNodes.forEach(node => pageDiv.appendChild(node.cloneNode(true)));
            pages.push(pageDiv.innerHTML);

            currentPageNodes = [child];
            currentHeight = height;
        } else {
            currentPageNodes.push(child);
            currentHeight += height;
        }
    }

    // Add last page
    if (currentPageNodes.length > 0) {
        const pageDiv = document.createElement('div');
        currentPageNodes.forEach(node => pageDiv.appendChild(node.cloneNode(true)));
        pages.push(pageDiv.innerHTML);
    }

    document.body.removeChild(tempContainer);

    return pages.length > 0 ? pages : [fullHtml];
};

export const exportToWord = (htmlContent: string): Blob => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Preserve all inline styles and convert them to proper attributes
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el: any) => {
      // Ensure text-align is preserved both as style and attribute
      const styleAttr = el.getAttribute('style');
      if (styleAttr) {
        const textAlignMatch = styleAttr.match(/text-align:\s*([^;]+)/);
        if (textAlignMatch) {
          const alignValue = textAlignMatch[1].trim();
          if (['left', 'center', 'right', 'justify'].includes(alignValue)) {
            el.setAttribute('align', alignValue);
            // Keep the style attribute too
            if (!styleAttr.includes('text-align')) {
              el.setAttribute('style', styleAttr + `; text-align: ${alignValue}`);
            }
          }
        }
      }
      
      // Also check computed style
      const computedAlign = el.style?.textAlign;
      if (computedAlign && ['left', 'center', 'right', 'justify'].includes(computedAlign)) {
        el.setAttribute('align', computedAlign);
      }
    });
    
    const images = doc.querySelectorAll('img');
    images.forEach((img: any) => {
      img.style.display = 'block';
      img.style.marginLeft = 'auto';
      img.style.marginRight = 'auto';
      if (!img.style.width) img.style.width = '100%';
      if (!img.style.maxWidth) img.style.maxWidth = '600px';
    });
    
    const protectedHtml = doc.body.innerHTML;

    const fullHtml = `
      <!DOCTYPE html>
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="UTF-8">
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
            </w:WordDocument>
          </xml>
          <style>
             @page { 
               size: 8.5in 11in; 
               margin: 1in 1in 1in 1in; 
             }
             body { 
               font-family: 'Calibri', 'Arial', sans-serif; 
               font-size: 11pt; 
               line-height: 1.6; 
               margin: 0;
               padding: 0;
             }
             p { margin-bottom: 1em; margin-top: 0; }
             h1 { font-size: 24pt; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
             h2 { font-size: 18pt; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
             h3 { font-size: 14pt; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
             .doc-title { text-align: center; font-size: 28pt; margin-bottom: 24pt; margin-top: 0; font-weight: bold; }
             .doc-subtitle { text-align: center; color: #666; font-size: 14pt; font-style: italic; margin-bottom: 2em; }
             table { border-collapse: collapse; width: 100%; margin: 1em 0; }
             td, th { border: 1px solid #000; padding: 8px; }
             ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
             ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
             [align="center"], [style*="text-align: center"], [style*="text-align:center"] { text-align: center !important; }
             [align="right"], [style*="text-align: right"], [style*="text-align:right"] { text-align: right !important; }
             [align="left"], [style*="text-align: left"], [style*="text-align:left"] { text-align: left !important; }
             [align="justify"], [style*="text-align: justify"], [style*="text-align:justify"] { text-align: justify !important; }
          </style>
        </head>
        <body>
          ${protectedHtml}
        </body>
      </html>
    `;
    
    return htmlDocx.asBlob(fullHtml, {
        orientation: 'portrait',
        margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
    });
  } catch (error) {
    console.error("Export Error:", error);
    throw new Error("Failed to export to Word.");
  }
};

export const generatePdf = async (container: HTMLElement | null, filename: string): Promise<void> => {
  if (!container) {
    throw new Error("No content to export");
  }

  const pages = Array.from(container.querySelectorAll('.document-page'));
  if (pages.length === 0) {
    throw new Error("No pages found to export");
  }

  // Check if libraries are loaded
  if (typeof html2canvas === 'undefined') {
    throw new Error("html2canvas library not loaded");
  }

  // Access jsPDF from window
  const jsPDFLib = (window as any).jspdf || (window as any).jsPDF;
  if (!jsPDFLib) {
    throw new Error("jsPDF library not loaded. Please refresh the page.");
  }

  const { jsPDF } = jsPDFLib;

  // A4 dimensions in mm
  const a4Width = 210;
  const a4Height = 297;

  // Create PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Process each page
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i] as HTMLElement;
    
    // Show loading indicator
    console.log(`Capturing page ${i + 1} of ${pages.length}...`);

    try {
      // Get the full scroll dimensions to capture all content
      const scrollWidth = Math.max(page.scrollWidth, page.offsetWidth);
      const scrollHeight = Math.max(page.scrollHeight, page.offsetHeight);
      
      // Capture the page as canvas with high quality
      const canvas = await html2canvas(page, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: scrollWidth,
        height: scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: scrollWidth,
        windowHeight: scrollHeight,
        // Ensure we capture overflow content and remove borders for PDF
        onclone: (clonedDoc: Document) => {
          const clonedPages = clonedDoc.querySelectorAll('.document-page');
          clonedPages.forEach((clonedPage) => {
            const el = clonedPage as HTMLElement;
            el.style.overflow = 'visible';
            el.style.height = 'auto';
            el.style.minHeight = 'auto';
            // Remove borders and shadows for clean PDF
            el.style.border = 'none';
            el.style.boxShadow = 'none';
            el.style.outline = 'none';
          });
        }
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Calculate dimensions to fit A4
      const imgWidth = a4Width;
      const imgHeight = (canvas.height * a4Width) / canvas.width;
      
      // Add new page if not first page
      if (i > 0) {
        pdf.addPage();
      }
      
      // If content is taller than A4, we need to handle it
      if (imgHeight > a4Height) {
        // Content is longer than one page - add it starting from top
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      } else {
        // Content fits on one page - no vertical offset, align to top
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      }
      
    } catch (error) {
      console.error(`Error capturing page ${i + 1}:`, error);
      throw new Error(`Failed to capture page ${i + 1}`);
    }
  }

  // Save the PDF
  const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(pdfFilename);
};
