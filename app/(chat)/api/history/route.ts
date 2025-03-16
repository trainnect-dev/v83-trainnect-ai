import { auth } from '@/app/(auth)/auth';
import { getChatsByUserId } from '@/lib/db/queries';
import * as Langtrace from '@langtrase/typescript-sdk';

export async function GET() {
  return await Langtrace.withLangTraceRootSpan(async (spanId, traceId) => {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return Response.json('Unauthorized!', { status: 401 });
    }

    // At this point we know session.user.id is a string
    const userId = session.user.id;

    return await Langtrace.withAdditionalAttributes(async () => {
      const chats = await getChatsByUserId({ id: userId });
      return Response.json(chats);
    }, {
      user_id: userId,
      operation: 'get_chat_history',
    });
  }, 'history_get');
}
