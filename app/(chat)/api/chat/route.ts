import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { NextResponse } from 'next/server';
import { myProvider } from '@/lib/ai/providers';
import * as Langtrace from '@langtrase/typescript-sdk';

export const maxDuration = 60;

export async function POST(request: Request) {
  return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
    try {
      const {
        id,
        messages,
        selectedChatModel,
      }: {
        id: string;
        messages: Array<Message>;
        selectedChatModel: string;
      } = await request.json();

      const session = await auth();

      if (!session || !session.user || !session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }

      const userMessage = getMostRecentUserMessage(messages);

      if (!userMessage) {
        return new Response('No user message found', { status: 400 });
      }

      const chat = await getChatById({ id });
      let chatAction = 'continued_existing';

      if (!chat) {
        const title = await generateTitleFromUserMessage({
          message: userMessage,
        });

        await saveChat({ id, userId: session.user.id, title });
        chatAction = 'created_new';
      } else {
        if (chat.userId !== session.user.id) {
          return new Response('Unauthorized', { status: 401 });
        }
      }

      await saveMessages({
        messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
      });

      // Check if messages have PDF or image attachments
      const messagesHavePDF = messages.some(message =>
        message.experimental_attachments?.some(
          a => a.contentType === 'application/pdf',
        ),
      );

      const messagesHaveImage = messages.some(message =>
        message.experimental_attachments?.some(
          a => a.contentType?.startsWith('image/'),
        ),
      );

      // Add attributes using withAdditionalAttributes
      return await Langtrace.withAdditionalAttributes(async () => {
        // Select the appropriate model based on attachment types
        const getModelForContent = () => {
          if (selectedChatModel === 'chat-model-reasoning') {
            return myProvider.languageModel(selectedChatModel);
          }

          // If there's a PDF, use Claude which has good PDF handling
          if (messagesHavePDF) {
            return myProvider.languageModel('chat-model-claude');
          }

          // If there's an image, use models that handle images well
          if (messagesHaveImage) {
            // Prefer the selected model if it's not the reasoning model
            // Otherwise default to a model good with images like GPT-4o or Gemini
            return myProvider.languageModel(
              selectedChatModel === 'chat-model-reasoning' 
                ? 'chat-model-openai' 
                : selectedChatModel
            );
          }

          // Default to the selected model
          return myProvider.languageModel(selectedChatModel);
        };

        return createDataStreamResponse({
          execute: (dataStream) => {
            // Use nested withLangTraceRootSpan for the stream execution
            Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
              const result = streamText({
                model: getModelForContent(),
                system: systemPrompt({ selectedChatModel }),
                messages,
                maxSteps: 5,
                experimental_activeTools:
                  selectedChatModel === 'chat-model-reasoning'
                    ? []
                    : [
                        'getWeather',
                        'createDocument',
                        'updateDocument',
                        'requestSuggestions',
                      ],
                experimental_transform: smoothStream({ chunking: 'word' }),
                experimental_generateMessageId: generateUUID,
                tools: {
                  getWeather,
                  createDocument: createDocument({ session, dataStream }),
                  updateDocument: updateDocument({ session, dataStream }),
                  requestSuggestions: requestSuggestions({
                    session,
                    dataStream,
                  }),
                },
                onFinish: async ({ response, reasoning }) => {
                  // Use withLangTraceRootSpan for the finish handler
                  await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
                    if (session.user?.id) {
                      try {
                        const sanitizedResponseMessages = sanitizeResponseMessages({
                          messages: response.messages,
                          reasoning,
                        });

                        await saveMessages({
                          messages: sanitizedResponseMessages.map((message) => {
                            return {
                              id: message.id,
                              chatId: id,
                              role: message.role,
                              content: message.content,
                              createdAt: new Date(),
                            };
                          }),
                        });
                      } catch (error) {
                        console.error('Failed to save chat');
                      }
                    }
                  }, 'save_chat_messages');
                },
                experimental_telemetry: {
                  isEnabled: isProductionEnvironment,
                  functionId: 'stream-text',
                },
              });

              result.consumeStream();

              result.mergeIntoDataStream(dataStream, {
                sendReasoning: true,
              });
            }, 'stream_text_execution');
          },
          onError: (error) => {
            return 'Oops, an error occured!';
          },
        });
      }, {
        chat_id: id,
        selected_model: selectedChatModel,
        message_count: messages.length.toString(),
        has_pdf: messagesHavePDF.toString(),
        has_image: messagesHaveImage.toString(),
        chat_action: chatAction
      });
    } catch (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
  }, 'chat_route_post');
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
