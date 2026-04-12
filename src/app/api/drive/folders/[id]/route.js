import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import connectDB from '@/lib/db';
import DriveFolder from '@/models/DriveFolder';

export async function DELETE(request, { params }) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await connectDB();
  try {
    await DriveFolder.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
