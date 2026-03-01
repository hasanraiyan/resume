import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import dbConnect from '@/lib/dbConnect';
import ChatbotSettings from '@/models/ChatbotSettings';
import { decrypt } from '@/lib/crypto';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await dbConnect();
    const settings = await ChatbotSettings.findOne({});

    if (!settings || !settings.providers) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    const provider = settings.providers.find((p) => p.id === id);

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const decryptedKey = decrypt(provider.apiKey);
    if (!decryptedKey) {
      return NextResponse.json({ error: 'Failed to decrypt API key' }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: decryptedKey,
      baseURL: provider.baseUrl,
    });

    const response = await openai.models.list();

    // Extract model IDs from the response
    const models = response.data.map((model) => model.id);

    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models for provider:', error);
    return NextResponse.json({ error: 'Failed to fetch available models' }, { status: 500 });
  }
}
