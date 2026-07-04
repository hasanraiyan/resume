import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import AttendaTimetable from '@/models/AttendaTimetable';
import { requireAdminAuth } from '@/lib/money-auth';
import { serializeTimetable } from '@/lib/attenda/serializers';

export async function GET(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const semesterId = searchParams.get('semesterId');

    if (!semesterId || !mongoose.Types.ObjectId.isValid(semesterId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing semesterId' },
        { status: 400 }
      );
    }

    const timetable = await AttendaTimetable.findOne({
      semesterId,
      deletedAt: null,
    }).lean();

    return NextResponse.json({
      success: true,
      timetable: timetable ? serializeTimetable(timetable) : { semesterId, days: [] },
    });
  } catch (error) {
    console.error('Failed to fetch timetable:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch timetable' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const body = await request.json();
    const { semesterId, dayOfWeek, slots } = body;

    if (!semesterId || !mongoose.Types.ObjectId.isValid(semesterId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing semesterId' },
        { status: 400 }
      );
    }

    // Update or create a specific day's slots in the timetable
    const timetable = await AttendaTimetable.findOneAndUpdate(
      { semesterId, deletedAt: null },
      {},
      { upsert: true, new: true }
    );

    // Find and update the specific day entry
    const dayIndex = timetable.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
    const newSlots = (slots || []).map((slot) => ({
      subjectId: slot.subjectId,
      startTime: slot.startTime || '',
      endTime: slot.endTime || '',
    }));

    if (dayIndex >= 0) {
      timetable.days[dayIndex].slots = newSlots;
    } else {
      timetable.days.push({ dayOfWeek, slots: newSlots });
    }

    await timetable.save();

    return NextResponse.json({
      success: true,
      timetable: serializeTimetable(timetable.toObject()),
    });
  } catch (error) {
    console.error('Failed to update timetable:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update timetable' },
      { status: 500 }
    );
  }
}
