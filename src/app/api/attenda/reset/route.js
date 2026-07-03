import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AttendaDay from '@/models/AttendaDay';
import { requireAdminAuth } from '@/lib/money-auth';

export async function POST(request) {
  const auth = await requireAdminAuth(request);
  if (typeof auth !== 'object') return auth;

  try {
    await dbConnect();
    const { semesterId } = await request.json();

    if (!semesterId) {
      return NextResponse.json(
        { success: false, message: 'semesterId is required' },
        { status: 400 }
      );
    }

    // Soft-delete all day records for this semester
    const result = await AttendaDay.updateMany(
      { semesterId, deletedAt: null },
      { deletedAt: new Date() }
    );

    return NextResponse.json({
      success: true,
      deletedCount: result.modifiedCount,
      message: `Reset ${result.modifiedCount} day(s) of attendance.`,
    });
  } catch (error) {
    console.error('Failed to reset attendance:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset attendance' },
      { status: 500 }
    );
  }
}
