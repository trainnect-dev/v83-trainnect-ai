import { z } from 'zod';
import { streamObject } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { codePrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';
import * as Langtrace from '@langtrase/typescript-sdk';

export const codeDocumentHandler = createDocumentHandler<'code'>({
  kind: 'code',
  onCreateDocument: async ({ title, dataStream, id, session }) => {
    return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
      return await Langtrace.withAdditionalAttributes(async () => {
        let draftContent = '';

        const { fullStream } = streamObject({
          model: myProvider.languageModel('artifact-model'),
          system: codePrompt,
          prompt: title,
          schema: z.object({
            code: z.string(),
          }),
        });

        for await (const delta of fullStream) {
          const { type } = delta;

          if (type === 'object') {
            const { object } = delta;
            const { code } = object;

            if (code) {
              dataStream.writeData({
                type: 'code-delta',
                content: code ?? '',
              });

              draftContent = code;
            }
          }
        }

        return draftContent;
      }, {
        document_id: id,
        document_title: title,
        document_kind: 'code',
        user_id: session?.user?.id || 'unknown',
        operation: 'create',
      });
    }, 'code_document_create');
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
      return await Langtrace.withAdditionalAttributes(async () => {
        let draftContent = '';

        const { fullStream } = streamObject({
          model: myProvider.languageModel('artifact-model'),
          system: updateDocumentPrompt(document.content, 'code'),
          prompt: description,
          schema: z.object({
            code: z.string(),
          }),
        });

        for await (const delta of fullStream) {
          const { type } = delta;

          if (type === 'object') {
            const { object } = delta;
            const { code } = object;

            if (code) {
              dataStream.writeData({
                type: 'code-delta',
                content: code ?? '',
              });

              draftContent = code;
            }
          }
        }

        return draftContent;
      }, {
        document_id: document.id,
        document_title: document.title,
        document_kind: 'code',
        description_length: description.length,
        content_length: document.content?.length || 0,
        user_id: session?.user?.id || 'unknown',
        operation: 'update',
      });
    }, 'code_document_update');
  },
});
