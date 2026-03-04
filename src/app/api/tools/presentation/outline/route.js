import { NextResponse } from 'next/server';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';
import Presentation from '@/models/Presentation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'admin';
    const authorId = isAdmin ? session.user.id || session.user._id : null;

    const body = await req.json();
    const { topic, instructions } = body;

    if (!topic || topic.trim() === '') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Use Presentation Agent
    const presentationAgent = agentRegistry.get(AGENT_IDS.PRESENTATION_SYNTHESIZER);

    // Draft the outline
    const outline = await presentationAgent.execute({ action: 'draft_outline', topic, instructions, isAdmin });

    await dbConnect();

    // Create a draft presentation in DB
    const presentation = new Presentation({
      topic,
      outline,
      status: 'draft',
      authorId
    });

    await presentation.save();

    return NextResponse.json({
       success: true,
       presentationId: presentation._id,
       outline
    });

  } catch (error) {
    console.error('Presentation Outline Gen Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate outline' }, { status: 500 });
  }
}
