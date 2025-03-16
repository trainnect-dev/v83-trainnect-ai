import { z } from 'zod';
import { Session } from 'next-auth';
import { DataStreamWriter, streamObject, tool } from 'ai';
import { getDocumentById, saveSuggestions } from '@/lib/db/queries';
import { Suggestion } from '@/lib/db/schema';
import { generateUUID } from '@/lib/utils';
import { myProvider } from '../providers';
import * as Langtrace from '@langtrase/typescript-sdk';

interface RequestSuggestionsProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const requestSuggestions = ({
  session,
  dataStream,
}: RequestSuggestionsProps) =>
  tool({
    description: 'Request suggestions for a document',
    parameters: z.object({
      documentId: z
        .string()
        .describe('The ID of the document to request edits'),
    }),
    execute: async ({ documentId }) => {
      return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
        const document = await getDocumentById({ id: documentId });

        if (!document || !document.content) {
          return {
            error: 'Document not found',
          };
        }

        const suggestions: Array<
          Omit<Suggestion, 'userId' | 'createdAt' | 'documentCreatedAt'>
        > = [];

        return await Langtrace.withAdditionalAttributes(async () => {
          const { elementStream } = streamObject({
            model: myProvider.languageModel('artifact-model'),
            system:
              'You are an expert proofreader and writing assistant. Given a piece of writing, please offer your expert suggestions to improve the piece of writing and describe why you think the change will improve the writing. It is very important for the edits you propose to contain full sentences instead of just words. Max 8 suggestions.',
            prompt: document.content || '',
            output: 'array',
            schema: z.object({
              originalSentence: z.string().describe('The original sentence'),
              suggestedSentence: z.string().describe('The suggested sentence'),
              description: z.string().describe('The description of the suggestion'),
            }),
          });

          for await (const element of elementStream) {
            const suggestion = {
              originalText: element.originalSentence,
              suggestedText: element.suggestedSentence,
              description: element.description,
              id: generateUUID(),
              documentId: documentId,
              isResolved: false,
            };

            dataStream.writeData({
              type: 'suggestion',
              content: suggestion,
            });

            suggestions.push(suggestion);
          }

          if (session.user?.id) {
            const userId = session.user.id;

            await saveSuggestions({
              suggestions: suggestions.map((suggestion) => ({
                ...suggestion,
                userId,
                createdAt: new Date(),
                documentCreatedAt: document.createdAt,
              })),
            });
          }

          return {
            id: documentId,
            title: document.title,
            kind: document.kind,
            message: 'Suggestions have been added to the document',
          };
        }, {
          document_id: documentId,
          document_title: document.title,
          document_kind: document.kind,
          content_length: document.content?.length || 0,
          user_id: session.user?.id || 'unknown',
          suggestion_count: suggestions.length,
        });
      }, 'request_suggestions_tool');
    },
  });
