import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import MemoscribeNote from '@/models/MemoscribeNote';
import { getUserQdrantClient, ensureUserCollection } from '@/lib/memoscribe-qdrant';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await dbConnect();
    const note = await MemoscribeNote.findOne({ _id: id, userId: session.user.id });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.vectorId) {
      try {
        const qdrantClient = await getUserQdrantClient(session.user.id);
        if (qdrantClient) {
          const collectionName = await ensureUserCollection(qdrantClient);
          await qdrantClient.delete(collectionName, {
            points: [note.vectorId],
          });
        }
      } catch (err) {
        console.error('Qdrant deletion error:', err);
      }
    }

    await MemoscribeNote.deleteOne({ _id: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/memoscribe/notes/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
