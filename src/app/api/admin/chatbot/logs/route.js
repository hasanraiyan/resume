import { NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import dbConnect from '@/lib/dbConnect';
import ChatLog from '@/models/ChatLog';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request) {
  const session = await getServerSession(authOptions)

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
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

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