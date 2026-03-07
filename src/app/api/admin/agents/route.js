/**
 * Agent Management API - List All Agents
 * GET /api/admin/agents
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import agentRegistry from '@/lib/agents';
import agentManager from '@/lib/agents/AgentManager';
import { DEFAULT_AGENT_CONFIGS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';
import AgentConfig from '@/models/AgentConfig';
import AgentExecutionLog from '@/models/AgentExecutionLog';

// Ensure agents are imported and registered
import '@/lib/agents';

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
    const dbSettings = await AgentConfig.find({}).lean();
    const dbAgentsMap = new Map();

    if (dbSettings && dbSettings.length > 0) {
      dbSettings.forEach((agent) => {
        dbAgentsMap.set(agent.agentId, {
          providerId: agent.providerId || '',
          model: agent.model || '',
          persona: agent.persona || '',
          isActive: agent.isActive,
          tools: agent.tools || [],
          activeMCPs: agent.activeMCPs || [],
        });
      });
    }

    // Fetch execution stats for all agents efficiently
    const executionStats = await AgentExecutionLog.aggregate([
      {
        $group: {
          _id: '$agentId',
          totalExecutions: { $sum: 1 },
          lastExecutedAt: { $max: '$createdAt' },
        },
      },
    ]);

    const executionStatsMap = new Map();
    executionStats.forEach((stat) => {
      executionStatsMap.set(stat._id, {
        totalExecutions: stat.totalExecutions,
        lastExecutedAt: stat.lastExecutedAt,
      });
    });

    // Get runtime status for each agent and merge with DB settings
    const agentsWithStatus = registeredAgents.map((agent) => {
      const status = agentManager.getAgentStatus(agent.agentId);
      const defaultConfig = DEFAULT_AGENT_CONFIGS[agent.agentId];
      const dbConfig = dbAgentsMap.get(agent.agentId) || {};
      const stats = executionStatsMap.get(agent.agentId) || {
        totalExecutions: 0,
        lastExecutedAt: null,
      };

      return {
        ...agent,
        ...status,
        ...dbConfig,
        defaultModel: defaultConfig?.defaultModel || null,
        defaultProvider: defaultConfig?.defaultProvider || null,
        tools: dbConfig.tools?.length > 0 ? dbConfig.tools : defaultConfig?.tools || [],

        // Override in-memory stats with persistent DB stats
        executionCount: stats.totalExecutions,
        lastExecutedAt: stats.lastExecutedAt || status.lastExecutedAt,
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
