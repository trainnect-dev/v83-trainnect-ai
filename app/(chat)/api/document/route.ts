import { auth } from '@/app/(auth)/auth';
import { ArtifactKind } from '@/components/artifact';
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
} from '@/lib/db/queries';
import * as Langtrace from '@langtrase/typescript-sdk';

export async function GET(request: Request) {
  return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Missing id', { status: 400 });
    }

    const session = await auth();

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const documents = await getDocumentsById({ id });

    return await Langtrace.withAdditionalAttributes(async () => {
      const [document] = documents;

      if (!document) {
        return new Response('Not Found', { status: 404 });
      }

      if (document.userId !== session.user?.id) {
        return new Response('Unauthorized', { status: 401 });
      }

      return Response.json(documents, { status: 200 });
    }, {
      document_id: id,
      user_id: session.user.id || 'unknown',
      document_count: documents.length,
      operation: 'get',
    });
  }, 'document_get');
}

export async function POST(request: Request) {
  return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Missing id', { status: 400 });
    }

    const session = await auth();

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const {
      content,
      title,
      kind,
    }: { content: string; title: string; kind: ArtifactKind } =
      await request.json();

    return await Langtrace.withAdditionalAttributes(async () => {
      if (session.user?.id) {
        const document = await saveDocument({
          id,
          content,
          title,
          kind,
          userId: session.user.id,
        });

        return Response.json(document, { status: 200 });
      }

      return new Response('Unauthorized', { status: 401 });
    }, {
      document_id: id,
      document_title: title,
      document_kind: kind,
      content_length: content.length,
      user_id: session.user?.id || 'unknown',
      operation: 'save',
    });
  }, 'document_post');
}

export async function PATCH(request: Request) {
  return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const { timestamp }: { timestamp: string } = await request.json();

    if (!id) {
      return new Response('Missing id', { status: 400 });
    }

    const session = await auth();

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const documents = await getDocumentsById({ id });

    return await Langtrace.withAdditionalAttributes(async () => {
      const [document] = documents;

      if (document.userId !== session.user?.id) {
        return new Response('Unauthorized', { status: 401 });
      }

      await deleteDocumentsByIdAfterTimestamp({
        id,
        timestamp: new Date(timestamp),
      });

      return new Response('Deleted', { status: 200 });
    }, {
      document_id: id,
      user_id: session.user.id || 'unknown',
      timestamp: timestamp,
      operation: 'delete_after_timestamp',
    });
  }, 'document_patch');
}
