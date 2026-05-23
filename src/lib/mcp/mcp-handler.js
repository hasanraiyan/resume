import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { verifyAccessToken, getBaseUrl } from '@/lib/mcp/oauth';
import dbConnect from '@/lib/dbConnect';
import AppConnection from '@/models/AppConnection';
import McpAuditLog from '@/models/McpAuditLog';

const rateLimits = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;
const RATE_CLEANUP_THRESHOLD = 1000;

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

function cleanupRateLimits() {
  const now = Date.now();
  for (const [clientId, entry] of rateLimits.entries()) {
    if (now - entry.start > RATE_WINDOW_MS) {
      rateLimits.delete(clientId);
    }
  }
}

function unauthorizedResponse(description, realmPath) {
  const base = getBaseUrl();
  return new Response(JSON.stringify({ error: 'unauthorized', error_description: description }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'WWW-Authenticate': `Bearer realm="${base}${realmPath}", resource_metadata="${base}/.well-known/oauth-protected-resource${realmPath}"`,
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
  let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    try {
      const url = new URL(request.url);
      token = url.searchParams.get('token') || url.searchParams.get('access_token');
    } catch {
      // ignore
    }
  }

  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  if (payload.connectionId) {
    await dbConnect();
    const app = await AppConnection.findOne({
      _id: payload.connectionId,
      ownerId: payload.ownerId,
      status: 'active',
    }).lean();
    if (!app) return null;
  }

  return {
    token,
    clientId: payload.clientId,
    ownerId: payload.ownerId || null,
    connectionId: payload.connectionId || null,
    scopes: (payload.scope || '').split(' ').filter(Boolean),
    expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
  };
}

export async function handleMcpHttpRequest({ request, scope, createMcpServer, realmPath }) {
  const authInfo = await getAuthInfo(request);
  if (!authInfo) return unauthorizedResponse('Valid Bearer token required', realmPath);

  if (scope && !authInfo.scopes.includes(scope)) {
    return unauthorizedResponse(`Token lacks required scope: ${scope}`, realmPath);
  }

  const rateCheck = checkRateLimit(authInfo.clientId);
  if (!rateCheck.allowed) {
    return rateLimitResponse(Math.ceil(RATE_WINDOW_MS / 1000));
  }

  if (rateLimits.size > RATE_CLEANUP_THRESHOLD) {
    cleanupRateLimits();
  }

  const startTime = Date.now();
  let toolName = 'unknown';
  let success = true;
  let errorMessage = null;

  try {
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

    if (authInfo.connectionId) {
      await dbConnect();
      await AppConnection.findOneAndUpdate(
        { _id: authInfo.connectionId, ownerId: authInfo.ownerId },
        { $set: { lastUsedAt: new Date() } }
      );
    }

    return response;
  } catch (err) {
    success = false;
    errorMessage = err.message || 'Internal error';
    console.error(`MCP request error for scope ${scope}:`, err);
    return new Response(
      JSON.stringify({ error: 'server_error', error_description: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    const durationMs = Date.now() - startTime;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    dbConnect()
      .then(() =>
        McpAuditLog.create({
          clientId: authInfo.clientId,
          ownerId: authInfo.ownerId,
          connectionId: authInfo.connectionId,
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
