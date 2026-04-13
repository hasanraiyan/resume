import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import MemoscribeSettings from '@/models/MemoscribeSettings';
import { encrypt } from '@/lib/crypto';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const settings = await MemoscribeSettings.findOne({ userId: session.user.id });

    // We don't return the encrypted api key to the frontend for security reasons
    return NextResponse.json({
      settings: settings
        ? { qdrantUrl: settings.qdrantUrl, hasApiKey: !!settings.qdrantApiKey }
        : null,
    });
  } catch (error) {
    console.error('Error in GET /api/memoscribe/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { qdrantUrl, qdrantApiKey } = await request.json();

    if (!qdrantUrl) {
      return NextResponse.json({ error: 'Qdrant URL is required' }, { status: 400 });
    }

    await dbConnect();

    const updateData = {
      qdrantUrl,
    };

    if (qdrantApiKey) {
      // Encrypt the api key before saving it
      updateData.qdrantApiKey = encrypt(qdrantApiKey);
    }

    const settings = await MemoscribeSettings.findOneAndUpdate(
      { userId: session.user.id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      settings: { qdrantUrl: settings.qdrantUrl, hasApiKey: !!settings.qdrantApiKey },
    });
  } catch (error) {
    console.error('Error in POST /api/memoscribe/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
