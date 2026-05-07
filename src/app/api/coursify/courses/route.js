import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';

export async function POST(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const body = await request.json();
    const { title, description, difficulty, estimatedDuration, tags, thumbnail } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const course = await CoursifyCourse.create({
      title: title.trim(),
      description: description?.trim() || '',
      difficulty: difficulty || 'beginner',
      estimatedDuration: estimatedDuration || '',
      tags: Array.isArray(tags) ? tags : [],
      thumbnail: thumbnail || null,
    });

    return NextResponse.json({
      success: true,
      course: { ...course.toObject(), _id: course._id.toString() },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
