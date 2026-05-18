import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { pusherServer } from '@/lib/pusher/server';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);
  const socketId = params.get('socket_id');
  const channelName = params.get('channel_name');

  if (!socketId || !channelName) {
    return new Response('Missing socket_id or channel_name', { status: 400 });
  }

  // Guard: only allow own user channel + project/dashboard channels
  const isOwnUserChannel = channelName === `private-user-${session.user.id}`;
  const isProjectChannel = channelName.startsWith('private-project-');
  const isDashboardChannel = channelName === 'private-dashboard';

  if (!isOwnUserChannel && !isProjectChannel && !isDashboardChannel) {
    return new Response('Forbidden', { status: 403 });
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channelName);
  return Response.json(authResponse);
}