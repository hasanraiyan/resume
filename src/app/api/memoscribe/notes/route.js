import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import MemoscribeNote from '@/models/MemoscribeNote';
import {
  getUserQdrantClient,
  ensureUserCollection,
  generateEmbedding,
} from '@/lib/memoscribe-qdrant';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const notes = await MemoscribeNote.find({ userId: session.user.id }).sort({ createdAt: -1 });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error in GET /api/memoscribe/notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, text } = await request.json();

    if (!title || !text) {
      return NextResponse.json({ error: 'Title and text are required' }, { status: 400 });
    }

    await dbConnect();

    const qdrantClient = await getUserQdrantClient(session.user.id);
    let vectorId = null;

    if (qdrantClient) {
      try {
        const collectionName = await ensureUserCollection(qdrantClient);
        const vector = await generateEmbedding(`${title}\n${description || ''}\n${text}`);
        vectorId = uuidv4();

        await qdrantClient.upsert(collectionName, {
          points: [
            {
              id: vectorId,
              vector: vector,
              payload: {
                userId: session.user.id,
                title,
                description,
                text,
              },
            },
          ],
        });
      } catch (err) {
        console.error('Qdrant/Embedding error:', err);
        // Continue and save to DB anyway, but without a vectorId
      }
    }

    const note = await MemoscribeNote.create({
      userId: session.user.id,
      title,
      description,
      text,
      vectorId,
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/memoscribe/notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
