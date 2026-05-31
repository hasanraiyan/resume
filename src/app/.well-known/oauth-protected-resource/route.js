import { NextResponse } from 'next/server';
import { getMcpServerDefinition, listMcpServerDefinitions } from '@/lib/mcp/factory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const serverKey = url.searchParams.get('server');
  const definition = serverKey ? getMcpServerDefinition(serverKey) : null;

  if (serverKey && !definition) {
    return NextResponse.json({ error: 'Unknown MCP server' }, { status: 404 });
  }

  return NextResponse.json({
    resource: definition ? `${origin}/api/mcp/${definition.key}` : `${origin}/api/mcp`,
    authorization_servers: [`${origin}`],
    scopes_supported: definition
      ? definition.supportedScopes
      : listMcpServerDefinitions().flatMap((server) => server.supportedScopes),
    mcp_servers: listMcpServerDefinitions().map((server) => ({
      key: server.key,
      name: server.name,
      resource: `${origin}/api/mcp/${server.key}`,
      scopes_supported: server.supportedScopes,
    })),
  });
}
