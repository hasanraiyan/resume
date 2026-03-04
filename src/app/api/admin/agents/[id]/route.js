/**
 * Agent Management API - Single Agent Operations
 * GET/PUT/DELETE /api/admin/agents/[id]
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import agentRegistry from '@/lib/agents';
import agentManager from '@/lib/agents/AgentManager';
import dbConnect from '@/lib/dbConnect';
import AgentConfig from '@/models/AgentConfig';

// Ensure agents are imported and registered
import '@/lib/agents';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: agentId } = await params;

    if (!agentRegistry.has(agentId)) {
      return NextResponse.json({ error: `Agent ${agentId} not found` }, { status: 404 });
    }

    const metadata = agentRegistry.getMetadata(agentId);
    const status = agentManager.getAgentStatus(agentId);
    const metrics = agentManager.getMetrics(agentId);

    return NextResponse.json({
      success: true,
      agent: {
        ...metadata,
        ...status,
        metrics,
      },
    });
  } catch (error) {
    console.error('[Agent Get] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: agentId } = await params;
    const body = await request.json();

    console.log('[Agent Update] Received update request for agent:', agentId, body);

    if (!agentRegistry.has(agentId)) {
      return NextResponse.json({ error: `Agent ${agentId} not found` }, { status: 404 });
    }

    // Map input fields to updates
    const updates = {};
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.providerId !== undefined) updates.providerId = body.providerId;
    if (body.model !== undefined) updates.model = body.model;
    if (body.persona !== undefined) updates.persona = body.persona;
    if (body.tools !== undefined) updates.tools = body.tools;
    if (body.rateLimit !== undefined) updates.rateLimit = body.rateLimit;

    // Persist to database
    await dbConnect();
    const updatedConfig = await AgentConfig.findOneAndUpdate(
      { agentId },
      { $set: updates },
      { upsert: true, new: true, runValidators: true }
    );

    // Update in runtime dynamically without reboot
    await agentManager.updateAgentConfig(agentId, updates);

    // Re-initialize the running agent so it catches the new DB records immediately
    const runningAgent = agentRegistry.getExisting(agentId);
    if (runningAgent) {
      await runningAgent.initialize();
    }

    const metadata = agentRegistry.getMetadata(agentId);
    const status = agentManager.getAgentStatus(agentId);

    return NextResponse.json({
      success: true,
      message: `Agent ${agentId} updated successfully`,
      settings: updatedConfig,
      agent: { ...metadata, ...status },
    });
  } catch (error) {
    console.error('[Agent Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update agent', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: agentId } = await params;

    // Note: We only unregister from runtime, not from constants
    // Constants are the source of truth for available agents
    if (agentRegistry.hasInstance(agentId)) {
      const agent = agentRegistry.getExisting(agentId);
      agent.deactivate();
      agentRegistry.unregister(agentId);
    }

    return NextResponse.json({
      success: true,
      message: `Agent ${agentId} unregistered successfully`,
    });
  } catch (error) {
    console.error('[Agent Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent', details: error.message },
      { status: 500 }
    );
  }
}
