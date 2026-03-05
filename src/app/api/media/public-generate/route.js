// src/app/api/media/public-generate/route.js
import agentRegistry from '@/lib/agents';
import { NextResponse } from 'next/server';
import { AGENT_IDS } from '@/lib/constants/agents';
import { rateLimit } from '@/lib/rateLimit';
import { mediaService } from '@/lib/services/MediaService';

// Ensure agents are registered
import '@/lib/agents';

export async function POST(request) {
  // Rate limit: 5 requests per 60 minutes
  const limitResponse = rateLimit(request, 5, 3600000);
  if (limitResponse) return limitResponse;

  try {
    const body = await request.json();
    const { prompt, aspectRatio = '1:1' } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Prompt is required.' }, { status: 400 });
    }

    // Use agent ID from constants for tracking
    const agentId = AGENT_IDS.IMAGE_GENERATOR;

    console.log('[Public Generate] Executing Agent:', {
      agentId,
      aspectRatio,
    });

    // Generate the image via Agent
    // We let the Agent handle its own configuration (provider, model) from DB/Registry
    const { buffer, mimeType } = await agentRegistry.execute(agentId, {
      prompt: prompt.trim(),
      aspectRatio,
    });

    const uploadedFile = await mediaService.uploadBufferToUploadThing({
      buffer,
      mimeType,
      prefix: 'ai-generate',
    });

    console.log('[Public Generate] Success, returning UploadThing URL...');

    return NextResponse.json({
      success: true,
      image: uploadedFile.ufsUrl,
      fileKey: uploadedFile.key,
      mimeType,
      agentId,
    });
  } catch (error) {
    console.error('[Public Generate] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Image generation failed.',
      },
      { status: 500 }
    );
  }
}
