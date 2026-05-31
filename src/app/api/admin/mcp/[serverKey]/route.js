import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getSessionOwnerId, revokeAppConnectionsByFilter } from '@/lib/app-connections';
import { getMcpServerDefinition } from '@/lib/mcp/factory';
import { updateMcpServerConfig } from '@/lib/mcp/config';

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

  const { serverKey } = await params;
  const definition = getMcpServerDefinition(serverKey);
  if (!definition) {
    return NextResponse.json({ error: 'Unknown MCP server' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const updates = {};

  if (body.isEnabled !== undefined) {
    updates.isEnabled = Boolean(body.isEnabled);
  }
  if (body.disabledTools !== undefined) {
    updates.disabledTools = body.disabledTools;
  }
  if (body.allowedScopes !== undefined) {
    const supportedScopes = new Set(definition.supportedScopes || []);
    updates.allowedScopes = (body.allowedScopes || []).filter((scope) =>
      supportedScopes.has(scope)
    );
  }
  if (body.notes !== undefined) {
    updates.notes = body.notes;
  }

  const config = await updateMcpServerConfig(serverKey, updates);
  let revokedConnections = 0;

  if (body.revokeConnections === true || updates.isEnabled === false) {
    revokedConnections = await revokeAppConnectionsByFilter({
      ownerId: getSessionOwnerId(session),
      filter: { appKey: serverKey, channel: 'mcp' },
    });
  }

  return NextResponse.json({ success: true, config, revokedConnections });
}
