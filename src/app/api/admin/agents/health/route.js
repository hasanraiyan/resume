/**
 * Agent Health Check API
 * GET /api/admin/agents/health
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import agentManager from '@/lib/agents/AgentManager';
import agentRegistry from '@/lib/agents/AgentRegistry';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const healthReport = agentManager.getHealthReport();
    const registryStats = agentRegistry.getStats();

    return NextResponse.json({
      success: true,
      health: healthReport,
      registry: registryStats,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Agent Health] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get agent health', details: error.message },
      { status: 500 }
    );
  }
}
