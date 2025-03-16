import { smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';
import * as Langtrace from '@langtrase/typescript-sdk';

export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title, dataStream, id, session }) => {
    return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
      return await Langtrace.withAdditionalAttributes(async () => {
        let draftContent = '';

        const { fullStream } = streamText({
          model: myProvider.languageModel('artifact-model'),
          system:
            'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
          experimental_transform: smoothStream({ chunking: 'word' }),
          prompt: title,
        });

        for await (const delta of fullStream) {
          const { type } = delta;

          if (type === 'text-delta') {
            const { textDelta } = delta;

            draftContent += textDelta;

            dataStream.writeData({
              type: 'text-delta',
              content: textDelta,
            });
          }
        }

        return draftContent;
      }, {
        document_id: id,
        document_title: title,
        document_kind: 'text',
        user_id: session?.user?.id || 'unknown',
        operation: 'create',
      });
    }, 'text_document_create');
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
      return await Langtrace.withAdditionalAttributes(async () => {
        let draftContent = '';

        const { fullStream } = streamText({
          model: myProvider.languageModel('artifact-model'),
          system: updateDocumentPrompt(document.content, 'text'),
          experimental_transform: smoothStream({ chunking: 'word' }),
          prompt: description,
          experimental_providerMetadata: {
            openai: {
              prediction: {
                type: 'content',
                content: document.content,
              },
            },
          },
        });

        for await (const delta of fullStream) {
          const { type } = delta;

          if (type === 'text-delta') {
            const { textDelta } = delta;

            draftContent += textDelta;
            dataStream.writeData({
              type: 'text-delta',
              content: textDelta,
            });
          }
        }

        return draftContent;
      }, {
        document_id: document.id,
        document_title: document.title,
        document_kind: 'text',
        description_length: description.length,
        content_length: document.content?.length || 0,
        user_id: session?.user?.id || 'unknown',
        operation: 'update',
      });
    }, 'text_document_update');
  },
});
