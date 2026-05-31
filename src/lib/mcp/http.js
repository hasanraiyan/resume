import { NextResponse } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createSdkMcpServer, getMcpServerDefinition } from './factory';
import { withMcpCorsHeaders } from './http-headers';
import {
  markConnectionUsed,
  normalizeScopes,
  verifyAppConnectionToken,
} from '@/lib/app-connections';

const transports = globalThis.__mcpStreamableTransports || new Map();
globalThis.__mcpStreamableTransports = transports;

function getTransportKey(serverKey, sessionId) {
  return `${serverKey}:${sessionId}`;
}

function isInitializePayload(body) {
  try {
    if (Array.isArray(body)) {
      return body.some(isInitializeRequest);
    }

    return isInitializeRequest(body);
  } catch {
    return false;
  }
}

export function unauthorizedMcpResponse(serverKey, request) {
  const origin = new URL(request.url).origin;
  const definition = getMcpServerDefinition(serverKey);
  const scope = definition?.defaultScopes?.join(' ') || '';

  return withMcpCorsHeaders(
    NextResponse.json(
      { error: 'unauthorized', error_description: 'A valid MCP bearer token is required.' },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource/api/mcp/${serverKey}", scope="${scope}"`,
        },
      }
    )
  );
}

export async function authenticateMcpRequest(request, serverKey) {
  const definition = getMcpServerDefinition(serverKey);
  if (!definition) {
    return null;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const auth = await verifyAppConnectionToken(token, {
    appKey: serverKey,
    requiredScopes: definition.defaultScopes,
  });

  if (!auth) {
    return null;
  }

  markConnectionUsed(auth.connection._id).catch(() => {});

  return {
    ...auth,
    token,
    scopes: normalizeScopes(auth.connection.scope),
  };
}

function buildAuthInfo(auth) {
  return {
    token: auth.token,
    clientId: auth.connection.clientId || auth.connection.connectionKey,
    scopes: auth.scopes,
    extra: {
      ownerId: auth.ownerId,
      connectionId: auth.connection._id.toString(),
      appKey: auth.connection.appKey,
    },
  };
}

async function createSessionTransport({ serverKey, auth }) {
  let sessionIdForStore = null;
  const sdkServer = createSdkMcpServer({
    serverKey,
    scopes: auth.scopes,
    context: { auth },
  });

  if (!sdkServer) {
    return null;
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessionIdForStore = sessionId;
      transports.set(getTransportKey(serverKey, sessionId), {
        transport,
        server: sdkServer.server,
        auth,
      });
    },
    onsessionclosed: (sessionId) => {
      transports.delete(getTransportKey(serverKey, sessionId));
    },
  });

  transport.onclose = () => {
    if (sessionIdForStore) {
      transports.delete(getTransportKey(serverKey, sessionIdForStore));
    }
  };

  await sdkServer.server.connect(transport);
  return transport;
}

export async function handleMcpStreamableHttp({ request, serverKey }) {
  const auth = await authenticateMcpRequest(request, serverKey);
  if (!auth) {
    return unauthorizedMcpResponse(serverKey, request);
  }

  const sessionId = request.headers.get('mcp-session-id');
  const authInfo = buildAuthInfo(auth);

  if (sessionId) {
    const session = transports.get(getTransportKey(serverKey, sessionId));
    if (!session) {
      return withMcpCorsHeaders(
        NextResponse.json(
          {
            jsonrpc: '2.0',
            error: { code: -32001, message: 'Session not found' },
            id: null,
          },
          { status: 404 }
        )
      );
    }

    const response = await session.transport.handleRequest(request, { authInfo });
    return withMcpCorsHeaders(response);
  }

  if (request.method !== 'POST') {
    return withMcpCorsHeaders(
      NextResponse.json(
        {
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Bad Request: Mcp-Session-Id header is required' },
          id: null,
        },
        { status: 400 }
      )
    );
  }

  const parsedBody = await request.json().catch(() => null);
  if (!isInitializePayload(parsedBody)) {
    return withMcpCorsHeaders(
      NextResponse.json(
        {
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Bad Request: initialize must start a new session' },
          id: null,
        },
        { status: 400 }
      )
    );
  }

  const transport = await createSessionTransport({ serverKey, auth });
  if (!transport) {
    return withMcpCorsHeaders(NextResponse.json({ error: 'Unknown MCP server' }, { status: 404 }));
  }

  const response = await transport.handleRequest(request, { parsedBody, authInfo });
  return withMcpCorsHeaders(response);
}
