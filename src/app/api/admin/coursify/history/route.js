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
    const id = searchParams.get('id');

    if (id) {
      const item = await CoursifyResearch.findOne({ _id: id, deletedAt: null }).lean();
      if (!item) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, artifact: item });
    }

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

export async function DELETE(request) {
  try {
    const authResult = await requireAdminAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    // Find the document first to get qdrantId
    const doc = await CoursifyResearch.findById(id);
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Artifact not found' }, { status: 404 });
    }

    // Soft delete: set deletedAt timestamp
    const result = await CoursifyResearch.findByIdAndUpdate(
      id,
      {
        deletedAt: new Date(),
        syncVersion: { $inc: 1 },
      },
      { new: true }
    );

    // Delete from Qdrant if qdrantId exists
    if (doc.qdrantId && process.env.QDRANT_URL) {
      try {
        const qdrantUrl = process.env.QDRANT_URL;
        const response = await fetch(`${qdrantUrl}/collections/coursify_research/points/delete`, {
          method: 'POST',
          headers: {
            'api-key': process.env.QDRANT_API_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            points_selector: {
              points: [doc.qdrantId],
            },
          }),
        });

        if (!response.ok) {
          console.warn(`[CoursifyHistory] Failed to delete from Qdrant: ${response.status}`);
        }
      } catch (err) {
        console.warn(`[CoursifyHistory] Error deleting from Qdrant: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Artifact deleted successfully',
      artifact: result,
    });
  } catch (error) {
    console.error('[CoursifyHistory DELETE] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
