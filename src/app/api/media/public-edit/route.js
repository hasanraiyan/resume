// src/app/api/media/public-edit/route.js
import dbConnect from '@/lib/dbConnect';
import MediaAgentSettings from '@/models/MediaAgentSettings';
import imageService from '@/lib/image-service';
import { NextResponse } from 'next/server';
import { AGENT_IDS } from '@/lib/constants/agents';

export async function POST(request) {
  try {
    const body = await request.json();
    const { image, prompt, aspectRatio = '1:1' } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Original image is required as base64.' },
        { status: 400 }
      );
    }
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Edit prompt is required.' },
        { status: 400 }
      );
    }

    // Connect to DB to get settings
    await dbConnect();

    // Fetch pre-selected model and provider from Admin settings
    const settings = await MediaAgentSettings.findOne({});

    // Use agent ID from constants for tracking
    const agentId = AGENT_IDS.IMAGE_EDITOR;

    // For editing, we check if there's a specific edit model or use the general one
    // In our case we use the model from settings which is intended for analysis/generation
    // Note: Some models support editing better than others.
    const providerId = settings?.generationProviderId || settings?.providerId;
    const model = settings?.generationModel || settings?.model || 'gemini-1.5-flash';

    console.log('[Public Edit] Using Agent:', {
      agentId,
      source: settings?.generationProviderId ? 'Generation Config' : 'Analysis Fallback',
      providerId,
      model,
      aspectRatio,
    });

    // Ensure the image string is just base64 data (strip prefix if exists)
    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;

    // Use imageService to edit the image
    const { buffer, mimeType } = await imageService.editImage(
      [base64Data], // Pass as array
      prompt.trim(),
      aspectRatio,
      providerId,
      model
    );

    // Convert back to base64 for direct display
    const resultBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;

    console.log('[Public Edit] Success, returning edited image data...');

    // No storage, no Cloudinary, just the result
    return NextResponse.json({
      success: true,
      image: resultBase64,
      mimeType,
      agentId,
    });
  } catch (error) {
    console.error('[Public Edit] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Image editing failed.',
      },
      { status: 500 }
    );
  }
}
