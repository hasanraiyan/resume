import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { dbReorderSections } from '@/lib/coursify/db-ops';

export async function POST(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id: courseId } = await params;
    const body = await request.json();
    const { sectionIds, moduleId } = body;

    if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'sectionIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const result = await dbReorderSections({
      courseId,
      sectionIds,
      moduleId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
