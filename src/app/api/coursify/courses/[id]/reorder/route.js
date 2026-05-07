import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifySection from '@/models/CoursifySection';

export async function POST(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;
    const { sectionIds } = await request.json();

    if (!Array.isArray(sectionIds)) {
      return NextResponse.json(
        { success: false, error: 'sectionIds must be an array' },
        { status: 400 }
      );
    }

    await Promise.all(
      sectionIds.map((sectionId, index) =>
        CoursifySection.updateOne(
          { _id: sectionId, courseId: id, deletedAt: null },
          { $set: { order: index } }
        )
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
