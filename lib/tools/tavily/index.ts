import { tavily } from '@tavily/core';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const SEARCH_RESULTS_DIR = path.join(process.cwd(), 'data', 'search-results');

// Ensure search results directory exists
if (!fs.existsSync(SEARCH_RESULTS_DIR)) {
  fs.mkdirSync(SEARCH_RESULTS_DIR, { recursive: true });
}

const SearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  content: z.string(),
  score: z.number(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export interface TavilySearchOptions {
  query: string;
  searchDepth?: 'basic' | 'advanced';
  maxResults?: number;
  includeRawResults?: boolean;
  filterDomains?: string[];
  excludeDomains?: string[];
}

interface TavilyApiResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score?: number;
  }>;
  answer?: string;
}

export class TavilySearchTool {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('TAVILY_API_KEY is required');
    }
  }

  async search(options: TavilySearchOptions): Promise<{
    results: SearchResult[];
    resultId: string;
  }> {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          query: options.query,
          search_depth: options.searchDepth || 'basic',
          max_results: options.maxResults || 5,
          include_domains: options.filterDomains,
          exclude_domains: options.excludeDomains,
          include_answer: true,
          include_raw_content: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.statusText}`);
      }

      const searchResponse: TavilyApiResponse = await response.json();

      const results = searchResponse.results.map((result) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score || 0,
      }));

      // Save raw results
      const resultId = nanoid();
      const resultPath = path.join(SEARCH_RESULTS_DIR, `${resultId}.json`);
      fs.writeFileSync(
        resultPath,
        JSON.stringify({
          query: options.query,
          timestamp: new Date().toISOString(),
          rawResults: searchResponse,
          formattedResults: results,
        }, null, 2),
        'utf-8',
      );

      return { results, resultId };
    } catch (error) {
      console.error('Tavily search error:', error);
      throw error;
    }
  }

  formatResults(results: SearchResult[]): string {
    const formattedResults = results
      .map((result, index) => {
        const title = result.title.trim();
        const url = result.url.trim();
        const content = result.content.trim()
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\s+/g, ' '); // Normalize whitespace

        return `${index + 1}. **[${title}](${url})**\n${content}\n`;
      })
      .join('\n');

    return formattedResults || 'No results found.';
  }
}
