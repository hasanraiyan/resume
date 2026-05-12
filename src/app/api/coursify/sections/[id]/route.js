import { requireCoursifyAuth } from '@/lib/coursify-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyCourse from '@/models/CoursifyCourse';
import { dbUpdateSection, dbGetSectionContent, dbDeleteSection } from '@/lib/coursify/db-ops';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';

function isObjectId(str) {
  return mongoose.Types.ObjectId.isValid(str) && String(new mongoose.Types.ObjectId(str)) === str;
}

export async function GET(request, { params }) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid section ID' }, { status: 400 });
    }

    const { section } = await dbGetSectionContent({ id });

    return NextResponse.json({
      success: true,
      section,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid section ID' }, { status: 400 });
    }

    const body = await request.json();

    // Delegate to shared db-ops for unified logic (including Markdown-first sync)
    const { section } = await dbUpdateSection({
      id,
      ...body,
    });

    const course = await CoursifyCourse.findById(section.courseId).select('slug').lean();
    if (course?.slug) {
      revalidatePath(`/coursify/${course.slug}`);
    }

    return NextResponse.json({
      success: true,
      section,
    });
  } catch (error) {
    console.error('[API: Update Section Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    if (!isObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid section ID' }, { status: 400 });
    }

    const { deletedId } = await dbDeleteSection({ id });

    return NextResponse.json({ success: true, deletedId });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
