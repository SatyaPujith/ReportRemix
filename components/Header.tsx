
import React from 'react';
import { BookOpen, Download, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface HeaderProps {
  onReset: () => void;
  onExportClick: () => void;
  docName?: string;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onExportClick, docName }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-gray-700" strokeWidth={1.5} />
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-gray-900 leading-none">ReportRemix</h1>
        </div>
        {docName && (
           <>
            <span className="h-4 w-px bg-gray-300 mx-2"></span>
            <p className="text-sm text-gray-600 truncate max-w-[250px]">{docName}</p>
           </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {docName && (
          <>
             <Button variant="secondary" size="sm" onClick={onReset} icon={<RotateCcw className="w-4 h-4" />}>
              Reset
            </Button>
            <Button variant="primary" size="sm" onClick={onExportClick} icon={<Download className="w-4 h-4" />}>
              Export
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
