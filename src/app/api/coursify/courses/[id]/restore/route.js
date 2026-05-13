import { requireCoursifyAuth } from '@/lib/coursify-auth';
import { NextResponse } from 'next/server';
import { dbRestoreCourse } from '@/lib/coursify/db-ops';
import { revalidatePath } from 'next/cache';

export async function POST(request, { params }) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { course } = await dbRestoreCourse({ id });

    revalidatePath('/coursify');
    if (course.slug) {
      revalidatePath(`/coursify/${course.slug}`);
    }
    revalidatePath('/apps/coursify');

    return NextResponse.json({ success: true, course });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
