
import React, { useState } from 'react';
import { X, FileText, FileType } from 'lucide-react';
import { Button } from './Button';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filename: string, format: 'docx' | 'pdf') => void;
  initialFilename: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, initialFilename }) => {
  const [filename, setFilename] = useState(initialFilename.replace(/\.docx$/, ''));
  const [format, setFormat] = useState<'docx' | 'pdf'>('docx');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111111] rounded-lg shadow-xl border border-zinc-800 w-full max-w-md p-5 md:p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-serif font-bold text-white">Export Document</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Filename</label>
            <input 
              type="text" 
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded focus:ring-1 focus:ring-zinc-700 focus:border-zinc-700 outline-none text-white"
              placeholder="My Document"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setFormat('docx')}
                className={`flex items-center justify-center gap-2 p-3 rounded border transition-all ${
                  format === 'docx' 
                    ? 'bg-zinc-900 border-white ring-1 ring-white' 
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <FileText size={20} className={format === 'docx' ? 'text-blue-400' : 'text-zinc-500'} />
                <span className={`text-sm font-medium ${format === 'docx' ? 'text-white' : 'text-zinc-400'}`}>Word (.docx)</span>
              </button>

              <button 
                onClick={() => setFormat('pdf')}
                className={`flex items-center justify-center gap-2 p-3 rounded border transition-all ${
                  format === 'pdf' 
                    ? 'bg-zinc-900 border-white ring-1 ring-white' 
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <FileType size={20} className={format === 'pdf' ? 'text-red-400' : 'text-zinc-500'} />
                <span className={`text-sm font-medium ${format === 'pdf' ? 'text-white' : 'text-zinc-400'}`}>PDF Document</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={() => onExport(filename, format)}>
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
