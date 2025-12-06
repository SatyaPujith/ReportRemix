import React, { useCallback } from 'react';
import { Upload, FileType } from 'lucide-react';

interface UploadZoneProps {
  onFileAccepted: (file: File) => void;
  isProcessing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileAccepted, isProcessing }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.docx')) {
          onFileAccepted(file);
        } else {
          alert('Please upload a valid Word (.docx) file.');
        }
      }
    },
    [onFileAccepted]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.name.endsWith('.docx')) {
            onFileAccepted(file);
        } else {
            alert('Please upload a valid Word (.docx) file.');
        }
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col items-center justify-center p-8 bg-stone-50"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white p-16 rounded shadow-2xl shadow-stone-200 border border-stone-200 hover:border-stone-400 transition-all duration-300 cursor-pointer group relative overflow-hidden">
            <input 
                type="file" 
                accept=".docx"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleFileInput}
                disabled={isProcessing}
            />
          
          {isProcessing ? (
             <div className="flex flex-col items-center py-4">
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-stone-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-stone-800 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <h3 className="text-2xl font-serif font-medium text-stone-900 mb-2">Importing Document</h3>
                <p className="text-stone-500 font-light mb-4">Converting Word to editable format...</p>
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-pulse"></div>
                  <span>This may take a moment for large documents</span>
                </div>
             </div>
          ) : (
            <>
                <div className="w-24 h-24 rounded-full bg-stone-50 flex items-center justify-center mx-auto mb-8 border border-stone-100 group-hover:bg-stone-100 transition-colors">
                    <Upload className="w-10 h-10 text-stone-600 group-hover:text-stone-900 transition-colors" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl font-serif text-stone-900 mb-4">Upload Word Document</h2>
                <p className="text-stone-500 mb-10 text-lg leading-relaxed font-light max-w-lg mx-auto">
                    Drag & drop your <strong>.docx</strong> file here. <br/>
                    We'll let you edit it directly with AI assistance.
                </p>
                <div className="inline-flex items-center gap-3 text-sm font-medium text-stone-600 border border-stone-200 bg-stone-50 px-5 py-2.5 rounded-full">
                    <FileType size={16} className="text-stone-400" />
                    <span>Supports .docx files</span>
                </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};