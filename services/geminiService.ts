
// Version: 2.0 - Smart Merge System
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export interface AiResponse {
  type: 'update' | 'message';
  content: string; // This will be the new HTML or a message
}

console.log('🔄 Gemini Service v2.0 loaded - Smart Merge enabled');

// Simple rate limiter
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 4000; // 4 seconds between requests (15 per minute = 1 every 4 seconds)

const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
};

// Helper to strip heavy base64 images before sending to AI
const protectImages = (html: string): { protectedHtml: string, imageMap: Map<string, string> } => {
  const imageMap = new Map<string, string>();
  let counter = 0;
  
  // Regex to capture the src attribute content of images
  // We look for src="data:..." specifically
  const protectedHtml = html.replace(/src="(data:image\/[^;]+;base64,[^"]+)"/g, (match, srcData) => {
    const key = `__IMG_PLACEHOLDER_${counter++}__`;
    imageMap.set(key, srcData);
    return `src="${key}"`;
  });

  return { protectedHtml, imageMap };
};

// Helper to put images back
const restoreImages = (html: string, imageMap: Map<string, string>): string => {
  let restoredHtml = html;
  
  imageMap.forEach((srcData, key) => {
    // We replace the placeholder key back with the original data
    // global replacement in case AI duplicated the image section
    restoredHtml = restoredHtml.split(key).join(srcData);
  });

  return restoredHtml;
};

