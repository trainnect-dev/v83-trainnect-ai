'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { FileIcon } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  filename?: string;
}

export function PDFViewer({ url, filename }: PDFViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="text-xs flex items-center gap-1 text-blue-500 hover:bg-blue-50 border-blue-200"
        onClick={() => setIsOpen(true)}
      >
        <FileIcon className="h-3 w-3" />
        <span>View PDF</span>
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-3 border-b">
              <h3 className="text-lg font-medium truncate">
                {filename || "PDF Document"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <iframe
                src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full border-0"
                title={filename || "PDF Document"}
                allow="fullscreen"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
