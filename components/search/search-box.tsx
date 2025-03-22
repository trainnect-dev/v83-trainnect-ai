import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/lib/hooks/use-search';
import { Loader2 } from 'lucide-react';
import { TavilySearchOptions } from '@/lib/tools/tavily';

interface SearchBoxProps {
  onSearchComplete?: (results: string) => void;
  className?: string;
}

export function SearchBox({ onSearchComplete, className }: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const { search, isLoading, error } = useSearch();
  const [searchDepth, setSearchDepth] = useState<'basic' | 'advanced'>('basic');

  const handleSearch = async () => {
    if (!query.trim()) return;

    const options: Partial<TavilySearchOptions> = {
      searchDepth,
      maxResults: 5,
      includeRawResults: true,
    };

    await search(query, options);
    if (onSearchComplete) {
      onSearchComplete(query);
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter your search query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="w-24"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Search depth:</label>
          <select
            value={searchDepth}
            onChange={(e) => setSearchDepth(e.target.value as 'basic' | 'advanced')}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="basic">Basic</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
