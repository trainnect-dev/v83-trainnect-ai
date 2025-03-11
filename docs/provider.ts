import { customProvider } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { mistral } from "@ai-sdk/mistral";
import { openrouter } from '@openrouter/ai-sdk-provider';
import { perplexity } from '@ai-sdk/perplexity';

export const myProvider = customProvider({
  languageModels: {
    "chat-model-openai": openai("o3-mini"),
    "chat-model-gemini": google("gemini-2.0-flash"),
    "chat-model-groq": groq ("qwen-qwq-32b"),
    "chat-model-claude": anthropic("claude-3-7-sonnet-20250219"),
    "chat-model-mistral": mistral("codestral-latest"),
    "chat-model-perplexity": perplexity("sonar"),
    "chat-model-openrouter": openrouter("google/gemini-2.0-flash-thinking-exp:free"),
    //model: openrouter("google/gemini-2.0-flash-thinking-exp:free"),
    //model: openrouter("deepseek/deepseek-r1-distill-llama-70b"),
    //model: openrouter("microsoft/phi-4"),
  },
});
