/**
 * Agent Management API - List All Agents
 * GET /api/admin/agents
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import agentRegistry from '@/lib/agents/AgentRegistry';
import agentManager from '@/lib/agents/AgentManager';
import { AGENT_IDS, DEFAULT_AGENT_CONFIGS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';
import MediaAgentSettings from '@/models/MediaAgentSettings';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all registered agents from registry
    const registeredAgents = agentRegistry.getAll();

    // Get database settings to merge with registry data
    await dbConnect();
    const dbSettings = await MediaAgentSettings.findOne({});
    const dbAgentsMap = new Map();

    if (dbSettings && dbSettings.agents) {
      dbSettings.agents.forEach((agent) => {
        dbAgentsMap.set(agent.id, {
          providerId: agent.providerId || '',
          model: agent.model || '',
          embeddingProviderId: agent.embeddingProviderId || '',
          embeddingModel: agent.embeddingModel || '',
          generationProviderId: agent.generationProviderId || '',
          generationModel: agent.generationModel || '',
          persona: agent.persona || '',
        });
      });
    }

    // Get runtime status for each agent and merge with DB settings
    const agentsWithStatus = registeredAgents.map((agent) => {
      const status = agentManager.getAgentStatus(agent.agentId);
      const defaultConfig = DEFAULT_AGENT_CONFIGS[agent.agentId];
      const dbConfig = dbAgentsMap.get(agent.agentId) || {};

      return {
        ...agent,
        ...status,
        ...dbConfig,
        defaultModel: defaultConfig?.defaultModel || null,
        defaultProvider: defaultConfig?.defaultProvider || null,
        tools: defaultConfig?.tools || [],
      };
    });

    // Get registry statistics
    const stats = agentRegistry.getStats();

    return NextResponse.json({
      success: true,
      agents: agentsWithStatus,
      stats,
    });
  } catch (error) {
    console.error('[Agent List] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents', details: error.message },
      { status: 500 }
    );
  }
}
