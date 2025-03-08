export const DEFAULT_CHAT_MODEL: string = 'chat-model-openai';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-openai',
    name: 'Openai model',
    description: 'o3-mini',
  },
  {
    id: 'chat-model-gemini',
    name: 'Gemini model',
    description: 'gemini-2.0-flash',
  },
  {
    id: 'chat-model-claude',
    name: 'Claude model',
    description: 'claude-3-7-sonnet',
  },
  {
    id: 'chat-model-groq',
    name: 'Groq model',
    description: 'groq surprise model',
  },
  {
    id: 'chat-model-mistral',
    name: 'Mistral model',
    description: 'codestral-latest',
  },
  {
    id: 'chat-model-perplexity',
    name: 'perplexity model',
    description: 'perplexity sonar',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Openrouter reasoning',
    description: 'google/gemini-2.0-flash-thinking-exp:free',
  },
];
