import { useState } from 'react';
import { SearchBox } from './search-box';
import { SearchResults } from './search-results';
import { useSearch } from '@/lib/hooks/use-search';

interface SearchInterfaceProps {
  onResultSelect?: (result: string) => void;
  className?: string;
}

export function SearchInterface({
  onResultSelect,
  className,
}: SearchInterfaceProps) {
  const { results, isLoading } = useSearch();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSearchComplete = () => {
    setIsExpanded(true);
  };

  const handleResultClick = () => {
    if (onResultSelect && results) {
      onResultSelect(results);
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <SearchBox
        onSearchComplete={handleSearchComplete}
        className="w-full"
      />
      {isExpanded && (
        <div className="relative">
          <SearchResults
            results={results}
            isLoading={isLoading}
            className="min-h-[200px] max-h-[400px]"
          />
          {results && onResultSelect && (
            <button
              onClick={handleResultClick}
              className="absolute bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Use Results
            </button>
          )}
        </div>
      )}
    </div>
  );
}
