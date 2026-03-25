/**
 * WebSocket API endpoint
 * Handles WebSocket upgrade requests for game rooms
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, params, locals }) => {
  const roomId = params.roomId;

  if (!roomId) {
    return new Response('Room ID required', { status: 400 });
  }

  // Check for WebSocket upgrade
  if (request.headers.get('Upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  // Get Cloudflare runtime
  const runtime = locals.runtime;

  if (!runtime || !runtime.env.GAME_ROOM) {
    return new Response('Durable Objects not configured', { status: 500 });
  }

  // Get Durable Object ID for this room
  const id = runtime.env.GAME_ROOM.idFromName(roomId);
  const room = runtime.env.GAME_ROOM.get(id);

  // Forward request to Durable Object
  return room.fetch(request);
};
