import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AppModel from '@/models/App';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import agentRegistry from '@/lib/agents/index';
import { AGENT_IDS } from '@/lib/constants/agents';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    // Exclude content from the list view payload to save bandwidth
    const apps = await AppModel.find().select('-content').sort({ createdAt: -1 }).lean();
    return NextResponse.json({ apps });
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Failed to fetch apps:', error);
    return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const body = await req.json();
    let { threadId, content, type, designSchema, icon, name, description } = body;

    // Unified approach: ensure every app (manual or AI) has a threadId and content is in checkpointer
    if (!threadId) {
      threadId = `${type || 'manual'}-build-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    // Initialize the checkpointer for MUST case
    try {
      const appBuilder = agentRegistry.get(AGENT_IDS.APP_BUILDER);
      await appBuilder.updateThreadState(threadId, { content: content || '' });
    } catch (err) {
      console.error('Failed to initialize thread state for manual/new app:', err);
    }

    const app = await AppModel.create({
      name,
      description,
      content, // Fallback
      type: type || 'manual',
      threadId,
      designSchema: designSchema || 'modern',
      icon: icon || 'Layout',
      isActive: true,
    });

    return NextResponse.json({ app }, { status: 201 });
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Failed to create app:', error);
    return NextResponse.json({ error: 'Failed to create app' }, { status: 500 });
  }
}
