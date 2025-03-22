import { useState } from 'react';
import { TavilySearchOptions } from '@/lib/tools/tavily';

interface UseSearchResult {
  search: (query: string, options?: Partial<TavilySearchOptions>) => Promise<void>;
  results: string;
  isLoading: boolean;
  error: string | null;
  resultId: string | null;
}

export function useSearch(): UseSearchResult {
  const [results, setResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  const search = async (
    query: string,
    options?: Partial<TavilySearchOptions>,
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          ...options,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Search failed');
      }

      const data = await response.json();
      setResults(data.results);
      setResultId(data.resultId);
    } catch (err: any) {
      setError(err.message || 'An error occurred during search');
      setResults('');
      setResultId(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    search,
    results,
    isLoading,
    error,
    resultId,
  };
}
