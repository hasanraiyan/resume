import { createMcpHandler } from 'mcp-handler';
import { registerPocketlyMcp } from '@/lib/mcp/pocketly/register';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Pocketly MCP for ChatGPT — API key embedded in the URL path itself.
 * No headers or query params needed — just use the URL as-is.
 *
 * URL format: https://hasanraiyan.me/api/pocketly-mcp/key/<your-api-key>
 *
 * Set POCKETLY_MCP_API_KEY in your Vercel env vars.
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

async function handleRequest(request, { params }) {
  const { apiKey } = await params;

  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: 'POCKETLY_MCP_API_KEY not configured on server' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  if (!apiKey || apiKey !== API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Invalid API key' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  return handler(request);
}

export const GET = handleRequest;
export const POST = handleRequest;
