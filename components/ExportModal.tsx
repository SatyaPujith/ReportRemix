
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-serif font-bold text-stone-900">Export Document</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Filename</label>
            <input 
              type="text" 
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded focus:ring-1 focus:ring-stone-800 focus:border-stone-800 outline-none text-stone-900"
              placeholder="My Document"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setFormat('docx')}
                className={`flex items-center justify-center gap-2 p-3 rounded border transition-all ${
                  format === 'docx' 
                    ? 'bg-stone-50 border-stone-800 ring-1 ring-stone-800' 
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <FileText size={20} className={format === 'docx' ? 'text-blue-700' : 'text-stone-400'} />
                <span className={`text-sm font-medium ${format === 'docx' ? 'text-stone-900' : 'text-stone-500'}`}>Word (.docx)</span>
              </button>

              <button 
                onClick={() => setFormat('pdf')}
                className={`flex items-center justify-center gap-2 p-3 rounded border transition-all ${
                  format === 'pdf' 
                    ? 'bg-stone-50 border-stone-800 ring-1 ring-stone-800' 
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <FileType size={20} className={format === 'pdf' ? 'text-red-600' : 'text-stone-400'} />
                <span className={`text-sm font-medium ${format === 'pdf' ? 'text-stone-900' : 'text-stone-500'}`}>PDF Document</span>
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
