import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { TextStyle } from '../types';

// We access the global pdfjsLib injected via CDN in index.html
declare const pdfjsLib: any;

interface TextItemWithCoords {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  normalized: string;
  // Style info
  fontName: string;
  isBold: boolean;
  isItalic: boolean;
  isSerif: boolean;
  fontSize: number;
}

// Store extracted items for searching coordinates later
let textMap: Map<number, TextItemWithCoords[]> = new Map();

// Helper to detect font properties from font family string
const analyzeFont = (fontFamily: string): { isBold: boolean, isItalic: boolean, isSerif: boolean } => {
  const lower = fontFamily.toLowerCase();
  return {
    isBold: lower.includes('bold') || lower.includes('bd') || lower.includes('heavy') || lower.includes('black') || lower.includes('demi'),
    isItalic: lower.includes('italic') || lower.includes('oblique') || lower.includes('it'),
    isSerif: lower.includes('times') || lower.includes('serif') || lower.includes('roman') || lower.includes('garamond') || lower.includes('minion') || lower.includes('cambria')
  };
};

export const loadPdfDocument = async (file: File): Promise<{ text: string, pageCount: number }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    textMap.clear();

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const { items, styles } = await page.getTextContent();
      
      const pageItems: TextItemWithCoords[] = [];
      let pageText = '';

      items.forEach((item: any) => {
        // item.transform is [scaleX, skewY, skewX, scaleY, x, y]
        const x = item.transform[4];
        const y = item.transform[5];
        const str = item.str;
        
        // Skip empty items that just mess up spacing calculations
        if (!str.trim() && item.width < 5) return;

        // Extract style
        const fontObj = styles[item.fontName];
        const fontFamily = fontObj ? fontObj.fontFamily : '';
        const { isBold, isItalic, isSerif } = analyzeFont(fontFamily);
        
        // Scale Y is usually the font size in points
        const fontSize = Math.sqrt((item.transform[0] * item.transform[0]) + (item.transform[1] * item.transform[1]));

        pageItems.push({
          str: str,
          x: x,
          y: y,
          width: item.width,
          height: item.height,
          pageIndex: i - 1,
          normalized: str.replace(/\s+/g, ''),
          fontName: item.fontName,
          isBold,
          isItalic,
          isSerif,
          fontSize
        });
        pageText += str + ' '; 
      });

      textMap.set(i - 1, pageItems);
      fullText += `\n\n--- Page ${i} ---\n${pageText}`;
    }

    return { text: fullText.trim(), pageCount: pdf.numPages };
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF.");
  }
};

export const findTextCoordinates = (pageIndex: number, searchText: string): { bbox: {x: number, y: number, width: number, height: number}, style: TextStyle } | null => {
  const items = textMap.get(pageIndex);
  if (!items || items.length === 0) return null;

  let fullNormalizedPage = "";
  const charToItemMap: number[] = [];

  items.forEach((item, index) => {
    const norm = item.normalized;
    for (let c = 0; c < norm.length; c++) {
      fullNormalizedPage += norm[c];
      charToItemMap.push(index);
    }
  });

  const searchNormalized = searchText.replace(/\s+/g, '');
  if (searchNormalized.length === 0) return null;

  const startIndex = fullNormalizedPage.indexOf(searchNormalized);
  
  if (startIndex === -1) {
    // Fallback: Try finding just the first 30 chars
    const partialSearch = searchNormalized.substring(0, 30);
    if (partialSearch.length < 5) return null;

    const partialIndex = fullNormalizedPage.indexOf(partialSearch);
    if (partialIndex !== -1) {
       const estimatedEnd = Math.min(fullNormalizedPage.length, partialIndex + searchNormalized.length);
       return calculateBoundingBoxFromIndices(items, charToItemMap, partialIndex, estimatedEnd);
    }
    return null;
  }

  const endIndex = startIndex + searchNormalized.length;
  return calculateBoundingBoxFromIndices(items, charToItemMap, startIndex, endIndex);
};

