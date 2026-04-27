import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getSessionOwnerId,
  revokeAppConnection,
  revokeAppConnectionsByFilter,
} from '@/lib/app-connections';

/**
 * DELETE /api/user/connected-apps/:id
 * Revokes a tracked app connection or mobile session.
 */
export async function DELETE(_request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const updated = await revokeAppConnection({
      ownerId: getSessionOwnerId(session),
      connectionId: id,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    if (updated.channel === 'android' && updated.appKey === 'pocketly') {
      await revokeAppConnectionsByFilter({
        ownerId: getSessionOwnerId(session),
        filter: {
          appKey: 'pocketly',
          channel: 'android',
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Access revoked' });
  } catch (error) {
    console.error('Error revoking connected app:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
