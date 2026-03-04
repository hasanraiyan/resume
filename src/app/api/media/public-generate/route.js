// src/app/api/media/public-generate/route.js
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