function calculateBoundingBoxFromIndices(
    items: TextItemWithCoords[], 
    charMap: number[], 
    startCharIdx: number, 
    endCharIdx: number
): { bbox: {x: number, y: number, width: number, height: number}, style: TextStyle } {
    
    const uniqueItemIndices = new Set<number>();
    for(let i = startCharIdx; i < endCharIdx; i++) {
        if (i < charMap.length) {
            uniqueItemIndices.add(charMap[i]);
        }
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Style tracking
    let totalFontSize = 0;
    let boldCount = 0;
    let italicCount = 0;
    let serifCount = 0;
    let itemCount = 0;

    uniqueItemIndices.forEach(idx => {
        const item = items[idx];
        if (item.x < minX) minX = item.x;
        if (item.y < minY) minY = item.y;
        if (item.x + item.width > maxX) maxX = item.x + item.width;
        if (item.y + item.height > maxY) maxY = item.y + item.height;
        
        totalFontSize += item.fontSize;
        if (item.isBold) boldCount++;
        if (item.isItalic) italicCount++;
        if (item.isSerif) serifCount++;
        itemCount++;
    });
    
    // Fallback height if something is weird
    const avgHeight = (maxY - minY) || 12;

    // Adjust for descenders
    minY = minY - (avgHeight * 0.25);
    maxY = maxY + (avgHeight * 0.1);

    const width = maxX - minX;
    const height = maxY - minY;
    
    // Determine dominant style
    const dominantFontSize = itemCount > 0 ? totalFontSize / itemCount : 11;
    const isBold = boldCount > (itemCount / 2);
    const isItalic = italicCount > (itemCount / 2);
    const isSerif = serifCount > (itemCount / 2);

    return {
        bbox: {
            x: minX,
            y: minY,
            width: width,
            height: height
        },
        style: {
            fontSize: dominantFontSize,
            isBold,
            isItalic,
            isSerif
        }
    };
}

export const modifyPdf = async (originalFile: File, edits: any[]): Promise<Uint8Array> => {
  const arrayBuffer = await originalFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Embed Standard Fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const helveticaBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  
  const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const timesBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  const getFont = (style: TextStyle | undefined) => {
    if (!style) return helvetica;
    
    const { isBold, isItalic, isSerif } = style;
    
    if (isSerif) {
        if (isBold && isItalic) return timesBoldItalic;
        if (isBold) return timesBold;
        if (isItalic) return timesItalic;
        return times;
    } else {
        if (isBold && isItalic) return helveticaBoldOblique;
        if (isBold) return helveticaBold;
        if (isItalic) return helveticaOblique;
        return helvetica;
    }
  };

  for (const edit of edits) {
    if (!edit.bbox) continue;

    const page = pdfDoc.getPages()[edit.pageIndex];
    const { x, y, width, height } = edit.bbox;
    const style = edit.style;
    
    // Default to white if not provided
    const bg = edit.backgroundColor || { r: 1, g: 1, b: 1 };

    // 1. Draw rectangle to erase (using sampled or default white)
    page.drawRectangle({
      x: x - 1,
      y: y - 1, 
      width: width + 2,
      height: height + 2,
      color: rgb(bg.r, bg.g, bg.b),
      opacity: 1,
    });

    // 2. Select Font and Size
    const font = getFont(style);
    let fontSize = style?.fontSize || 11;
    
    if (fontSize < 6) fontSize = 6;
    if (fontSize > 100) fontSize = 100;

    const textOptions = {
      x: x,
      // Adjust y for baseline. PDF coordinate y is usually the baseline in drawText,
      // but our bbox y is the bottom descender.
      // We moved y down by 0.25 * height in findTextCoordinates.
      // So baseline is roughly y + (height * 0.25).
      y: y + (fontSize * 0.25), 
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
      maxWidth: width + 10, 
      lineHeight: fontSize * 1.2,
    };
    
    page.drawText(edit.newText, textOptions);
  }

  return await pdfDoc.save();
};