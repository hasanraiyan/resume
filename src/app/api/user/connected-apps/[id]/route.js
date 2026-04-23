import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/dbConnect';
import ConnectedApp from '@/models/ConnectedApp';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * DELETE /api/user/connected-apps/:id
 * Revoke a connected app by its MongoDB _id.
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

    await dbConnect();
    const deleted = await ConnectedApp.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Connected app not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Access revoked successfully' });
  } catch (error) {
    console.error('Error revoking connected app:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
