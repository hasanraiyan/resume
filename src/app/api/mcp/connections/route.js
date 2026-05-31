import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  createAppConnection,
  createAppConnectionAccessToken,
  createConnectionKey,
  getSessionOwnerId,
  normalizeScopes,
} from '@/lib/app-connections';
import { getMcpServerDefinition, listMcpServerDefinitions } from '@/lib/mcp/factory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validateScopes(definition, requestedScopes) {
  const supported = new Set(definition.supportedScopes || []);
  const scopes = normalizeScopes(requestedScopes);
  const normalized = scopes.length > 0 ? scopes : definition.defaultScopes;

  return normalized.filter((scope) => supported.has(scope));
}

export async function GET() {
  return NextResponse.json({ servers: listMcpServerDefinitions() });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const serverKey = body.serverKey || 'test';
  const definition = getMcpServerDefinition(serverKey);

  if (!definition) {
    return NextResponse.json({ error: 'Unknown MCP server' }, { status: 404 });
  }

  const scopes = validateScopes(definition, body.scopes || body.scope);
  if (scopes.length === 0) {
    return NextResponse.json({ error: 'No valid scopes requested' }, { status: 400 });
  }

  const connection = await createAppConnection({
    ownerId: getSessionOwnerId(session),
    appKey: serverKey,
    channel: body.channel || 'mcp',
    connectionType: 'personal_access_token',
    connectionKey: createConnectionKey('mcp'),
    clientId: body.clientId || null,
    clientName: body.clientName || `${definition.name} MCP Client`,
    scope: scopes.join(' '),
    resource: `/api/mcp/${serverKey}`,
    metadata: {
      issuedAt: new Date().toISOString(),
      issuedFrom: 'mcp_connections_api',
    },
  });

  const token = await createAppConnectionAccessToken(connection);

  return NextResponse.json({
    success: true,
    serverKey,
    connectionId: connection._id.toString(),
    scope: connection.scope,
    resource: connection.resource,
    token,
  });
}
