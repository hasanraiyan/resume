import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getSessionOwnerId, revokeAppConnectionsByFilter } from '@/lib/app-connections';
import { getMcpServerDefinition } from '@/lib/mcp/factory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { serverKey } = await params;
  if (!getMcpServerDefinition(serverKey)) {
    return NextResponse.json({ error: 'Unknown MCP server' }, { status: 404 });
  }

  const revokedConnections = await revokeAppConnectionsByFilter({
    ownerId: getSessionOwnerId(session),
    filter: { appKey: serverKey, channel: 'mcp' },
  });

  return NextResponse.json({ success: true, revokedConnections });
}
