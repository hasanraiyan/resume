import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { verifyAccessToken, getBaseUrl } from '@/lib/mcp/oauth';
import { createMcpServer } from '@/lib/mcp/server';
import dbConnect from '@/lib/dbConnect';
import ConnectedApp from '@/models/ConnectedApp';
import McpAuditLog from '@/models/McpAuditLog';

// ─── Rate Limiting ──────────────────────────────────────────────────
const rateLimits = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

function checkRateLimit(clientId) {
  const now = Date.now();
  const entry = rateLimits.get(clientId);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    rateLimits.set(clientId, { start: now, count: 1 });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  entry.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - entry.count);
  return { allowed: entry.count <= MAX_REQUESTS_PER_WINDOW, remaining };
}

function unauthorizedResponse(description) {
  const base = getBaseUrl();
  return new Response(JSON.stringify({ error: 'unauthorized', error_description: description }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'WWW-Authenticate': `Bearer realm="${base}/api/mcp", resource_metadata="${base}/.well-known/oauth-protected-resource"`,
    },
  });
}

function rateLimitResponse(retryAfter) {
  return new Response(
    JSON.stringify({ error: 'rate_limited', error_description: 'Too many requests' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}

async function getAuthInfo(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  // Check if the connected app is still active
  if (payload.userId) {
    await dbConnect();
    const app = await ConnectedApp.findOne({
      userId: payload.userId,
      clientId: payload.clientId,
      isActive: true,
    }).lean();
    if (!app) return null;
  }

  return {
    token,
    clientId: payload.clientId,
    userId: payload.userId || null,
    scopes: (payload.scope || '').split(' ').filter(Boolean),
    expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
  };
}

async function handleMcpRequest(request) {
  const authInfo = await getAuthInfo(request);
  if (!authInfo) return unauthorizedResponse('Valid Bearer token required');

  // Rate limiting
  const rateCheck = checkRateLimit(authInfo.clientId);
  if (!rateCheck.allowed) {
    return rateLimitResponse(Math.ceil(RATE_WINDOW_MS / 1000));
  }

  const startTime = Date.now();
  let toolName = 'unknown';
  let success = true;
  let errorMessage = null;

  try {
    // Peek at the request body to extract tool name for audit logging
    const cloned = request.clone();
    const body = await cloned.json().catch(() => null);
    if (body?.method === 'tools/call' && body?.params?.name) {
      toolName = body.params.name;
    } else if (body?.method) {
      toolName = body.method;
    }
  } catch {
    // ignore parse errors
  }

  try {
    const server = createMcpServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);

    const response = await transport.handleRequest(request, { authInfo });

    // Update lastUsedAt for connected app
    if (authInfo.userId) {
      await dbConnect();
      await ConnectedApp.findOneAndUpdate(
        { userId: authInfo.userId, clientId: authInfo.clientId },
        { $set: { lastUsedAt: new Date() } }
      );
    }

    return response;
  } catch (err) {
    success = false;
    errorMessage = err.message || 'Internal error';
    console.error('MCP request error:', err);
    return new Response(
      JSON.stringify({ error: 'server_error', error_description: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    // Async audit log (fire-and-forget)
    const durationMs = Date.now() - startTime;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    dbConnect()
      .then(() =>
        McpAuditLog.create({
          clientId: authInfo.clientId,
          userId: authInfo.userId,
          tool: toolName,
          params: {},
          success,
          errorMessage,
          durationMs,
          ip,
          userAgent,
        })
      )
      .catch((e) => console.error('Audit log error:', e));
  }
}

export const POST = handleMcpRequest;
export const GET = handleMcpRequest;
export const DELETE = handleMcpRequest;
