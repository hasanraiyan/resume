// src/app/api/media/public-edit/route.js
import dbConnect from '@/lib/dbConnect';
import MediaAgentSettings from '@/models/MediaAgentSettings';
import agentRegistry from '@/lib/agents/AgentRegistry';
import { NextResponse } from 'next/server';
import { AGENT_IDS } from '@/lib/constants/agents';

// Ensure agents are registered
import '@/lib/agents';

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

    // Use agent ID from constants for tracking
    const agentId = AGENT_IDS.IMAGE_EDITOR;

    console.log('[Public Edit] Executing Agent:', {
      agentId,
      aspectRatio,
    });

    // Ensure the image string is just base64 data (strip prefix if exists)
    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;

    // Use agentRegistry to edit the image
    // We let the Agent handle its own configuration (provider, model) from DB/Registry
    const { buffer, mimeType } = await agentRegistry.execute(agentId, {
      base64Images: [base64Data],
      editPrompt: prompt.trim(),
      aspectRatio,
    });

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
