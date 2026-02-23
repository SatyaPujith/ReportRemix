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
      className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[#0a0a0a]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="max-w-2xl w-full text-center">
        <div className="bg-[#111111] p-8 md:p-16 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all duration-300 cursor-pointer group relative overflow-hidden">
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
                  <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-4 border-zinc-800"></div>
                  <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-4 border-white border-t-transparent absolute top-0 left-0"></div>
                </div>
                <h3 className="text-xl md:text-2xl font-serif font-medium text-white mb-2">Importing Document</h3>
                <p className="text-zinc-400 font-light mb-4 text-sm md:text-base">Converting Word to editable format...</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <div className="w-2 h-2 bg-zinc-500 rounded-full animate-pulse"></div>
                  <span>This may take a moment for large documents</span>
                </div>
             </div>
          ) : (
            <>
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-6 md:mb-8 border border-zinc-800 group-hover:bg-zinc-800 transition-colors">
                    <Upload className="w-8 h-8 md:w-10 md:h-10 text-zinc-400 group-hover:text-white transition-colors" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl md:text-3xl font-serif text-white mb-3 md:mb-4">Upload Word Document</h2>
                <p className="text-zinc-400 mb-6 md:mb-10 text-base md:text-lg leading-relaxed font-light max-w-lg mx-auto px-4">
                    Drag & drop your <strong className="text-white">.docx</strong> file here. <br className="hidden md:block"/>
                    We'll let you edit it directly with AI assistance.
                </p>
                <div className="inline-flex items-center gap-3 text-xs md:text-sm font-medium text-zinc-400 border border-zinc-800 bg-zinc-900 px-4 md:px-5 py-2 md:py-2.5 rounded-full">
                    <FileType size={16} className="text-zinc-500" />
                    <span>Supports .docx files</span>
                </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};