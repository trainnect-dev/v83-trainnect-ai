import { auth } from '@/app/(auth)/auth';
import { getSuggestionsByDocumentId } from '@/lib/db/queries';
import * as Langtrace from '@langtrase/typescript-sdk';

export async function GET(request: Request) {
  return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return new Response('Not Found', { status: 404 });
    }

    const session = await auth();

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const suggestions = await getSuggestionsByDocumentId({
      documentId,
    });

    return await Langtrace.withAdditionalAttributes(async () => {
      const [suggestion] = suggestions;

      if (!suggestion) {
        return Response.json([], { status: 200 });
      }

      if (suggestion.userId !== session.user?.id) {
        return new Response('Unauthorized', { status: 401 });
      }

      return Response.json(suggestions, { status: 200 });
    }, {
      document_id: documentId,
      user_id: session.user.id || 'unknown',
      suggestion_count: suggestions.length,
    });
  }, 'suggestions_get');
}
