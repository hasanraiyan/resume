import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getSessionOwnerId, listAppConnections } from '@/lib/app-connections';

/**
 * GET /api/user/connected-apps
 * Returns all connected apps for the current logged-in user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = getSessionOwnerId(session);
    const apps = await listAppConnections(ownerId);

    return NextResponse.json(
      apps.map((app) => ({
        id: app._id.toString(),
        appKey: app.appKey,
        channel: app.channel,
        connectionType: app.connectionType,
        connectionKey: app.connectionKey,
        clientId: app.clientId,
        clientName: app.clientName,
        scope: app.scope,
        resource: app.resource,
        status: app.status,
        lastUsedAt: app.lastUsedAt,
        revokedAt: app.revokedAt,
        createdAt: app.createdAt,
        metadata: app.metadata || {},
      }))
    );
  } catch (error) {
    console.error('Error fetching connected apps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
