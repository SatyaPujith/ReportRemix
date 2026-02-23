import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface TinyMCEEditorProps {
  htmlContent: string;
  onContentChange: (html: string) => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
}

declare const tinymce: any;

export const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({ 
  htmlContent, 
  onContentChange,
  editorRef 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const editorId = useRef(`tinymce-${Date.now()}`);
  const editorInstanceRef = useRef<any>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (hasInitialized.current) {
      console.log('Already initialized, skipping');
      return;
    }

    hasInitialized.current = true;
    let mounted = true;

    const initEditor = async () => {
      try {
        console.log('Starting TinyMCE initialization...');
        
        // Wait for TinyMCE library
        let attempts = 0;
        while (typeof tinymce === 'undefined' && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (typeof tinymce === 'undefined') {
          throw new Error('TinyMCE library failed to load');
        }

        if (!mounted) return;

        console.log('TinyMCE library loaded, initializing editor...');

        // Remove any existing editor with this ID
        const existing = tinymce.get(editorId.current);
        if (existing) {
          console.log('Removing existing editor');
          existing.remove();
        }

        // Initialize TinyMCE
        const editor = await tinymce.init({
          selector: `#${editorId.current}`,
          height: '100%',
          menubar: true,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | formatselect | ' +
            'bold italic underline strikethrough | forecolor backcolor | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | ' +
            'table image link | ' +
            'fontselect fontsizeselect | ' +
            'removeformat | code | fullscreen',
          font_formats: 
            'Arial=arial,helvetica,sans-serif;' +
            'Arial Black=arial black,avant garde;' +
            'Calibri=calibri,sans-serif;' +
            'Cambria=cambria,serif;' +
            'Comic Sans MS=comic sans ms,sans-serif;' +
            'Courier New=courier new,courier;' +
            'Georgia=georgia,palatino;' +
            'Times New Roman=times new roman,times;' +
            'Trebuchet MS=trebuchet ms,geneva;' +
            'Verdana=verdana,geneva',
          fontsize_formats: '8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 24pt 28pt 32pt 36pt 48pt 72pt',
          content_style: `
            body { 
              font-family: Calibri, Arial, sans-serif; 
              font-size: 11pt; 
              line-height: 1.5;
              color: #000000;
              background-color: white;
              padding: 25.4mm;
              max-width: 210mm;
              margin: 0 auto;
            }
            p { margin-bottom: 10pt; margin-top: 0; }
            h1 { font-size: 16pt; font-weight: bold; margin-bottom: 10pt; margin-top: 12pt; }
            h2 { font-size: 14pt; font-weight: bold; margin-bottom: 8pt; margin-top: 10pt; }
            h3 { font-size: 12pt; font-weight: bold; margin-bottom: 6pt; margin-top: 8pt; }
            table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
            td, th { border: 1px solid #000; padding: 4pt 8pt; }
            ul { list-style-type: disc; padding-left: 40pt; margin-bottom: 10pt; }
            ol { list-style-type: decimal; padding-left: 40pt; margin-bottom: 10pt; }
            img { max-width: 100%; height: auto; }
          `,
          setup: (ed: any) => {
            ed.on('init', () => {
              console.log('TinyMCE editor initialized successfully');
              
              // Set initial content
              if (htmlContent) {
                console.log('Setting initial content...');
                ed.setContent(htmlContent);
              }
              
              setIsLoading(false);
            });

            ed.on('change keyup', () => {
              const content = ed.getContent();
              onContentChange(content);
            });
          },
          branding: false,
          promotion: false,
          resize: false,
          statusbar: true,
          elementpath: false,
          paste_data_images: true,
          paste_as_text: false,
          paste_retain_style_properties: 'all',
          paste_merge_formats: true,
          automatic_uploads: true,
          images_upload_handler: (blobInfo: any) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject('Image upload failed');
            reader.readAsDataURL(blobInfo.blob());
          }),
        });

        if (editor && editor.length > 0) {
          editorInstanceRef.current = editor[0];
          console.log('Editor instance saved');
        }

      } catch (err) {
        console.error('TinyMCE initialization error:', err);
        if (mounted) {
          setError('Failed to initialize editor: ' + (err as Error).message);
          setIsLoading(false);
        }
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(initEditor, 100);

    return () => {
      mounted = false;
      if (editorInstanceRef.current) {
        console.log('Cleaning up editor');
        try {
          tinymce.remove(editorInstanceRef.current);
        } catch (e) {
          console.error('Error removing editor:', e);
        }
        editorInstanceRef.current = null;
      }
    };
  }, []);

  // Update content when it changes externally (from AI)
  useEffect(() => {
    if (editorInstanceRef.current && !isLoading && htmlContent) {
      const currentContent = editorInstanceRef.current.getContent();
      if (currentContent !== htmlContent) {
        console.log('Updating editor content from external source');
        editorInstanceRef.current.setContent(htmlContent);
      }
    }
  }, [htmlContent, isLoading]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-50">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-stone-900 mb-2">Editor Error</h3>
          <p className="text-sm text-stone-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-stone-800 text-white rounded hover:bg-stone-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-stone-600">Loading TinyMCE Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white" ref={editorRef}>
      <textarea
        id={editorId.current}
        defaultValue={htmlContent}
        style={{ width: '100%', height: '100%', visibility: 'hidden' }}
      />
    </div>
  );
};
