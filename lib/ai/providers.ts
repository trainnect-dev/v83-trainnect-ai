import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openrouter } from '@openrouter/ai-sdk-provider';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model-openai': chatModel,
        'chat-model-gemini': chatModel,
        'chat-model-claude': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        "chat-model-openai": openai("o3-mini"),
        "chat-model-gemini": google("gemini-2.0-flash"),
        "chat-model-claude": anthropic("claude-3-7-sonnet-20250219"),
        "chat-model-reasoning": wrapLanguageModel({
          model: openrouter("google/gemini-2.0-flash-thinking-exp:free"),
          //model: openrouter("google/gemini-2.0-flash-thinking-exp:free"),
          //model: openrouter("deepseek/deepseek-r1-distill-llama-70b"),
          //model: openrouter("microsoft/phi-4"),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('o3-mini'),
        'artifact-model': openai('o3-mini'),
      },
      imageModels: {
        'small-model': openai.image('dall-e-3'),
        // 'large-model': openai.image('dall-e-3'),
      },
    });
