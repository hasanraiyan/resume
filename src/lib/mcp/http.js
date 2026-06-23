import { NextResponse } from 'next/server';
import { getMcpServerDefinition } from './factory';
import { createServerMcpHandler } from './handler';
import { verifyAppConnectionToken, normalizeScopes } from '@/lib/app-connections';
import { withMcpCorsHeaders } from './http-headers';

/**
 * Handle an MCP request (GET/POST/DELETE) for the given server key.
 * Delegates to the mcp-handler library under the hood.
 *
 * Extracts the Bearer token first and resolves its scopes so that
 * only the permitted tools are registered (scope-based tool filtering).
 */
export async function handleMcpStreamableHttp({ request, serverKey }) {
  // Extract Bearer token and resolve scopes for proper tool filtering
  const authHeader = request.headers.get('Authorization');
  let scopes;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const auth = await verifyAppConnectionToken(token, { appKey: serverKey });
    if (auth) {
      scopes = normalizeScopes(auth.connection.scope);
    }
  }

  const handler = await createServerMcpHandler(serverKey, { scopes });

  if (!handler) {
    const definition = getMcpServerDefinition(serverKey);
    if (!definition) {
      return withMcpCorsHeaders(
        NextResponse.json({ error: 'Unknown MCP server' }, { status: 404 })
      );
    }
    return withMcpCorsHeaders(
      NextResponse.json(
        {
          error: 'mcp_server_disabled',
          error_description: `MCP server "${serverKey}" is disabled.`,
        },
        { status: 403 }
      )
    );
  }

  // Wrap the mcp-handler response with CORS headers
  const response = await handler(request);
  return withMcpCorsHeaders(response);
}

/**
 * Returns an unauthorized (401) MCP response with WWW-Authenticate header.
 */
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
