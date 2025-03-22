import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SearchResultsProps {
  results: string;
  isLoading: boolean;
  className?: string;
}

export function SearchResults({
  results,
  isLoading,
  className,
}: SearchResultsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (results && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [results]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 w-full bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <ScrollArea className={`relative rounded-md border ${className}`}>
      <Card className="p-4">
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 underline"
                />
              ),
            }}
          >
            {results}
          </ReactMarkdown>
        </div>
      </Card>
    </ScrollArea>
  );
}
