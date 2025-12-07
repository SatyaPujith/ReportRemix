
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
    <header className="h-16 bg-[#111111] border-b border-zinc-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-zinc-400 flex-shrink-0" strokeWidth={1.5} />
        <div className="flex flex-col min-w-0">
          <h1 className="text-lg md:text-xl font-semibold text-white leading-none">ReportRemix</h1>
        </div>
        {docName && (
           <>
            <span className="hidden sm:block h-4 w-px bg-zinc-700 mx-2"></span>
            <p className="hidden sm:block text-sm text-zinc-400 truncate max-w-[150px] md:max-w-[250px]">{docName}</p>
           </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {docName && (
          <>
             <Button variant="secondary" size="sm" onClick={onReset} icon={<RotateCcw className="w-3 h-3 md:w-4 md:h-4" />}>
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button variant="primary" size="sm" onClick={onExportClick} icon={<Download className="w-3 h-3 md:w-4 md:h-4" />}>
              <span className="hidden sm:inline">Export</span>
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
