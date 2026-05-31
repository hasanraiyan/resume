import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getSessionOwnerId } from '@/lib/app-connections';
import { getMcpServerDefinition } from '@/lib/mcp/factory';
import dbConnect from '@/lib/dbConnect';
import AppConnection from '@/models/AppConnection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { serverKey, connectionId } = await params;
  if (!getMcpServerDefinition(serverKey)) {
    return NextResponse.json({ error: 'Unknown MCP server' }, { status: 404 });
  }

  await dbConnect();
  const connection = await AppConnection.findOneAndUpdate(
    {
      _id: connectionId,
      ownerId: getSessionOwnerId(session),
      appKey: serverKey,
      channel: 'mcp',
      status: 'active',
    },
    {
      $set: {
        status: 'revoked',
        revokedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
