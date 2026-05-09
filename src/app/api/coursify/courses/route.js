import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import { dbCreateCourse } from '@/lib/coursify/db-ops';

export async function POST(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { title, description, difficulty, estimatedDuration, tags } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const { course } = await dbCreateCourse({
      title,
      description,
      difficulty,
      estimatedDuration,
      tags,
    });

    return NextResponse.json({ success: true, course });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
