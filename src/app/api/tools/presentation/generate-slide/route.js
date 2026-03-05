import { NextResponse } from 'next/server';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';

export async function POST(req) {
  try {
    const body = await req.json();
    const { slide } = body;

    if (!slide) {
      return NextResponse.json({ error: 'Slide data is required' }, { status: 400 });
    }

    await dbConnect();

    // Use Presentation Agent
    const presentationAgent = agentRegistry.get(AGENT_IDS.PRESENTATION_SYNTHESIZER);

    // Generate single slide visual
    const result = await presentationAgent.generateSlideImage(slide);

    let finalImageUrl = result.imageUrl;

    return NextResponse.json({
      success: true,
      slide: {
        ...result,
        imageUrl: finalImageUrl,
      },
    });
  } catch (error) {
    console.error('Slide Generate Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate slide' },
      { status: 500 }
    );
  }
}
