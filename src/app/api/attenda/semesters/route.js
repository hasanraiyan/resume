import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AttendaSemester from '@/models/AttendaSemester';
import AttendaTimetable from '@/models/AttendaTimetable';
import { requireAdminAuth } from '@/lib/money-auth';
import { serializeSemester } from '@/lib/attenda/serializers';

export async function GET(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const semesters = await AttendaSemester.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      success: true,
      semesters: semesters.map(serializeSemester),
    });
  } catch (error) {
    console.error('Failed to fetch semesters:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch semesters' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const body = await request.json();
    const semester = await AttendaSemester.create({
      name: body.name || 'Untitled Semester',
      startDate: body.startDate || '',
      endDate: body.endDate || '',
      requiredAttendance: body.requiredAttendance ?? 75,
      weeklyHolidays: body.weeklyHolidays || [0],
      institutionName: body.institutionName || '',
      notes: body.notes || '',
    });

    // Create empty timetable for the semester
    await AttendaTimetable.create({
      semesterId: semester._id,
      days: [],
    });

    return NextResponse.json({
      success: true,
      semester: serializeSemester(semester.toObject()),
    });
  } catch (error) {
    console.error('Failed to create semester:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create semester' },
      { status: 500 }
    );
  }
}
