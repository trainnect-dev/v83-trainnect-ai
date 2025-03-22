import { z } from 'zod';
import { TavilySearchTool } from '@/lib/tools/tavily';

const SearchToolInputSchema = z.object({
  query: z.string().min(1),
  searchDepth: z.enum(['basic', 'advanced']).optional(),
  maxResults: z.number().min(1).max(10).optional(),
});

export type SearchToolInput = z.infer<typeof SearchToolInputSchema>;

export async function searchTool(input: SearchToolInput) {
  try {
    const validatedInput = SearchToolInputSchema.parse(input);
    const searchTool = new TavilySearchTool();

    const { results } = await searchTool.search({
      query: validatedInput.query,
      searchDepth: validatedInput.searchDepth || 'basic',
      maxResults: validatedInput.maxResults || 5,
      includeRawResults: true,
    });

    return {
      results: searchTool.formatResults(results),
    };
  } catch (error: any) {
    throw new Error(`Search failed: ${error.message}`);
  }
}
