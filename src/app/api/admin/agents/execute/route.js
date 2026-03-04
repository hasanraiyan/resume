/**
 * Agent Execute API
 * POST /api/admin/agents/execute
 *
 * Execute an agent with provided input.
 * Used for testing and manual agent invocation.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import agentRegistry from '@/lib/agents';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, input } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    if (!input) {
      return NextResponse.json({ error: 'input is required' }, { status: 400 });
    }

    if (!agentRegistry.has(agentId)) {
      return NextResponse.json({ error: `Agent ${agentId} not found` }, { status: 404 });
    }

    const agent = agentRegistry.get(agentId);

    if (!agent.canExecute()) {
      return NextResponse.json({ error: `Agent ${agentId} is rate limited` }, { status: 429 });
    }

    const startTime = Date.now();
    const result = await agent.execute(input);
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      result,
      metadata: {
        agentId,
        executionTime,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('[Agent Execute] Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute agent', details: error.message },
      { status: 500 }
    );
  }
}
