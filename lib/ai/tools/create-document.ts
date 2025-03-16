import { generateUUID } from '@/lib/utils';
import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';
import * as Langtrace from '@langtrase/typescript-sdk';

interface CreateDocumentProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const createDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    description:
      'Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.',
    parameters: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
    }),
    execute: async ({ title, kind }) => {
      return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
        const id = generateUUID();

        return await Langtrace.withAdditionalAttributes(async () => {
          dataStream.writeData({
            type: 'kind',
            content: kind,
          });

          dataStream.writeData({
            type: 'id',
            content: id,
          });

          dataStream.writeData({
            type: 'title',
            content: title,
          });

          dataStream.writeData({
            type: 'clear',
            content: '',
          });

          const documentHandler = documentHandlersByArtifactKind.find(
            (documentHandlerByArtifactKind) =>
              documentHandlerByArtifactKind.kind === kind,
          );

          if (!documentHandler) {
            throw new Error(`No document handler found for kind: ${kind}`);
          }

          await documentHandler.onCreateDocument({
            id,
            title,
            dataStream,
            session,
          });

          dataStream.writeData({ type: 'finish', content: '' });

          return {
            id,
            title,
            kind,
            content: 'A document was created and is now visible to the user.',
          };
        }, {
          document_id: id,
          document_title: title,
          document_kind: kind,
          user_id: session.user?.id || 'unknown',
        });
      }, 'create_document_tool');
    },
  });
