# Update Models

To update the models, you will need to update the `/lib/ai/models.ts` file shown below.

```ts
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
    id: 'chat-model-reasoning',
    name: 'Openrouter reasoning',
    description: 'google/gemini-2.0-flash-thinking-exp:free',
  },
];
```
This AI app includes [OpenAI](https://sdk.vercel.ai/providers/ai-sdk-providers/openai) as the default model provider. Since the template is powered by the [AI SDK](https://sdk.vercel.ai), which supports [multiple providers](https://sdk.vercel.ai/providers/ai-sdk-providers) out of the box, you can easily switch to another provider of your choice.

You can replace the `openai` models with any other provider of your choice. You will need to install the provider library and switch the models accordingly as shown below.

```ts
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
```



