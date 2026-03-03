/**
 * Agent Management API - Single Agent Operations
 * GET/PUT/DELETE /api/admin/agents/[id]
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import agentRegistry from '@/lib/agents/AgentRegistry';
import agentManager from '@/lib/agents/AgentManager';
import dbConnect from '@/lib/dbConnect';
import MediaAgentSettings from '@/models/MediaAgentSettings';

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

    // Update agent configuration
    const updates = {};
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.providerId !== undefined) updates.providerId = body.providerId;
    if (body.model !== undefined) updates.model = body.model;
    if (body.persona !== undefined) updates.persona = body.persona;
    if (body.embeddingProviderId !== undefined)
      updates.embeddingProviderId = body.embeddingProviderId;
    if (body.embeddingModel !== undefined) updates.embeddingModel = body.embeddingModel;
    if (body.generationProviderId !== undefined)
      updates.generationProviderId = body.generationProviderId;
    if (body.generationModel !== undefined) updates.generationModel = body.generationModel;
    if (body.qdrantCollection !== undefined) updates.qdrantCollection = body.qdrantCollection;
    if (body.rateLimit !== undefined) updates.rateLimit = body.rateLimit;

    console.log('[Agent Update] Processing updates:', updates);

    // Update in runtime
    await agentManager.updateAgentConfig(agentId, updates);

    // Persist to database
    await dbConnect();
    let settings = await MediaAgentSettings.findOne({});

    if (!settings) {
      console.log('[Agent Update] Creating new MediaAgentSettings');
      settings = new MediaAgentSettings();
      await settings.ensureDefaultAgents();
    }

    const agentIndex = settings.agents.findIndex((a) => a.id === agentId);
    console.log('[Agent Update] Agent index in DB:', agentIndex);

    if (agentIndex >= 0) {
      if (updates.isActive !== undefined) settings.agents[agentIndex].isActive = updates.isActive;
      if (updates.providerId !== undefined)
        settings.agents[agentIndex].providerId = updates.providerId;
      if (updates.model !== undefined) settings.agents[agentIndex].model = updates.model;
      if (updates.persona !== undefined) settings.agents[agentIndex].persona = updates.persona;
      if (updates.embeddingProviderId !== undefined)
        settings.agents[agentIndex].embeddingProviderId = updates.embeddingProviderId;
      if (updates.embeddingModel !== undefined)
        settings.agents[agentIndex].embeddingModel = updates.embeddingModel;
      if (updates.generationProviderId !== undefined)
        settings.agents[agentIndex].generationProviderId = updates.generationProviderId;
      if (updates.generationModel !== undefined)
        settings.agents[agentIndex].generationModel = updates.generationModel;
      if (updates.qdrantCollection !== undefined)
        settings.agents[agentIndex].qdrantCollection = updates.qdrantCollection;

      console.log('[Agent Update] Saving settings to DB...');
      await settings.save();
      console.log('[Agent Update] Settings saved successfully');
    } else {
      console.log('[Agent Update] Agent not found in DB, adding new entry');
      // Add new agent entry if it doesn't exist
      settings.agents.push({
        id: agentId,
        name: body.name || agentId,
        isActive: updates.isActive ?? true,
        providerId: updates.providerId || '',
        model: updates.model || '',
        persona: updates.persona || '',
        embeddingProviderId: updates.embeddingProviderId || '',
        embeddingModel: updates.embeddingModel || '',
        generationProviderId: updates.generationProviderId || '',
        generationModel: updates.generationModel || '',
        qdrantCollection: updates.qdrantCollection || 'media_assets',
      });
      await settings.save();
    }

    const metadata = agentRegistry.getMetadata(agentId);
    const status = agentManager.getAgentStatus(agentId);

    return NextResponse.json({
      success: true,
      message: `Agent ${agentId} updated successfully`,
      settings: settings,
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
