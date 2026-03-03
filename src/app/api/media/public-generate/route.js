// src/app/api/media/public-generate/route.js
import dbConnect from '@/lib/dbConnect';
import MediaAgentSettings from '@/models/MediaAgentSettings';
import imageService from '@/lib/image-service';
import { NextResponse } from 'next/server';
import { AGENT_IDS } from '@/lib/constants/agents';
import agentRegistry from '@/lib/agents/AgentRegistry';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, aspectRatio = '1:1' } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Prompt is required.' }, { status: 400 });
    }

    // Connect to DB to get settings
    await dbConnect();

    // Fetch pre-selected model and provider from Admin settings
    const settings = await MediaAgentSettings.findOne({});

    // Use agent ID from constants for tracking
    const agentId = AGENT_IDS.IMAGE_GENERATOR;
    const providerId = settings?.generationProviderId || settings?.providerId;
    const model = settings?.generationModel || settings?.model;

    console.log('[Public Generate] Using Agent:', {
      agentId,
      providerId,
      model,
      aspectRatio,
    });

    // Generate the image
    const { buffer, mimeType } = await imageService.generateImage(
      prompt.trim(),
      aspectRatio,
      providerId,
      model
    );

    // Convert to base64 for direct display
    const base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;

    console.log('[Public Generate] Success, returning image data...');

    // We do NOT save to MongoDB, Cloudinary, or Qdrant as requested
    return NextResponse.json({
      success: true,
      image: base64Image,
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
