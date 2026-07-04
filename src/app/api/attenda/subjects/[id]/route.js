import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import AttendaSubject from '@/models/AttendaSubject';
import { requireAdminAuth } from '@/lib/money-auth';
import { serializeSubject } from '@/lib/attenda/serializers';

export async function PUT(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing subject ID' },
        { status: 400 }
      );
    }

    const subject = await AttendaSubject.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        name: body.name,
        facultyName: body.facultyName,
        color: body.color,
        credits: body.credits,
        requiredAttendance: body.requiredAttendance,
        isActive: body.isActive,
      },
      { new: true }
    ).lean();

    if (!subject) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, subject: serializeSubject(subject) });
  } catch (error) {
    console.error('Failed to update subject:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update subject' },
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
        { success: false, message: 'Invalid or missing subject ID' },
        { status: 400 }
      );
    }

    const subject = await AttendaSubject.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!subject) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete subject:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete subject' },
      { status: 500 }
    );
  }
}
