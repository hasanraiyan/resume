import { NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import dbConnect from '@/lib/dbConnect';
import ChatLog from '@/models/ChatLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 15;
    const searchQuery = searchParams.get('search') || '';
    const pathFilter = searchParams.get('path') || '';

    const query = {};

    if (searchQuery) {
      query.$or = [
        { userMessage: { $regex: searchQuery, $options: 'i' } },
        { aiResponse: { $regex: searchQuery, $options: 'i' } },
        { sessionId: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    if (pathFilter) {
      query.path = pathFilter;
    }

    const logs = await ChatLog.find(query)
      .select(
        'sessionId path userMessage aiResponse modelName conversationContext toolsUsed executionTime createdAt'
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    console.log(`[Admin Logs API] 📋 Retrieved ${logs.length} logs`);
    console.log(
      `[Admin Logs API] 🔍 First log has conversationContext: ${logs[0]?.conversationContext ? 'YES' : 'NO'}`
    );
    if (logs[0]?.conversationContext) {
      console.log(
        `[Admin Logs API] 📊 First log context size: ${JSON.stringify(logs[0].conversationContext).length} chars`
      );
      console.log(
        `[Admin Logs API] 🔢 First log context messages: ${logs[0].conversationContext.length}`
      );
      console.log(
        `[Admin Logs API] 📋 First log context type: ${Array.isArray(logs[0].conversationContext) ? 'Array' : typeof logs[0].conversationContext}`
      );
      console.log(
        `[Admin Logs API] 📋 First message role: ${logs[0].conversationContext[0]?.role || 'N/A'}`
      );
      console.log(
        `[Admin Logs API] 📋 First message preview: ${logs[0].conversationContext[0]?.content?.substring(0, 100) || 'N/A'}...`
      );
    } else {
      console.log(`[Admin Logs API] ⚠️ First log missing conversationContext field`);
      console.log(
        `[Admin Logs API] 📋 Available fields in first log: ${Object.keys(logs[0] || {}).join(', ')}`
      );
    }

    // Log all logs for debugging
    logs.forEach((log, index) => {
      console.log(`[Admin Logs API] 📋 Log ${index + 1} (${log._id}):`);
      console.log(
        `[Admin Logs API]   - conversationContext: ${log.conversationContext ? 'YES' : 'NO'}`
      );
      console.log(`[Admin Logs API]   - toolsUsed: ${log.toolsUsed ? 'YES' : 'NO'}`);
      if (log.conversationContext) {
        console.log(`[Admin Logs API]   - context messages: ${log.conversationContext.length}`);
      }
    });

    const totalLogs = await ChatLog.countDocuments(query);

    const distinctPaths = await ChatLog.distinct('path');

    return NextResponse.json({
      logs,
      totalPages: Math.ceil(totalLogs / limit),
      currentPage: page,
      distinctPaths,
    });
  } catch (error) {
    console.error('Error fetching chat logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
