import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import AgentExecutionLog from '@/models/AgentExecutionLog';

/**
 * GET /api/admin/agents/[id]/metrics
 * Fetches aggregated execution metrics for a specific agent.
 * Currently returns executions grouped by day for the last 30 days.
 */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: agentId } = await params;

    // Parse query params for date range (default 30 days)
    const url = new URL(request.url);
    const daysStr = url.searchParams.get('days') || '30';
    const days = parseInt(daysStr, 10);

    await dbConnect();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // 1. Get overall general stats (total executions, total errors, etc.)
    const totalExecutions = await AgentExecutionLog.countDocuments({ agentId });
    const successExecutions = await AgentExecutionLog.countDocuments({
      agentId,
      status: 'success',
    });
    const errorExecutions = await AgentExecutionLog.countDocuments({ agentId, status: 'error' });
    const lastExecution = await AgentExecutionLog.findOne({ agentId }).sort({ createdAt: -1 });

    // 2. Get daily aggregations for the chart
    const dailyStats = await AgentExecutionLog.aggregate([
      {
        $match: {
          agentId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          success: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          errors: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] },
          },
          avgDuration: { $avg: '$durationMs' },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by date ascending
      },
    ]);

    // Fill in missing days with 0 counts
    const chartData = [];
    const currDate = new Date(startDate);
    while (currDate <= endDate) {
      const dateStr = currDate.toISOString().split('T')[0];
      const existingStat = dailyStats.find((s) => s._id === dateStr);

      chartData.push({
        date: dateStr,
        total: existingStat?.count || 0,
        success: existingStat?.success || 0,
        errors: existingStat?.errors || 0,
        avgDurationMs: Math.round(existingStat?.avgDuration || 0),
      });

      currDate.setDate(currDate.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalExecutions,
          successExecutions,
          errorExecutions,
          lastExecutedAt: lastExecution?.createdAt || null,
          successRate: totalExecutions > 0 ? (successExecutions / totalExecutions) * 100 : 0,
        },
        chartData,
      },
    });
  } catch (error) {
    console.error(`[Agent Metrics API] Error fetching metrics for agent:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch agent metrics', details: error.message },
      { status: 500 }
    );
  }
}
