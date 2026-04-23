import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/dbConnect';
import ConnectedApp from '@/models/ConnectedApp';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

    await dbConnect();
    const apps = await ConnectedApp.find({ userId: session.user.id })
      .sort({ lastUsedAt: -1 })
      .lean();

    return NextResponse.json(
      apps.map((app) => ({
        id: app._id.toString(),
        clientId: app.clientId,
        clientName: app.clientName,
        scope: app.scope,
        resource: app.resource,
        isActive: app.isActive,
        lastUsedAt: app.lastUsedAt,
        createdAt: app.createdAt,
      }))
    );
  } catch (error) {
    console.error('Error fetching connected apps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
