import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyResearch from '@/models/CoursifyResearch';
import { requireAdminAuth } from '@/lib/money-auth';

export async function GET(request) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    // Filter for active records
    const query = {
      deletedAt: null,
    };

    // Add text search if provided
    if (search) {
      query.$or = [
        { topic: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      CoursifyResearch.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CoursifyResearch.countDocuments(query),
    ]);

    // Format for the UI
    const logs = items.map((item) => ({
      _id: item._id,
      status: 'success', // Only successful research is in this model
      displayTopic: item.title || item.topic,
      createdAt: item.createdAt,
      usage: item.usage,
      costUSD: item.usage?.estimatedCostUSD || 0,
      durationMs: item.metadata?.durationMs,
      outputSlug: item.slug,
      agentId: item.metadata?.agentId || 'coursify_search',
    }));

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[CoursifyHistory] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
