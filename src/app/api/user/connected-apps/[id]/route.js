import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/dbConnect';
import ConnectedApp from '@/models/ConnectedApp';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * DELETE /api/user/connected-apps/:id
 * Soft-revokes a connected app by setting isActive: false.
 * The record is kept so GPT's in-flight tokens are denied on next request.
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
    const updated = await ConnectedApp.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: { isActive: false } }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Connected app not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Access revoked' });
  } catch (error) {
    console.error('Error revoking connected app:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
