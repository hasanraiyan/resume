import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AppModel from '@/models/App';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import agentRegistry from '@/lib/agents/index';
import { AGENT_IDS } from '@/lib/constants/agents';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { id } = await params;

    const app = await AppModel.findById(id).lean();
    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Unified Archive Check: if threadId is present, fetch live content from checkpointer
    if (app.threadId) {
      try {
        const appBuilder = agentRegistry.get(AGENT_IDS.APP_BUILDER);
        const state = await appBuilder.getThreadState(app.threadId);
        if (state && state.content) {
          app.content = state.content;
          if (state.todoList) app.todoList = state.todoList;
        }
      } catch (err) {
        console.warn(
          'Failed to fetch live content from thread, falling back to stored content:',
          err
        );
      }
    }

    return NextResponse.json({ app });
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Failed to fetch app:', error);
    return NextResponse.json({ error: 'Failed to fetch app' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const app = await AppModel.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name,
          description: body.description,
          content: body.content,
          icon: body.icon,
          designSchema: body.designSchema,
          threadId: body.threadId,
        },
      },
      { new: true, runValidators: true }
    );

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Sync manual change back to thread checkpoint
    if (app.threadId) {
      try {
        const appBuilder = agentRegistry.get(AGENT_IDS.APP_BUILDER);
        await appBuilder.updateThreadState(app.threadId, { content: body.content });
      } catch (err) {
        console.error('Failed to update thread state during manual edit sync:', err);
      }
    }

    return NextResponse.json({ app });
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Failed to update app:', error);
    return NextResponse.json({ error: 'Failed to update app' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const { id } = await params;

    const app = await AppModel.findByIdAndDelete(id);
    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'App deleted successfully' });
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Failed to delete app:', error);
    return NextResponse.json({ error: 'Failed to delete app' }, { status: 500 });
  }
}
