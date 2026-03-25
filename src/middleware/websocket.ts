/**
 * WebSocket endpoint middleware for Astro/Cloudflare
 * Routes WebSocket connections to appropriate Durable Object rooms
 */

export interface Env {
  GAME_ROOM: DurableObjectNamespace;
}

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Check if this is a WebSocket request
  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  // Extract room ID from path: /ws/game/:roomId
  const pathParts = url.pathname.split('/');
  const roomId = pathParts[pathParts.length - 1];

  if (!roomId) {
    return new Response('Room ID required', { status: 400 });
  }

  // Get or create Durable Object for this room
  const id = env.GAME_ROOM.idFromName(roomId);
  const room = env.GAME_ROOM.get(id);

  // Forward the request to the Durable Object
  return room.fetch(request);
};
