import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ChatInterface } from './components/ChatInterface';
import { DocumentEditor } from './components/DocumentEditor'; 
import { ExportModal } from './components/ExportModal';
import { DocumentState } from './types';
import { parseWordDocument, exportToWord, generatePdf } from './services/docService';

const App: React.FC = () => {
  const [docState, setDocState] = useState<DocumentState>({
    file: null,
    name: '',
    htmlContent: '',
    isProcessing: false,
    isLoaded: false,
    lastUpdated: Date.now()
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Undo/Redo history
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isUndoRedoRef = useRef<boolean>(false);
  const MAX_HISTORY = 50;

  // Auto-close chat on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsChatOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Global keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if document is loaded
      if (!docState.isLoaded) return;
      
      // Ctrl+Z or Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z for Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [docState.isLoaded]);

  const handleFileUpload = async (file: File) => {
    console.log('File upload started:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
    setDocState(prev => ({ ...prev, isProcessing: true, name: file.name }));
    
    // Add timeout for large documents
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Document parsing timeout (30s). File may be too large or complex.')), 30000);
    });
    
    try {
      console.log('Parsing document...');
      const parsePromise = parseWordDocument(file);
      
      // Race between parsing and timeout
      let html = await Promise.race([parsePromise, timeoutPromise]) as string;
      console.log('Document parsed, HTML length:', html.length);
      
      // If parsing returns nothing (e.g. empty doc or complex structure), 
      // default to an empty editable paragraph instead of throwing an error.
      if (!html || html.trim() === "") {
        console.warn("Document parsing returned empty content. Defaulting to blank page.");
        html = "<p><br/></p>";
      }

      console.log('Setting document state...');
      
      // Use setTimeout to ensure state update happens after current execution
      setTimeout(() => {
        // Initialize history with the loaded document
        historyRef.current = [html];
        historyIndexRef.current = 0;
        
        setDocState({
          file: file,
          name: file.name,
          htmlContent: html,
          isProcessing: false,
          isLoaded: true,
          lastUpdated: Date.now()
        });
        console.log('Document loaded successfully');
      }, 0);
      
    } catch (error) {
      console.error('Document loading error:', error);
      alert(`Failed to load document: ${(error as Error).message}\n\nTry:\n- Using a smaller document\n- Removing images\n- Simplifying formatting`);
      setDocState(prev => ({ ...prev, isProcessing: false, name: '' }));
    }
  };

  const handleUpdateDocument = (newHtml: string) => {
    // Don't add to history if this is an undo/redo operation
    if (!isUndoRedoRef.current) {
      // Remove any future history if we're not at the end
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      }
      
      // Add to history (avoid duplicates)
      if (historyRef.current[historyRef.current.length - 1] !== newHtml) {
        historyRef.current.push(newHtml);
        
        // Limit history size
        if (historyRef.current.length > MAX_HISTORY) {
          historyRef.current.shift();
        }
        
        historyIndexRef.current = historyRef.current.length - 1;
      }
    }
    isUndoRedoRef.current = false;
    
    setDocState(prev => ({
        ...prev,
        htmlContent: newHtml,
        lastUpdated: Date.now()
    }));
  };
  
  // Undo function
  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      isUndoRedoRef.current = true;
      const previousContent = historyRef.current[historyIndexRef.current];
      setDocState(prev => ({
        ...prev,
        htmlContent: previousContent,
        lastUpdated: Date.now()
      }));
      console.log('Undo:', historyIndexRef.current, '/', historyRef.current.length - 1);
    }
  };
  
  // Redo function
  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      isUndoRedoRef.current = true;
      const nextContent = historyRef.current[historyIndexRef.current];
      setDocState(prev => ({
        ...prev,
        htmlContent: nextContent,
        lastUpdated: Date.now()
      }));
      console.log('Redo:', historyIndexRef.current, '/', historyRef.current.length - 1);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure? All unsaved changes will be lost.")) {
      setDocState({
        file: null,
        name: '',
        htmlContent: '',
        isProcessing: false,
        isLoaded: false,
        lastUpdated: Date.now()
      });
    }
  };

  const handleExport = async (filename: string, format: 'docx' | 'pdf') => {
    if (!docState.htmlContent) return;
    
    const cleanFilename = filename.replace(/\.(pdf|docx)$/, '');

    if (format === 'docx') {
        try {
            const blob = exportToWord(docState.htmlContent);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${cleanFilename}.docx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Docx Export failed", e);
            alert("Failed to generate Word document.");
        }
    } else {
        // PDF Export
        try {
            await generatePdf(editorRef.current, cleanFilename);
        } catch (e) {
            console.error("PDF Export failed", e);
            alert("Failed to generate PDF. Make sure all content is loaded.");
        }
    }
    
    setIsExportModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] font-sans">
      <Header 
        onReset={handleReset} 
        onExportClick={() => setIsExportModalOpen(true)} 
        docName={docState.name}
      />

      <main className="flex-1 flex overflow-hidden h-[calc(100vh-64px)]">
        {!docState.isLoaded ? (
          <UploadZone onFileAccepted={handleFileUpload} isProcessing={docState.isProcessing} />
        ) : (
          <div className="flex md:flex-row w-full h-full relative">
            {/* Desktop: Fixed sidebar, Mobile: Slide-in panel */}
            <div className={`
              w-full md:w-[400px] md:min-w-[350px] 
              border-r border-zinc-800 z-40 bg-[#111111] 
              flex flex-col shadow-2xl
              md:fixed md:left-0 md:top-16 md:bottom-0
              fixed inset-0 top-16
              transition-transform duration-300 ease-in-out
              ${isChatOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
              <ChatInterface 
                documentHtml={docState.htmlContent} 
                onUpdateDocument={handleUpdateDocument}
                isProcessing={docState.isProcessing}
              />
            </div>

            {/* Overlay for mobile when chat is open */}
            {isChatOpen && (
              <div 
                className="md:hidden fixed inset-0 bg-black/50 z-30 top-16"
                onClick={() => setIsChatOpen(false)}
              />
            )}

            {/* Document Editor */}
            <div className="flex-1 h-full overflow-hidden bg-[#0a0a0a] relative md:ml-[400px]">
               <DocumentEditor 
                  htmlContent={docState.htmlContent}
                  onContentChange={handleUpdateDocument}
                  editorRef={editorRef}
               />
            </div>

            {/* Mobile: Floating AI Button */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
            >
              {isChatOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              )}
            </button>
          </div>
        )}
      </main>

      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        initialFilename={docState.name}
      />
    </div>
  );
};

export default App;