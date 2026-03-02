// src/app/api/media/models/route.js
import dbConnect from '@/lib/dbConnect';
import ChatbotSettings from '@/models/ChatbotSettings';
import { decrypt } from '@/lib/crypto';
import OpenAI from 'openai';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    await dbConnect();
    const settings = await ChatbotSettings.findOne({});

    if (!settings || !settings.providers || settings.providers.length === 0) {
      return Response.json({ providers: [], models: [] });
    }

    // Return list of active providers if no providerId specified
    if (!providerId) {
      const providers = settings.providers
        .filter((p) => p.isActive)
        .map((p) => ({
          id: p.id,
          name: p.name,
          isGoogle: p.baseUrl?.includes('googleapis'),
        }));
      return Response.json({ providers });
    }

    // Fetch models for a specific provider
    const provider = settings.providers.find((p) => p.id === providerId);
    if (!provider) {
      return Response.json({ error: 'Provider not found' }, { status: 404 });
    }

    const decryptedKey = decrypt(provider.apiKey);
    if (!decryptedKey) {
      return Response.json({ error: 'Failed to decrypt API key' }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: decryptedKey,
      baseURL: provider.baseUrl,
    });

    const response = await openai.models.list();
    const models = response.data.map((m) => m.id);

    return Response.json({ models });
  } catch (error) {
    console.error('Error fetching media models:', error);
    return Response.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}
