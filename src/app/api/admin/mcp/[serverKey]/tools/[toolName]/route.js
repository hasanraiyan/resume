import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getMcpServerDefinition } from '@/lib/mcp/factory';
import { setMcpToolEnabled } from '@/lib/mcp/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' ? session : null;
}

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { serverKey, toolName } = await params;
  const definition = getMcpServerDefinition(serverKey);
  if (!definition) {
    return NextResponse.json({ error: 'Unknown MCP server' }, { status: 404 });
  }

  const toolExists = definition
    .createTools({ scopes: definition.defaultScopes || [] })
    .some((tool) => tool.name === toolName);
  if (!toolExists) {
    return NextResponse.json({ error: 'Unknown MCP tool' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const config = await setMcpToolEnabled(serverKey, toolName, body.isEnabled !== false);

  return NextResponse.json({ success: true, config });
}
