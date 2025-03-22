import { z } from 'zod';

export const PromptConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  template: z.string(),
  parameters: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'array']),
    description: z.string().optional(),
    required: z.boolean().default(true),
  })),
  category: z.string().optional(),
  version: z.string().default('1.0.0'),
});

export type PromptConfig = z.infer<typeof PromptConfigSchema>;

export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  name: 'default',
  description: 'Default prompt template',
  template: '{{input}}',
  parameters: [{
    name: 'input',
    type: 'string',
    description: 'The input text',
    required: true,
  }],
  version: '1.0.0',
};
