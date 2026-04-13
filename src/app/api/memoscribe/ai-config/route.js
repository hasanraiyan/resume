import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import AgentConfig from '@/models/AgentConfig';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const chatConfig = await AgentConfig.findOne({ agentId: AGENT_IDS.MEMOSCRIBE_AGENT }).lean();
    const embedderConfig = await AgentConfig.findOne({ agentId: AGENT_IDS.MEMO_EMBEDDER }).lean();

    return NextResponse.json({
      configs: {
        chat: chatConfig || { agentId: AGENT_IDS.MEMOSCRIBE_AGENT },
        embedder: embedderConfig || { agentId: AGENT_IDS.MEMO_EMBEDDER },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/memoscribe/ai-config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chat, embedder } = await request.json();

    await dbConnect();

    if (chat) {
      await AgentConfig.findOneAndUpdate(
        { agentId: AGENT_IDS.MEMOSCRIBE_AGENT },
        { $set: { providerId: chat.providerId, model: chat.model } },
        { upsert: true }
      );
      // Re-initialize agent in the live registry
      const agent = agentRegistry.getAgent(AGENT_IDS.MEMOSCRIBE_AGENT);
      if (agent) {
        agent.isInitialized = false; // Force re-init on next use
      }
    }

    if (embedder) {
      await AgentConfig.findOneAndUpdate(
        { agentId: AGENT_IDS.MEMO_EMBEDDER },
        { $set: { providerId: embedder.providerId, model: embedder.model } },
        { upsert: true }
      );
      // Re-initialize embedder in the live registry
      const agent = agentRegistry.getAgent(AGENT_IDS.MEMO_EMBEDDER);
      if (agent) {
        agent.isInitialized = false; // Force re-init on next use
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/memoscribe/ai-config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
