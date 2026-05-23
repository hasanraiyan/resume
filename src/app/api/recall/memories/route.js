import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RecallMemory from '@/models/RecallMemory';
import { createRecallMemory } from '@/lib/recall/memory-service';
import { requireAdminAuth } from '@/lib/money-auth';

export async function GET(req) {
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);

    const memories = await RecallMemory.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ memories });
  } catch (error) {
    console.error('[ReCall GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memories', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const memory = await createRecallMemory(body.text);
    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    console.error('[ReCall POST] Error:', error);
    const status = error.message === 'Text is required' ? 400 : 500;
    return NextResponse.json(
      { error: 'Failed to create memory', details: error.message },
      { status }
    );
  }
}
