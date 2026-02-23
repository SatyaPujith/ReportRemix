import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface OnlyOfficeEditorProps {
  file: File;
  onContentChange: (html: string) => void;
  onReady: () => void;
}

declare const DocsAPI: any;

export const OnlyOfficeEditor: React.FC<OnlyOfficeEditorProps> = ({ 
  file, 
  onContentChange, 
  onReady 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const initEditor = async () => {
      try {
        if (typeof DocsAPI === 'undefined') {
          setError('ONLYOFFICE API not loaded. Please refresh the page.');
          setIsLoading(false);
          return;
        }

        // For local file editing, we need to use ONLYOFFICE in a special way
        // Since we don't have a document server, we'll use the viewer mode
        // and extract content for AI editing

        const docKey = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        const url = URL.createObjectURL(blob);

        const config = {
          documentType: 'word',
          document: {
            fileType: file.name.split('.').pop() || 'docx',
            key: docKey,
            title: file.name,
            url: url,
            permissions: {
              edit: true,
              download: true,
              print: true,
              review: true
            }
          },
          editorConfig: {
            mode: 'edit',
            lang: 'en',
            customization: {
              autosave: false,
              forcesave: false,
              compactToolbar: false,
              toolbarNoTabs: false,
              hideRightMenu: false,
              about: false,
              feedback: false
            }
          },
          width: '100%',
          height: '100%',
          type: 'desktop'
        };

        editorRef.current = new DocsAPI.DocEditor(containerRef.current.id, config);
        
        setIsLoading(false);
        onReady();

      } catch (err) {
        console.error('ONLYOFFICE init error:', err);
        setError('Failed to initialize editor: ' + (err as Error).message);
        setIsLoading(false);
      }
    };

    initEditor();

    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.destroyEditor();
        } catch (e) {
          console.warn('Error destroying editor:', e);
        }
      }
    };
  }, [file]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-50">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-stone-900 mb-2">Editor Error</h3>
          <p className="text-sm text-stone-600 mb-4">{error}</p>
          <p className="text-xs text-stone-500">
            Note: ONLYOFFICE requires a document server for full functionality. 
            For local editing without a server, consider using the built-in editor.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-stone-600">Loading ONLYOFFICE Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="onlyoffice-editor" 
      ref={containerRef}
      className="w-full h-full"
    />
  );
};
