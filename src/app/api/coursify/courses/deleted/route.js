import { requireCoursifyAuth } from '@/lib/coursify-auth';
import { NextResponse } from 'next/server';
import { dbListDeletedCourses, dbCleanupDeletedCourses, dbEmptyTrash } from '@/lib/coursify/db-ops';

export async function GET(request) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    // Auto-cleanup older than 30 days whenever trash is viewed
    await dbCleanupDeletedCourses(30);

    const courses = await dbListDeletedCourses();
    return NextResponse.json({ success: true, courses });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const result = await dbEmptyTrash();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
