import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyUnit from '@/models/CoursifyUnit';

export async function POST(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;
    const { unitIds } = await request.json();
    const ids = unitIds;

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { success: false, error: 'unitIds must be an array' },
        { status: 400 }
      );
    }

    await Promise.all(
      ids.map((unitId, index) =>
        CoursifyUnit.updateOne(
          { _id: unitId, courseId: id, deletedAt: null },
          { $set: { order: index } }
        )
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
