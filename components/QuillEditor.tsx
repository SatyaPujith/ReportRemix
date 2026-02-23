import React, { useEffect, useRef } from 'react';

interface QuillEditorProps {
  htmlContent: string;
  onContentChange: (html: string) => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
}

declare const Quill: any;

export const QuillEditor: React.FC<QuillEditorProps> = ({ 
  htmlContent, 
  onContentChange,
  editorRef 
}) => {
  const quillRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    console.log('Initializing Quill editor...');

    // Register custom fonts
    const Font = Quill.import('formats/font');
    Font.whitelist = [
      'arial', 'calibri', 'cambria', 'comic-sans', 'courier-new', 
      'georgia', 'helvetica', 'lucida', 'times-new-roman', 
      'trebuchet', 'verdana'
    ];
    Quill.register(Font, true);

    // Initialize Quill
    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          [{ 'font': [
            'arial', 'calibri', 'cambria', 'comic-sans', 'courier-new',
            'georgia', 'helvetica', 'lucida', 'times-new-roman',
            'trebuchet', 'verdana'
          ] }],
          [{ 'size': ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '24pt'] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'align': [] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          ['link', 'image'],
          ['clean']
        ]
      },
      placeholder: 'Start editing your document...',
    });

    quillRef.current = quill;

    // Set initial content
    if (htmlContent) {
      console.log('Setting initial content, length:', htmlContent.length);
      const delta = quill.clipboard.convert(htmlContent);
      quill.setContents(delta);
    }

    // Listen for changes
    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      onContentChange(html);
    });

    console.log('Quill editor initialized successfully');

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []);

  // Update content when it changes externally (from AI)
  useEffect(() => {
    if (quillRef.current && htmlContent) {
      const currentHtml = quillRef.current.root.innerHTML;
      if (currentHtml !== htmlContent) {
        console.log('Updating editor content from external source');
        const delta = quillRef.current.clipboard.convert(htmlContent);
        quillRef.current.setContents(delta);
      }
    }
  }, [htmlContent]);

  return (
    <div className="h-full w-full bg-white flex flex-col" ref={editorRef}>
      <div 
        ref={containerRef} 
        className="flex-1 overflow-auto"
        style={{ height: '100%' }}
      />
    </div>
  );
};
