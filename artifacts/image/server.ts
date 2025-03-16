import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { experimental_generateImage } from 'ai';
import * as Langtrace from '@langtrase/typescript-sdk';

export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ title, dataStream, id, session }) => {
    return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
      return await Langtrace.withAdditionalAttributes(async () => {
        let draftContent = '';

        const { image } = await experimental_generateImage({
          model: myProvider.imageModel('small-model'),
          prompt: title,
          n: 1,
        });

        draftContent = image.base64;

        dataStream.writeData({
          type: 'image-delta',
          content: image.base64,
        });

        return draftContent;
      }, {
        document_id: id,
        document_title: title,
        document_kind: 'image',
        user_id: session?.user?.id || 'unknown',
        operation: 'create',
      });
    }, 'image_document_create');
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
      return await Langtrace.withAdditionalAttributes(async () => {
        let draftContent = '';

        const { image } = await experimental_generateImage({
          model: myProvider.imageModel('small-model'),
          prompt: description,
          n: 1,
        });

        draftContent = image.base64;

        dataStream.writeData({
          type: 'image-delta',
          content: image.base64,
        });

        return draftContent;
      }, {
        document_id: document.id,
        document_title: document.title,
        document_kind: 'image',
        description_length: description.length,
        user_id: session?.user?.id || 'unknown',
        operation: 'update',
      });
    }, 'image_document_update');
  },
});
