import { NextResponse } from 'next/server';
import { TavilySearchTool } from '@/lib/tools/tavily';
import { z } from 'zod';

const SearchRequestSchema = z.object({
  query: z.string(),
  searchDepth: z.enum(['basic', 'advanced']).optional(),
  maxResults: z.number().min(1).max(10).optional(),
  filterDomains: z.array(z.string()).optional(),
  excludeDomains: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = SearchRequestSchema.parse(body);

    const searchTool = new TavilySearchTool();
    const { results, resultId } = await searchTool.search(validatedData);
    const formattedResults = searchTool.formatResults(results);

    return NextResponse.json({
      success: true,
      results: formattedResults,
      resultId,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}
