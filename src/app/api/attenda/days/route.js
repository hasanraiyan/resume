import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import AttendaDay from '@/models/AttendaDay';
import { requireAdminAuth } from '@/lib/money-auth';
import { serializeDay } from '@/lib/attenda/serializers';

export async function GET(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const semesterId = searchParams.get('semesterId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (semesterId && !mongoose.Types.ObjectId.isValid(semesterId)) {
      return NextResponse.json({
        success: true,
        days: [],
      });
    }

    const query = { deletedAt: null };
    if (semesterId) query.semesterId = semesterId;
    if (date) query.date = date;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const days = await AttendaDay.find(query).sort({ date: -1 }).lean();
    return NextResponse.json({
      success: true,
      days: days.map(serializeDay),
    });
  } catch (error) {
    console.error('Failed to fetch days:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch attendance data' },
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

    if (!body.semesterId || !mongoose.Types.ObjectId.isValid(body.semesterId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing semesterId' },
        { status: 400 }
      );
    }

    // Upsert: find by date + semesterId, or create
    const day = await AttendaDay.findOneAndUpdate(
      { date: body.date, semesterId: body.semesterId, deletedAt: null },
      {
        collegeStatus: body.collegeStatus || 'present',
        lectures: (body.lectures || []).map((lec) => ({
          subjectId: lec.subjectId,
          status: lec.status || 'present',
          isExtra: lec.isExtra || false,
          startTime: lec.startTime || '',
          endTime: lec.endTime || '',
        })),
        notes: body.notes || '',
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      day: serializeDay(day),
    });
  } catch (error) {
    console.error('Failed to save attendance:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save attendance' },
      { status: 500 }
    );
  }
}
