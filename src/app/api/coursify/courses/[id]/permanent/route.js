import { requireCoursifyAuth } from '@/lib/coursify-auth';
import { NextResponse } from 'next/server';
import { dbPermanentlyDeleteCourse } from '@/lib/coursify/db-ops';
import { revalidatePath } from 'next/cache';

export async function DELETE(request, { params }) {
  const auth = await requireCoursifyAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    await dbPermanentlyDeleteCourse({ id });

    revalidatePath('/coursify');
    revalidatePath('/apps/coursify');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
