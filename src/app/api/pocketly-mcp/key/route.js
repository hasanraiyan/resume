import { NextResponse } from 'next/server';
import { createMcpHandler } from 'mcp-handler';
import { registerPocketlyMcp } from '@/lib/mcp/pocketly/register';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Pocketly MCP for ChatGPT — uses a static API key instead of OAuth.
 * Set POCKETLY_MCP_API_KEY in your Vercel env vars.
 * The client sends: Authorization: Bearer <your-api-key>
 */
const API_KEY = process.env.POCKETLY_MCP_API_KEY;

const handler = createMcpHandler(
  (server) => {
    registerPocketlyMcp(server);
  },
  {
    serverInfo: {
      name: 'pocketly-mcp',
      version: '1.0.0',
    },
  },
  {
    basePath: '/api/pocketly-mcp',
    maxDuration: 60,
    disableSse: true,
  }
);

async function verifyApiKey(request) {
  if (!API_KEY) {
    return { ok: false, error: 'POCKETLY_MCP_API_KEY not configured on server', status: 500 };
  }

  const authHeader = request.headers.get('authorization') || '';
  let token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // Fallback: check query params (for clients that can't set headers)
  if (!token) {
    try {
      const url = new URL(request.url);
      token = url.searchParams.get('auth') || url.searchParams.get('token') || '';
    } catch {
      // ignore
    }
  }

  if (!token || token !== API_KEY) {
    return { ok: false, error: 'Invalid or missing API key', status: 401 };
  }

  return { ok: true };
}

async function handleRequest(request) {
  const auth = await verifyApiKey(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      {
        status: auth.status,
        headers: {
          'WWW-Authenticate': `Bearer error="invalid_token", error_description="${auth.error}"`,
        },
      }
    );
  }

  return handler(request);
}

export const GET = handleRequest;
export const POST = handleRequest;
