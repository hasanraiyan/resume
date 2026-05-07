import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';

export async function GET(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    const course = await CoursifyCourse.findOne({ _id: id, deletedAt: null })
      .select('researchNotes')
      .lean();

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const notes = (course.researchNotes || []).map((n) => ({
      ...n,
      id: n._id?.toString(),
      _id: n._id?.toString(),
    }));

    return NextResponse.json({ success: true, notes });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const { title, summary, sourceUrl, sourceType, notes, accessedAt } = body;
    if (!title || !summary) {
      return NextResponse.json(
        { success: false, error: 'title and summary are required' },
        { status: 400 }
      );
    }

    const note = {
      title: title.trim(),
      summary: summary.trim(),
      sourceUrl: sourceUrl || '',
      sourceType: sourceType || 'other',
      notes: notes || '',
      accessedAt: accessedAt ? new Date(accessedAt) : null,
    };

    const course = await CoursifyCourse.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $push: { researchNotes: note }, $inc: { syncVersion: 1 } },
      { new: true }
    ).lean();

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const saved = course.researchNotes[course.researchNotes.length - 1];
    return NextResponse.json({
      success: true,
      note: { ...saved, id: saved._id?.toString(), _id: saved._id?.toString() },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
