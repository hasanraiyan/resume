import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import { dbCreateCourse } from '@/lib/coursify/db-ops';

export async function GET(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { dbListCourses, dbSearchCourses } = await import('@/lib/coursify/db-ops');

    let courses;
    if (query) {
      courses = await dbSearchCourses({ query });
    } else {
      courses = await dbListCourses({ status, limit, offset });
    }

    return NextResponse.json({ success: true, courses });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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
