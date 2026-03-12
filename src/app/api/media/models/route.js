// src/app/api/media/models/route.js
import dbConnect from '@/lib/dbConnect';
import ProviderSettings from '@/models/ProviderSettings';
import { decrypt } from '@/lib/crypto';
import OpenAI from 'openai';
import {
  DEFAULT_TTL_MS,
  getCachedProviderModels,
  setCachedProviderModels,
} from '@/lib/providers/modelListCache';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    console.log('[Media Models API] Request received, providerId:', providerId);

    await dbConnect();
    const providersList = await ProviderSettings.find({}).lean();

    if (!providersList || providersList.length === 0) {
      console.log('[Media Models API] No providers configured');
      return Response.json({ providers: [], models: [] });
    }

    // Return list of active providers if no providerId specified
    if (!providerId) {
      const providers = providersList
        .filter((p) => p.isActive)
        .map((p) => ({
          id: p.providerId,
          name: p.name,
          isGoogle: p.baseUrl?.includes('googleapis'),
        }));
      console.log('[Media Models API] Returning providers:', providers.length);
      return Response.json({ providers });
    }

    // Fetch models for a specific provider
    console.log('[Media Models API] Looking for provider:', providerId);
    const provider = providersList.find((p) => p.providerId === providerId);

    if (!provider) {
      console.log('[Media Models API] Provider not found:', providerId);
      return Response.json({ error: 'Provider not found' }, { status: 404 });
    }

    console.log('[Media Models API] Provider found:', provider.name);

    const cachedModels = getCachedProviderModels(providerId);
    if (cachedModels) {
      console.log(
        '[Media Models API] Returning cached models:',
        cachedModels.models.length,
        'TTL ms remaining:',
        Math.max(cachedModels.expiresAt - Date.now(), 0)
      );
      return Response.json({
        models: cachedModels.models,
        cached: true,
        ttlMs: DEFAULT_TTL_MS,
      });
    }

    const decryptedKey = decrypt(provider.apiKey);
    if (!decryptedKey) {
      console.error('[Media Models API] Failed to decrypt API key');
      return Response.json({ error: 'Failed to decrypt API key' }, { status: 500 });
    }

    try {
      const openai = new OpenAI({
        apiKey: decryptedKey,
        baseURL: provider.baseUrl,
      });

      console.log('[Media Models API] Fetching models from provider...');
      const response = await openai.models.list();
      const models = response.data.map((m) => m.id);
      setCachedProviderModels(providerId, models);

      console.log('[Media Models API] Retrieved', models.length, 'models');
      return Response.json({ models, cached: false, ttlMs: DEFAULT_TTL_MS });
    } catch (apiError) {
      console.error('[Media Models API] OpenAI API error:', apiError.message);
      // Return empty models array instead of error for better UX
      return Response.json({ models: [], warning: 'Could not fetch models: ' + apiError.message });
    }
  } catch (error) {
    console.error('[Media Models API] Error fetching media models:', error);
    return Response.json(
      { error: 'Failed to fetch models', details: error.message },
      { status: 500 }
    );
  }
}
