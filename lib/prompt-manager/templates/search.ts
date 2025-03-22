import { PromptConfig } from '../config';

export const SEARCH_PROMPT: PromptConfig = {
  name: 'web_search',
  description: 'Prompt template for web search queries',
  template: `Search query: {{query}}
{{#if context}}Previous context: {{context}}{{/if}}
{{#if filters}}Filters: {{filters}}{{/if}}

Please perform a web search to find relevant information about the query. Focus on:
1. Recent and reliable sources
2. Factual information
3. Relevant details that address the query directly

Search parameters:
- Depth: {{searchDepth}}
- Max results: {{maxResults}}`,
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'The search query',
      required: true,
    },
    {
      name: 'context',
      type: 'string',
      description: 'Optional context for the search',
      required: false,
    },
    {
      name: 'filters',
      type: 'string',
      description: 'Optional domain filters',
      required: false,
    },
    {
      name: 'searchDepth',
      type: 'string',
      description: 'Search depth (basic or advanced)',
      required: true,
    },
    {
      name: 'maxResults',
      type: 'number',
      description: 'Maximum number of results to return',
      required: true,
    },
  ],
  category: 'search',
  version: '1.0.0',
};
