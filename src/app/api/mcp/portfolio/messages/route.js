import { NextRequest } from 'next/server';

export async function POST(req) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Missing sessionId', { status: 400 });
  }

  const transport = global.mcpPortfolioTransports?.get(sessionId);
  if (!transport) {
    return new Response('Session not found', { status: 404 });
  }

  try {
    const message = await req.json();
    if (transport.onmessage) {
      transport.onmessage(message);
    }
    return new Response('Accepted', { status: 202 });
  } catch (err) {
    console.error('[Portfolio MCP] Failed to parse/route message:', err);
    return new Response('Invalid message', { status: 400 });
  }
}