export const getDocumentEditSuggestions = async (
  currentHtml: string,
  userPrompt: string
): Promise<AiResponse> => {
  
  // Save original document for merging later
  const originalDocument = currentHtml;
  const docSizeKB = currentHtml.length / 1024;
  console.log('Document size:', docSizeKB.toFixed(1), 'KB');
  console.log('Original document saved for merge protection');
  
  // 1. Protect Images (Strip Base64)
  const { protectedHtml, imageMap } = protectImages(currentHtml);

  // System instruction for HTML editing with VERY STRONG anti-truncation
  const systemInstruction = `You are an expert AI Editor for Word Documents. 
  Your input is an HTML representation of a document. 
  Your goal is to rewrite, edit, or format the HTML based on the user's request.

  🚨🚨🚨 CRITICAL ANTI-TRUNCATION RULES 🚨🚨🚨:
  1. **MANDATORY: RETURN 100% OF THE DOCUMENT**: You MUST return EVERY SINGLE PARAGRAPH, TABLE, LIST, and SECTION from the original document. Even if you only edit ONE WORD, you must return THE ENTIRE DOCUMENT.
  2. **COUNT VERIFICATION**: If the input has 50 paragraphs, your output MUST have 50 paragraphs. If input has 10 tables, output MUST have 10 tables.
  3. **NO SUMMARIZING**: Do NOT summarize, shorten, or omit ANY content unless explicitly asked to delete it.
  4. **PRESERVE EVERYTHING AFTER YOUR EDIT**: If you edit page 1, you MUST include pages 2, 3, 4, etc. in your response.
  5. **Structure Preservation**: Maintain ALL HTML structure (paragraphs <p>, headers <h1>, lists <ul>, tables <table>) unless asked to change it.
  6. **Style Preservation**: If an element has a 'style' attribute (e.g., style="text-align: center"), YOU MUST PRESERVE IT in the output unless explicitly asked to change the alignment.
  7. **Clean Output**: Return *ONLY* the HTML content. Do not wrap in \`\`\`html code blocks. Do not add markdown. Just the raw HTML.
  8. **IMAGE SAFETY**: You will see image tags like <img src="__IMG_PLACEHOLDER_0__">. **DO NOT CHANGE, REMOVE, OR REORDER THESE SRC ATTRIBUTES**. You must output the img tag exactly as is with the placeholder src.
  9. **NO TRUNCATION**: If the document has multiple pages or sections, return ALL of them. Do not summarize or shorten the document unless explicitly asked.

  📷 IMAGE FORMATTING RULES:
  When user asks to format/align/center/position an image:
  - To CENTER an image: Wrap it in a div with style="text-align: center;" like: <div style="text-align: center;"><img src="__IMG_PLACEHOLDER_X__" style="display: inline-block;"></div>
  - To LEFT align: Wrap in <div style="text-align: left;"><img src="..." style="display: inline-block;"></div>
  - To RIGHT align: Wrap in <div style="text-align: right;"><img src="..." style="display: inline-block;"></div>
  - To RESIZE: Add width style like style="width: 50%;" or style="width: 300px;"
  - "First page image" means the FIRST <img> tag in the document
  - "Second image" means the SECOND <img> tag, etc.
  - ALWAYS preserve the src="__IMG_PLACEHOLDER_X__" exactly as-is

  📄 PAGE LAYOUT & PAGE BREAK RULES:
  When user asks to move content to specific pages (e.g., "move abstract to page 2", "introduction should start on page 4"):
  - Use this PAGE BREAK marker to force content to a new page: <div style="page-break-before: always; break-before: page;"></div>
  - Insert this marker BEFORE the section that should start on a new page
  - Common section names to recognize: Abstract, Contents, Table of Contents, Introduction, Chapter, Conclusion, References, Appendix, Acknowledgements
  - "Page 2" means insert ONE page break before that section
  - "Page 3" means insert TWO page breaks before that section (or one after page 2 content)
  - "Page 4" means insert THREE page breaks before that section
  - IMPORTANT: When reorganizing pages, you MUST keep ALL content - just reorder and add page breaks
  
  🚨 CRITICAL FOR "FROM PAGE X ONWARDS" REQUESTS:
  - When user says "from page 4 onwards" or "introduction onwards from page 4", it means:
    1. Insert page breaks so the section STARTS on page 4
    2. ALL remaining content after that section should CONTINUE naturally
    3. Do NOT put all remaining content on one page - let it flow naturally
    4. The system will automatically split long content into multiple pages
    5. Just add ONE page break before the section, the rest will auto-paginate
  
  - Example: "Abstract on page 2, Contents on page 3, Introduction onwards from page 4":
    [Page 1 - Title/Cover]
    <div style="page-break-before: always; break-before: page;"></div>
    [Abstract content]
    <div style="page-break-before: always; break-before: page;"></div>
    [Contents/Table of Contents]
    <div style="page-break-before: always; break-before: page;"></div>
    <h1>Introduction</h1>
    [Introduction content - will auto-flow to next pages if long]
    [Chapter 1 content...]
    [Chapter 2 content...]
    [All remaining content - NO extra page breaks needed, system handles overflow]

  INPUT CONTEXT:
  The user will provide the current HTML of the document. You must return the ENTIRE document with the requested changes applied.
  `;

  const fullPrompt = `${systemInstruction}

  CURRENT DOCUMENT HTML (Images are placeholders):
  ${protectedHtml}

  USER REQUEST:
  ${userPrompt}

  Please generate the updated HTML for the document.
  `;

  try {
    // Wait for rate limit before making request
    await waitForRateLimit();
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('⏱️ Rate limit exceeded. Please wait 1 minute before trying again.\n\nGemini API free tier allows:\n• 15 requests per minute\n• 1,500 requests per day');
      }
      if (response.status === 403) {
        throw new Error('❌ API key invalid or expired. Please check your VITE_GEMINI_API_KEY in .env.local');
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Strip markdown code blocks if Gemini adds them by accident
    text = text.replace(/```html/g, '').replace(/```/g, '').trim();

    // SMART MERGE: If AI truncated, merge AI changes with original document
    const originalLength = protectedHtml.length;
    const newLength = text.length;
    
    // Count structural elements
    const originalParagraphs = (protectedHtml.match(/<p/g) || []).length;
    const newParagraphs = (text.match(/<p/g) || []).length;
    
    console.log('📊 Content validation:', {
      originalLength,
      newLength,
      lengthRatio: (newLength / originalLength * 100).toFixed(1) + '%',
      originalParagraphs,
      newParagraphs,
      willMerge: newLength < originalLength * 0.8
    });
    
    // If AI truncated (returned < 80%), use smart merge
    if (originalLength > 1000) {
      const lengthRatio = newLength / originalLength;
      
      if (lengthRatio < 0.8) {
        console.warn('⚠️ AI truncated content (returned ' + (lengthRatio * 100).toFixed(0) + '%) - attempting smart merge...');
        
        // IMPROVED MERGE STRATEGY:
        // Since AI often changes formatting/structure, we can't rely on exact text matching
        // Instead: Just append everything from original that AI didn't include
        
        // Parse both documents
        const parser = new DOMParser();
        const aiDoc = parser.parseFromString(`<div>${text}</div>`, 'text/html');
        const originalDoc = parser.parseFromString(`<div>${originalDocument}</div>`, 'text/html');
        
        const aiContainer = aiDoc.querySelector('div');
        const originalContainer = originalDoc.querySelector('div');
        
        if (!aiContainer || !originalContainer) {
          console.error('❌ Could not parse documents for merge');
          return {
            type: 'message',
            content: `⚠️ Document parsing failed. Please try a simpler edit request.`
          };
        }
        
        // Count how many elements AI returned vs original
        const aiElements = aiContainer.children.length;
        const originalElements = originalContainer.children.length;
        
        console.log('Element counts:', { aiElements, originalElements });
        
        // If AI returned less than 80% of elements, we need to merge
        if (aiElements < originalElements * 0.8) {
          console.log('Merging: AI returned', aiElements, 'of', originalElements, 'elements');
          
          // Check if last AI element is incomplete (truncated mid-element)
          const lastAiElement = aiContainer.children[aiElements - 1];
          const lastAiHtml = lastAiElement?.outerHTML || '';
          
          // If last element looks incomplete (very short or missing closing tags), remove it
          if (lastAiHtml.length < 50 || !lastAiHtml.includes('</')) {
            console.log('Removing incomplete last element from AI');
            lastAiElement?.remove();
          }
          
          // Now append ALL remaining elements from original (starting from where AI stopped)
          const startIndex = aiContainer.children.length;
          console.log('Appending elements from index', startIndex, 'to', originalElements);
          
          for (let i = startIndex; i < originalElements; i++) {
            const element = originalContainer.children[i];
            if (element) {
              aiContainer.appendChild(element.cloneNode(true));
            }
          }
          
          const mergedContent = aiContainer.innerHTML;
          
          console.log('✅ Smart merge successful:', {
            aiElementsUsed: startIndex,
            originalElements,
            appendedElements: originalElements - startIndex,
            finalElements: aiContainer.children.length,
            mergedLength: mergedContent.length
          });
          
          // Restore images in merged content
          const finalHtml = restoreImages(mergedContent, imageMap);
          
          return { 
            type: 'update', 
            content: finalHtml
          };
        } else {
          // AI returned most content, just use it
          console.log('✅ AI returned sufficient content, using as-is');
          const finalHtml = restoreImages(text, imageMap);
          return { type: 'update', content: finalHtml };
        }
      }
    }

    // 2. Restore Images
    const finalHtml = restoreImages(text, imageMap);

    return { type: 'update', content: finalHtml };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateImageForReport = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Generate an image: ${prompt}` }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content generated");

    const imagePart = parts.find((p: any) => p.inlineData);
    
    if (imagePart && imagePart.inlineData) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};
