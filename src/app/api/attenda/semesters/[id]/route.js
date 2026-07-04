import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import AttendaSemester from '@/models/AttendaSemester';
import AttendaSubject from '@/models/AttendaSubject';
import AttendaDay from '@/models/AttendaDay';
import AttendaTimetable from '@/models/AttendaTimetable';
import AttendaHoliday from '@/models/AttendaHoliday';
import { requireAdminAuth } from '@/lib/money-auth';
import { serializeSemester } from '@/lib/attenda/serializers';

export async function PUT(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing semester ID' },
        { status: 400 }
      );
    }

    const semester = await AttendaSemester.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
        requiredAttendance: body.requiredAttendance,
        weeklyHolidays: body.weeklyHolidays,
        institutionName: body.institutionName,
        notes: body.notes,
      },
      { new: true }
    ).lean();

    if (!semester) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, semester: serializeSemester(semester) });
  } catch (error) {
    console.error('Failed to update semester:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update semester' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing semester ID' },
        { status: 400 }
      );
    }

    const semester = await AttendaSemester.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!semester) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    // Soft-delete related entities
    await Promise.all([
      AttendaSubject.updateMany({ semesterId: id, deletedAt: null }, { deletedAt: new Date() }),
      AttendaDay.updateMany({ semesterId: id, deletedAt: null }, { deletedAt: new Date() }),
      AttendaTimetable.updateMany({ semesterId: id, deletedAt: null }, { deletedAt: new Date() }),
      AttendaHoliday.updateMany({ semesterId: id, deletedAt: null }, { deletedAt: new Date() }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete semester:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete semester' },
      { status: 500 }
    );
  }
}
