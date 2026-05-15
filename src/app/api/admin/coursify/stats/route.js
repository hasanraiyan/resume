import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import AgentExecutionLog from '@/models/AgentExecutionLog';
import { AGENT_IDS } from '@/lib/constants/agents';

export async function GET(request) {
  try {
    await dbConnect();

    // Get date range from query params (default 30 days)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // 1. Get all Coursify Search logs for the selected range
    const logs = await AgentExecutionLog.find({
      agentId: AGENT_IDS.COURSIFY_SEARCH,
      createdAt: { $gte: sinceDate },
    })
      .sort({ createdAt: -1 })
      .lean();

    // 2. Aggregate Stats from Logs
    const summary = logs.reduce(
      (acc, log) => {
        const usage = log.usage || {};
        acc.totalTokens += usage.totalTokens || 0;
        acc.promptTokens += usage.promptTokens || 0;
        acc.completionTokens += usage.completionTokens || 0;

        // Calculate cost: $0.002 per 1k tokens * 83.5 INR/USD
        const costINR = ((usage.totalTokens || 0) / 1000) * 0.002 * 83.5;
        acc.estimatedCostINR += costINR;

        if (log.status === 'success') acc.successCount++;
        else acc.errorCount++;

        return acc;
      },
      {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostINR: 0,
        successCount: 0,
        errorCount: 0,
      }
    );

    // 3. Daily Usage Trend
    const dailyUsageMap = {};
    logs.forEach((log) => {
      const date = new Date(log.createdAt).toISOString().split('T')[0];
      if (!dailyUsageMap[date]) dailyUsageMap[date] = { date, tokens: 0, cost: 0, count: 0 };

      const tokens = log.usage?.totalTokens || 0;
      const cost = (tokens / 1000) * 0.002 * 83.5;

      dailyUsageMap[date].tokens += tokens;
      dailyUsageMap[date].cost += cost;
      dailyUsageMap[date].count += 1;
    });

    const dailyUsage = Object.values(dailyUsageMap).sort((a, b) => a.date.localeCompare(b.date));

    // 4. Top Topics (most frequent queries)
    const topicCounts = {};
    logs.forEach((log) => {
      let topic = 'Unknown';
      if (typeof log.input === 'string') {
        topic = log.input;
      } else if (log.input?.topic) {
        topic = log.input.topic;
      } else if (log.input?.query) {
        topic = log.input.query;
      } else if (log.input?.q) {
        topic = log.input.q;
      }

      if (!topicCounts[topic]) topicCounts[topic] = { title: topic, count: 0, tokens: 0, cost: 0 };

      const tokens = log.usage?.totalTokens || 0;
      topicCounts[topic].count += 1;
      topicCounts[topic].tokens += tokens;
      topicCounts[topic].cost += (tokens / 1000) * 0.002 * 83.5;
    });

    const topTopics = Object.values(topicCounts)
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10);

    // 5. Total Courses in DB (context)
    const totalCourses = await CoursifyCourse.countDocuments({ deletedAt: null });

    return NextResponse.json({
      success: true,
      summary: {
        totalExecutions: logs.length,
        totalCourses,
        ...summary,
      },
      topTopics,
      dailyUsage,
      recentLogs: logs.slice(0, 20),
    });
  } catch (error) {
    console.error('[CoursifyStats] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
