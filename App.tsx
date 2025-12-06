import React, { useState, useRef } from 'react';
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
  const editorRef = useRef<HTMLDivElement>(null);

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
    setDocState(prev => ({
        ...prev,
        htmlContent: newHtml,
        lastUpdated: Date.now()
    }));
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
    <div className="min-h-screen flex flex-col bg-stone-100 font-sans">
      <Header 
        onReset={handleReset} 
        onExportClick={() => setIsExportModalOpen(true)} 
        docName={docState.name}
      />

      <main className="flex-1 flex overflow-hidden h-[calc(100vh-64px)]">
        {!docState.isLoaded ? (
          <UploadZone onFileAccepted={handleFileUpload} isProcessing={docState.isProcessing} />
        ) : (
          <div className="flex w-full h-full">
            <div className="w-[400px] min-w-[350px] border-r border-stone-200 z-30 bg-white flex flex-col shadow-xl fixed left-0 top-16 bottom-0">
              <ChatInterface 
                documentHtml={docState.htmlContent} 
                onUpdateDocument={handleUpdateDocument}
                isProcessing={docState.isProcessing}
              />
            </div>

            <div className="flex-1 h-full overflow-hidden bg-stone-200 relative ml-[400px]">
               <DocumentEditor 
                  htmlContent={docState.htmlContent}
                  onContentChange={handleUpdateDocument}
                  editorRef={editorRef}
               />
            </div>
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