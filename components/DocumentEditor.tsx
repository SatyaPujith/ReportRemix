
import React, { useEffect, useRef, useState } from 'react';
import { 
  Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, List, ListOrdered,
  Square, RefreshCw, Type, Palette
} from 'lucide-react';
import { paginateHtml } from '../services/docService';

interface DocumentEditorProps {
  htmlContent: string;
  onContentChange: (newHtml: string) => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
}

const ToolbarButton: React.FC<{ 
    icon: React.ReactNode, 
    onClick: () => void, 
    active?: boolean,
    title?: string 
}> = ({ icon, onClick, active, title }) => (
    <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        className={`p-1.5 rounded transition-all ${
            active 
            ? 'bg-gray-200 text-gray-900' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
        title={title}
    >
        {icon}
    </button>
);

const FONTS = [
  'Arial',
  'Arial Black',
  'Calibri',
  'Cambria',
  'Candara',
  'Century Gothic',
  'Comic Sans MS',
  'Consolas',
  'Courier New',
  'Georgia',
  'Impact',
  'Lucida Console',
  'Lucida Sans Unicode',
  'Palatino Linotype',
  'Segoe UI',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana'
];

const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ htmlContent, onContentChange, editorRef }) => {
  const [pages, setPages] = useState<string[]>([]);
  const [showBorder, setShowBorder] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Calibri');
  const [selectedSize, setSelectedSize] = useState('11');
  const [textColor, setTextColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Store the last selection to restore after dropdown clicks
  const savedSelection = useRef<Range | null>(null);
  
  // Refs to store live content of each page
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Debounce timer for repagination
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Image resize state
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const resizeStartRef = useRef<{ width: number; height: number; x: number; y: number } | null>(null);

  // Initial pagination on load / external update
  useEffect(() => {
    const doPagination = async () => {
        if (!htmlContent) {
            setPages([]);
            return;
        }

        setIsPaginating(true);
        try {
            const newPages = await paginateHtml(htmlContent);
            setPages(newPages);
        } catch (e) {
            console.error("Pagination failed", e);
            // Fallback: Show raw content
            setPages([htmlContent]);
        } finally {
            setIsPaginating(false);
        }
    };
    doPagination();
  }, [htmlContent]);
  
  // Setup image handlers
  useEffect(() => {
    pageRefs.current.forEach(pageRef => {
      if (pageRef) {
        const images = pageRef.querySelectorAll('img');
        images.forEach(img => {
          const htmlImg = img as HTMLImageElement;
          // Keep images editable so spacebar works for positioning
          htmlImg.draggable = false;
          
          // Add double-click to reset size
          htmlImg.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            htmlImg.style.width = '';
            htmlImg.style.height = 'auto';
            const pageIndex = pageRefs.current.findIndex(ref => ref && ref.contains(htmlImg));
            if (pageIndex !== -1) {
              handleInput(pageIndex);
            }
          });
        });
      }
    });
  }, [pages]);

  const handleInput = (pageIndex: number) => {
    // 1. Clear existing debounce
    if (debounceRef.current) {
        clearTimeout(debounceRef.current);
    }

    // 2. Set new debounce to save/repaginate (reduced to 500ms for better responsiveness)
    debounceRef.current = setTimeout(async () => {
        // Collect full HTML from all pages
        // Insert page break markers between pages to preserve pagination
        const pageBreakMarker = '<div style="page-break-before: always; break-before: page;"></div>';
        
        const fullHtml = pageRefs.current
            .filter(ref => ref !== null)
            .map(ref => ref?.innerHTML || '')
            .join(pageBreakMarker); 
        
        if (fullHtml) {
            onContentChange(fullHtml); 
        }
    }, 500); 
  };

  const insertPageBreak = () => {
    // Find which page has focus
    const activeElement = document.activeElement;
    const pageIndex = pageRefs.current.findIndex(ref => ref && ref.contains(activeElement));
    
    if (pageIndex === -1 && pageRefs.current[0]) {
      pageRefs.current[0].focus();
    }
    
    // Insert a page break marker
    const pageBreakHtml = '<div class="page-break-marker" style="page-break-after: always; break-after: page; border-top: 2px dashed #d6d3d1; margin: 2em 0; padding-top: 0.5em; color: #a8a29e; font-size: 0.75em; text-align: center;">Page Break</div>';
    document.execCommand('insertHTML', false, pageBreakHtml);
    
    // Trigger save
    if (pageIndex !== -1) {
      handleInput(pageIndex);
    }
  };

  // Save current selection
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedSelection.current = range.cloneRange();
      console.log('Selection saved:', {
        collapsed: range.collapsed,
        text: range.toString()
      });
    } else {
      console.log('No selection to save');
    }
  };

  // Restore saved selection
  const restoreSelection = () => {
    if (savedSelection.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection.current);
        console.log('Selection restored:', {
          collapsed: savedSelection.current.collapsed,
          text: savedSelection.current.toString()
        });
        return true;
      }
    }
    console.log('No saved selection to restore');
    return false;
  };

  const changeFontFamily = (font: string) => {
    setSelectedFont(font);
    
    console.log('Changing font to:', font);
    
    // Restore selection first
    const restored = restoreSelection();
    if (!restored) {
      console.log('Could not restore selection');
      return;
    }
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      console.log('No selection after restore');
      return;
    }
    
    const range = selection.getRangeAt(0);
    console.log('Range after restore:', {
      collapsed: range.collapsed,
      text: range.toString()
    });
    
    // If no text selected (cursor position), set format for next typing
    if (range.collapsed) {
      console.log('Collapsed range - using execCommand');
      document.execCommand('fontName', false, font);
      return;
    }
    
    try {
      console.log('Wrapping selected text in span');
      // Text is selected - wrap it
      const span = document.createElement('span');
      span.style.fontFamily = font;
      
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
      
      console.log('Font applied successfully');
      
      // Keep the text selected so user can apply more formatting
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      // Save this new selection for next format operation
      savedSelection.current = newRange.cloneRange();
      
      // Force immediate save (no debounce for formatting)
      const pageIndex = pageRefs.current.findIndex(ref => ref && ref.contains(span));
      if (pageIndex !== -1) {
        const fullHtml = pageRefs.current
          .filter(ref => ref !== null)
          .map(ref => ref?.innerHTML || '')
          .join('');
        
        if (fullHtml) {
          onContentChange(fullHtml);
          console.log('Font change saved to state');
        }
      }
    } catch (e) {
      console.error('Font change error:', e);
    }
  };

  const changeFontSize = (size: string) => {
    setSelectedSize(size);
    
    // Restore selection first
    restoreSelection();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    
    const range = selection.getRangeAt(0);
    
    // If no text selected (cursor position), set format for next typing
    if (range.collapsed) {
      document.execCommand('fontSize', false, '7');
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          let node = sel.anchorNode.parentElement;
          while (node && node.tagName !== 'FONT') {
            node = node.parentElement;
          }
          if (node && node.tagName === 'FONT') {
            const span = document.createElement('span');
            span.style.fontSize = size + 'pt';
            span.innerHTML = node.innerHTML;
            node.replaceWith(span);
          }
        }
      }, 10);
      return;
    }
    
    try {
      // Text is selected - wrap it
      const span = document.createElement('span');
      span.style.fontSize = size + 'pt';
      
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
      
      // Keep the text selected so user can apply more formatting
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      // Save this new selection for next format operation
      savedSelection.current = newRange.cloneRange();
      
      // Force immediate save
      const pageIndex = pageRefs.current.findIndex(ref => ref && ref.contains(span));
      if (pageIndex !== -1) {
        const fullHtml = pageRefs.current
          .filter(ref => ref !== null)
          .map(ref => ref?.innerHTML || '')
          .join('');
        
        if (fullHtml) {
          onContentChange(fullHtml);
        }
      }
    } catch (e) {
      console.error('Font size error:', e);
    }
  };

  const changeTextColor = (color: string) => {
    setTextColor(color);
    setShowColorPicker(false);
    
    console.log('changeTextColor called with:', color);
    
    // Restore the saved selection
    if (!savedSelection.current) {
      console.log('No saved selection!');
      return;
    }
    
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedSelection.current.cloneRange());
      console.log('Selection restored for color change');
    }
    
    if (!selection || selection.rangeCount === 0) {
      console.log('No selection after restore');
      return;
    }
    
    const range = selection.getRangeAt(0);
    console.log('Range:', { collapsed: range.collapsed, text: range.toString() });
    
    // If no text selected (cursor position), set format for next typing
    if (range.collapsed) {
      console.log('Using execCommand for collapsed range');
      document.execCommand('foreColor', false, color);
      return;
    }
    
    try {
      console.log('Wrapping selected text with color:', color);
      
      // Text is selected - wrap it
      const span = document.createElement('span');
      span.style.color = color;
      span.style.setProperty('color', color, 'important'); // Force color
      
      const fragment = range.extractContents();
      span.appendChild(fragment);
      
      // Apply color to all nested elements too
      const allElements = span.querySelectorAll('*');
      allElements.forEach(el => {
        (el as HTMLElement).style.color = color;
        (el as HTMLElement).style.setProperty('color', color, 'important');
      });
      
      range.insertNode(span);
      
      console.log('Color applied to span and', allElements.length, 'nested elements');
      
      // Keep the text selected
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(newRange);
      savedSelection.current = newRange.cloneRange();
      
      // Force immediate save
      const pageIndex = pageRefs.current.findIndex(ref => ref && ref.contains(span));
      if (pageIndex !== -1) {
        const fullHtml = pageRefs.current
          .filter(ref => ref !== null)
          .map(ref => ref?.innerHTML || '')
          .join('');
        
        if (fullHtml) {
          onContentChange(fullHtml);
          console.log('Color change saved, HTML length:', fullHtml.length);
        }
      }
    } catch (e) {
      console.error('Color change error:', e);
    }
  };

  const applyHighlight = (color: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    
    const range = selection.getRangeAt(0);
    
    // If no text selected (cursor position), set format for next typing
    if (range.collapsed) {
      document.execCommand('backColor', false, color);
      return;
    }
    
    try {
      // Text is selected - wrap it
      const span = document.createElement('span');
      span.style.backgroundColor = color;
      
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
      
      // Reselect
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      // Find which page and save
      const pageIndex = pageRefs.current.findIndex(ref => ref && ref.contains(span));
      if (pageIndex !== -1) {
        setTimeout(() => handleInput(pageIndex), 10);
      }
    } catch (e) {
      console.error('Highlight error:', e);
    }
  };

  const execCmd = (command: string, value: string = '') => {
    // Focus the editor first if not focused
    const activeElement = document.activeElement;
    const isInEditor = pageRefs.current.some(ref => ref && ref.contains(activeElement));
    
    if (!isInEditor && pageRefs.current[0]) {
      pageRefs.current[0].focus();
      return;
    }
    
    // Execute the command
    document.execCommand(command, false, value);
    
    // For alignment commands, ensure inline styles are applied
    if (command.startsWith('justify')) {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          let element = range.commonAncestorContainer as HTMLElement;
          
          // Find the block-level parent
          while (element && element.nodeType !== 1) {
            element = element.parentElement as HTMLElement;
          }
          
          while (element && !['P', 'H1', 'H2', 'H3', 'DIV', 'LI', 'TD', 'TH'].includes(element.tagName)) {
            element = element.parentElement as HTMLElement;
          }
          
          if (element && !element.classList.contains('document-page')) {
            const alignMap: {[key: string]: string} = {
              'justifyLeft': 'left',
              'justifyCenter': 'center',
              'justifyRight': 'right',
              'justifyFull': 'justify'
            };
            
            const alignValue = alignMap[command];
            if (alignValue) {
              element.style.textAlign = alignValue;
              const pageIndex = pageRefs.current.findIndex(ref => ref && ref.contains(element));
              if (pageIndex !== -1) {
                setTimeout(() => handleInput(pageIndex), 100);
              }
            }
          }
        }
      }, 10);
    }
    
    // Trigger save for other commands
    if (!command.startsWith('justify')) {
      const pageIndex = pageRefs.current.findIndex(ref => ref && ref.contains(activeElement));
      if (pageIndex !== -1) {
        setTimeout(() => handleInput(pageIndex), 100);
      }
    }
  };

  const [zoom, setZoom] = useState(100);

  return (
    <div className="flex flex-col h-full relative">
        {/* Helper Banner - Hidden on mobile */}
        <div className="hidden lg:block bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs text-gray-700 fixed top-16 right-0 md:left-[400px] left-0 z-30">
          <strong>💡 Tip:</strong> Select text to format, or set style before typing new text. Use Ctrl+Scroll to zoom.
        </div>
        
        {/* Formatting Toolbar - Fixed at top, scrollable on mobile */}
        <div className="bg-white border-b border-gray-200 shadow-sm fixed lg:top-[88px] top-16 right-0 md:left-[400px] left-0 z-20 shrink-0 overflow-x-auto">
            {/* First Row - Font and Size */}
            <div className="h-10 flex items-center px-2 md:px-4 gap-1 md:gap-2 border-b border-stone-100 min-w-max">
                <select 
                    value={selectedFont}
                    onMouseDown={(e) => {
                      // Save selection before dropdown opens
                      saveSelection();
                    }}
                    onChange={(e) => {
                      const font = e.target.value;
                      changeFontFamily(font);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none bg-white hover:border-gray-400 transition-colors"
                    style={{ width: '140px' }}
                    title="Font Family"
                >
                    {FONTS.map(font => (
                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                    ))}
                </select>
                
                <select 
                    value={selectedSize}
                    onMouseDown={(e) => {
                      // Save selection before dropdown opens
                      saveSelection();
                    }}
                    onChange={(e) => {
                      const size = e.target.value;
                      changeFontSize(size);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none bg-white hover:border-gray-400 transition-colors"
                    style={{ width: '70px' }}
                    title="Font Size"
                >
                    {FONT_SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                    ))}
                </select>

                <div className="flex items-center gap-1 pl-2 border-l border-stone-200">
                    {/* Text Color - Show colors directly like highlight */}
                    <div className="relative group">
                        <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              saveSelection();
                              console.log('Color button mousedown - selection saved');
                            }}
                            onMouseEnter={() => {
                              saveSelection();
                              console.log('Color button hover - selection saved');
                            }}
                            className="p-1.5 rounded transition-colors text-stone-600 hover:bg-stone-100 hover:text-stone-900 flex items-center gap-1"
                            title="Text Color"
                        >
                            <Type size={18} />
                            <div className="w-5 h-3 rounded border border-stone-300" style={{ backgroundColor: textColor }}></div>
                        </button>
                        <div className="hidden group-hover:block absolute top-full left-0 mt-1 p-3 bg-white border-2 border-stone-400 rounded-lg shadow-2xl z-50 min-w-[200px]">
                            <div className="text-xs font-semibold text-stone-700 mb-2">Text Color</div>
                            <div className="grid grid-cols-6 gap-1.5">
                                {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
                                  '#FF00FF', '#00FFFF', '#800000', '#808080', '#008000', '#000080',
                                  '#FFA500', '#FFC0CB', '#A52A2A', '#DDA0DD', '#40E0D0', '#90EE90'].map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          console.log('Color clicked:', color);
                                        }}
                                        onClick={() => {
                                          console.log('Applying color:', color);
                                          changeTextColor(color);
                                        }}
                                        className="w-8 h-8 rounded border-2 border-stone-300 hover:scale-110 hover:border-stone-600 transition-all"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* OLD COLOR PICKER - REMOVE THIS */}
                    <div className="relative" style={{ display: 'none' }}>
                        <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              saveSelection();
                            }}
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="p-1.5 rounded transition-colors text-stone-600 hover:bg-stone-100 hover:text-stone-900 flex items-center gap-1"
                            title="Text Color (OLD)"
                        >
                            <Type size={18} />
                            <div className="w-5 h-3 rounded border border-stone-300" style={{ backgroundColor: textColor }}></div>
                        </button>
                        {showColorPicker && (
                            <div className="absolute top-full left-0 mt-1 p-3 bg-white border-2 border-stone-400 rounded-lg shadow-2xl z-50 min-w-[240px]">
                                <div className="text-xs font-semibold text-stone-700 mb-2">Text Color</div>
                                <div className="grid grid-cols-8 gap-1.5 mb-3">
                                    {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                                      '#800000', '#808080', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0',
                                      '#FFA500', '#FFC0CB', '#A52A2A', '#DDA0DD', '#40E0D0', '#F0E68C', '#90EE90', '#D3D3D3'].map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => changeTextColor(color)}
                                            className="w-7 h-7 rounded border-2 border-stone-300 hover:scale-110 hover:border-stone-600 transition-all"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                                <div className="border-t border-stone-200 pt-2">
                                    <label className="text-xs text-stone-600 block mb-1">Custom Color:</label>
                                    <input
                                        type="color"
                                        value={textColor}
                                        onChange={(e) => changeTextColor(e.target.value)}
                                        className="w-full h-10 rounded cursor-pointer border border-stone-300"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowColorPicker(false)}
                                    className="mt-2 w-full px-3 py-1 text-xs bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="relative group">
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            className="p-1.5 rounded transition-colors text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                            title="Highlight"
                        >
                            <Palette size={18} />
                        </button>
                        <div className="hidden group-hover:block absolute top-full left-0 mt-1 p-3 bg-white border-2 border-stone-400 rounded-lg shadow-2xl z-50 min-w-[200px]">
                            <div className="text-xs font-semibold text-stone-700 mb-2">Highlight Color</div>
                            <div className="grid grid-cols-4 gap-1.5">
                                {[
                                  { color: 'transparent', label: 'None' },
                                  { color: '#FFFF00', label: 'Yellow' },
                                  { color: '#00FF00', label: 'Green' },
                                  { color: '#00FFFF', label: 'Cyan' },
                                  { color: '#FF00FF', label: 'Magenta' },
                                  { color: '#FFA500', label: 'Orange' },
                                  { color: '#FFB6C1', label: 'Pink' },
                                  { color: '#90EE90', label: 'Light Green' }
                                ].map(({ color, label }) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => applyHighlight(color)}
                                        className="w-10 h-10 rounded border-2 border-stone-300 hover:scale-110 hover:border-stone-600 transition-all"
                                        style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
                                        title={label}
                                    >
                                      {color === 'transparent' && <span className="text-xs text-stone-400">✕</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Row - Formatting */}
            <div className="h-10 flex items-center px-2 md:px-4 gap-1 md:gap-2 min-w-max">
                <div className="flex items-center gap-1 pr-3 border-r border-stone-200">
                    <ToolbarButton icon={<Heading1 size={18}/>} onClick={() => execCmd('formatBlock', 'H1')} title="Heading 1" />
                    <ToolbarButton icon={<Heading2 size={18}/>} onClick={() => execCmd('formatBlock', 'H2')} title="Heading 2" />
                    <ToolbarButton icon={<span className="font-serif font-bold text-sm px-1">P</span>} onClick={() => execCmd('formatBlock', 'P')} title="Paragraph" />
                </div>
                
                <div className="flex items-center gap-1 pr-3 border-r border-stone-200">
                    <ToolbarButton icon={<Bold size={18}/>} onClick={() => execCmd('bold')} title="Bold (Ctrl+B)" />
                    <ToolbarButton icon={<Italic size={18}/>} onClick={() => execCmd('italic')} title="Italic (Ctrl+I)" />
                    <ToolbarButton icon={<Underline size={18}/>} onClick={() => execCmd('underline')} title="Underline (Ctrl+U)" />
                </div>

                <div className="flex items-center gap-1 pr-3 border-r border-stone-200">
                    <ToolbarButton icon={<AlignLeft size={18}/>} onClick={() => execCmd('justifyLeft')} title="Align Left" />
                    <ToolbarButton icon={<AlignCenter size={18}/>} onClick={() => execCmd('justifyCenter')} title="Align Center" />
                    <ToolbarButton icon={<AlignRight size={18}/>} onClick={() => execCmd('justifyRight')} title="Align Right" />
                    <ToolbarButton icon={<AlignJustify size={18}/>} onClick={() => execCmd('justifyFull')} title="Justify" />
                </div>

                <div className="flex items-center gap-1 pr-3 border-r border-stone-200">
                    <ToolbarButton icon={<List size={18}/>} onClick={() => execCmd('insertUnorderedList')} title="Bullet List" />
                    <ToolbarButton icon={<ListOrdered size={18}/>} onClick={() => execCmd('insertOrderedList')} title="Numbered List" />
                </div>

                <div className="flex items-center gap-1">
                    <ToolbarButton 
                        icon={<Square size={18} strokeWidth={showBorder ? 2.5 : 1.5} />} 
                        onClick={() => setShowBorder(!showBorder)} 
                        active={showBorder}
                        title="Toggle Page Border" 
                    />
                </div>
                
                 {isPaginating && (
                    <div className="ml-auto flex items-center gap-2 text-xs text-stone-400">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span className="hidden md:inline">Reflowing...</span>
                    </div>
                )}
            </div>
        </div>

        {/* Editor Area - Scrollable with padding for fixed toolbar and banner, with zoom support */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-auto bg-stone-200 p-2 md:p-8 flex justify-center" 
          style={{ 
            paddingTop: window.innerWidth >= 1024 ? '150px' : '70px'
          }}
          onWheel={(e) => {
            // Ctrl/Cmd + Scroll to zoom
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -10 : 10;
              setZoom(prev => Math.max(25, Math.min(200, prev + delta)));
            }
          }}
        >
          <div 
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.1s ease-out'
            }}
          >
            {/* Pages Container */}
            <div 
                ref={editorRef} 
                className="flex flex-col gap-4 md:gap-8 pb-10" // Gap creates the visual separation between pages
            >
                {pages.map((pageHtml, index) => (
                    <div key={index} className="relative group">
                        {/* A4 Page - Responsive width on mobile */}
                        <div 
                            className={`bg-white shadow-xl min-h-[297mm] w-full md:w-[210mm] max-w-[210mm] outline-none document-page ${showBorder ? 'has-page-border' : ''}`}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={() => handleInput(index)}
                            onKeyDown={(e) => {
                              // Keyboard shortcuts
                              if (e.ctrlKey || e.metaKey) {
                                if (e.key === 'b') {
                                  e.preventDefault();
                                  execCmd('bold');
                                } else if (e.key === 'i') {
                                  e.preventDefault();
                                  execCmd('italic');
                                } else if (e.key === 'u') {
                                  e.preventDefault();
                                  execCmd('underline');
                                }
                              }
                            }}
                            onClick={(e) => {
                              const target = e.target as HTMLElement;
                              if (target.tagName === 'IMG') {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                const img = target as HTMLImageElement;
                                img.draggable = false;
                                
                                // Add resize overlay
                                const overlay = document.createElement('div');
                                overlay.className = 'image-resize-overlay';
                                overlay.style.cssText = `
                                  position: absolute;
                                  border: 2px solid #2563eb;
                                  pointer-events: none;
                                  z-index: 1000;
                                `;
                                
                                const rect = img.getBoundingClientRect();
                                const pageRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                
                                overlay.style.left = (rect.left - pageRect.left) + 'px';
                                overlay.style.top = (rect.top - pageRect.top) + 'px';
                                overlay.style.width = rect.width + 'px';
                                overlay.style.height = rect.height + 'px';
                                
                                // Add resize handles
                                ['nw', 'ne', 'sw', 'se'].forEach(pos => {
                                  const handle = document.createElement('div');
                                  handle.className = `resize-handle resize-handle-${pos}`;
                                  handle.style.cssText = `
                                    position: absolute;
                                    width: 10px;
                                    height: 10px;
                                    background: #2563eb;
                                    border: 2px solid white;
                                    border-radius: 50%;
                                    pointer-events: all;
                                    cursor: ${pos}-resize;
                                  `;
                                  
                                  if (pos === 'nw') { handle.style.top = '-5px'; handle.style.left = '-5px'; }
                                  if (pos === 'ne') { handle.style.top = '-5px'; handle.style.right = '-5px'; }
                                  if (pos === 'sw') { handle.style.bottom = '-5px'; handle.style.left = '-5px'; }
                                  if (pos === 'se') { handle.style.bottom = '-5px'; handle.style.right = '-5px'; }
                                  
                                  handle.onmousedown = (handleEvent) => {
                                    handleEvent.preventDefault();
                                    handleEvent.stopPropagation();
                                    
                                    const startX = handleEvent.clientX;
                                    const startWidth = img.offsetWidth;
                                    
                                    const onMouseMove = (moveEvent: MouseEvent) => {
                                      const deltaX = moveEvent.clientX - startX;
                                      let newWidth = startWidth + (pos.includes('e') ? deltaX : -deltaX);
                                      
                                      if (newWidth < 50) newWidth = 50;
                                      if (newWidth > 800) newWidth = 800;
                                      
                                      img.style.width = newWidth + 'px';
                                      img.style.height = 'auto';
                                      
                                      // Update overlay
                                      const newRect = img.getBoundingClientRect();
                                      overlay.style.left = (newRect.left - pageRect.left) + 'px';
                                      overlay.style.top = (newRect.top - pageRect.top) + 'px';
                                      overlay.style.width = newRect.width + 'px';
                                      overlay.style.height = newRect.height + 'px';
                                    };
                                    
                                    const onMouseUp = () => {
                                      document.removeEventListener('mousemove', onMouseMove);
                                      document.removeEventListener('mouseup', onMouseUp);
                                      overlay.remove();
                                      handleInput(index);
                                    };
                                    
                                    document.addEventListener('mousemove', onMouseMove);
                                    document.addEventListener('mouseup', onMouseUp);
                                  };
                                  
                                  overlay.appendChild(handle);
                                });
                                
                                // Remove existing overlays
                                document.querySelectorAll('.image-resize-overlay').forEach(el => el.remove());
                                
                                // Add new overlay
                                (e.currentTarget as HTMLElement).appendChild(overlay);
                                
                                // Remove overlay on click outside
                                const removeOverlay = (clickEvent: MouseEvent) => {
                                  if (!overlay.contains(clickEvent.target as Node) && clickEvent.target !== img) {
                                    overlay.remove();
                                    document.removeEventListener('click', removeOverlay);
                                  }
                                };
                                setTimeout(() => document.addEventListener('click', removeOverlay), 100);
                              }
                            }}
                            ref={(el) => { pageRefs.current[index] = el; }}
                            dangerouslySetInnerHTML={{ __html: pageHtml }}
                            data-page-number={index + 1}
                            style={{
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                ))}
                
                {pages.length === 0 && !isPaginating && (
                     <div className="text-center text-stone-400 mt-10 max-w-sm mx-auto">
                        <p className="font-serif text-lg mb-2">No content visible.</p>
                        <p className="text-sm">The document may be empty or failed to render. Try typing here to start fresh.</p>
                        {/* Invisible box to allow clicking to start typing if truly empty */}
                        <div 
                           className="bg-white/50 border border-dashed border-stone-300 h-32 w-full mt-4 rounded flex items-center justify-center cursor-text hover:bg-white transition-colors"
                           onClick={() => onContentChange("<p>Start typing...</p>")}
                        >
                            <span className="text-xs uppercase tracking-widest text-stone-500">Click to Initialize</span>
                        </div>
                     </div>
                )}
            </div>
          </div>
        </div>
    </div>
  );
};
