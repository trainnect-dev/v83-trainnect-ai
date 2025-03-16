import { myProvider } from '@/lib/ai/providers';
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { streamObject } from 'ai';
import { z } from 'zod';
import * as Langtrace from '@langtrase/typescript-sdk';

export const sheetDocumentHandler = createDocumentHandler<'sheet'>({
  kind: 'sheet',
  onCreateDocument: async ({ title, dataStream, id, session }) => {
    return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
      return await Langtrace.withAdditionalAttributes(async () => {
        let draftContent = '';

        const { fullStream } = streamObject({
          model: myProvider.languageModel('artifact-model'),
          system: sheetPrompt,
          prompt: title,
          schema: z.object({
            csv: z.string().describe('CSV data'),
          }),
        });

        for await (const delta of fullStream) {
          const { type } = delta;

          if (type === 'object') {
            const { object } = delta;
            const { csv } = object;

            if (csv) {
              dataStream.writeData({
                type: 'sheet-delta',
                content: csv,
              });

              draftContent = csv;
            }
          }
        }

        dataStream.writeData({
          type: 'sheet-delta',
          content: draftContent,
        });

        return draftContent;
      }, {
        document_id: id,
        document_title: title,
        document_kind: 'sheet',
        user_id: session?.user?.id || 'unknown',
        operation: 'create',
      });
    }, 'sheet_document_create');
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
      return await Langtrace.withAdditionalAttributes(async () => {
        let draftContent = '';

        const { fullStream } = streamObject({
          model: myProvider.languageModel('artifact-model'),
          system: updateDocumentPrompt(document.content, 'sheet'),
          prompt: description,
          schema: z.object({
            csv: z.string(),
          }),
        });

        for await (const delta of fullStream) {
          const { type } = delta;

          if (type === 'object') {
            const { object } = delta;
            const { csv } = object;

            if (csv) {
              dataStream.writeData({
                type: 'sheet-delta',
                content: csv,
              });

              draftContent = csv;
            }
          }
        }

        return draftContent;
      }, {
        document_id: document.id,
        document_title: document.title,
        document_kind: 'sheet',
        description_length: description.length,
        content_length: document.content?.length || 0,
        user_id: session?.user?.id || 'unknown',
        operation: 'update',
      });
    }, 'sheet_document_update');
  },
});
