import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AttendaHoliday from '@/models/AttendaHoliday';
import { requireAdminAuth } from '@/lib/money-auth';
import { serializeHoliday } from '@/lib/attenda/serializers';

export async function GET(request) {
  const auth = await requireAdminAuth(request);
  if (typeof auth !== 'object') return auth;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const semesterId = searchParams.get('semesterId');

    const query = { deletedAt: null };
    if (semesterId) query.semesterId = semesterId;

    const holidays = await AttendaHoliday.find(query).sort({ date: 1 }).lean();
    return NextResponse.json({
      success: true,
      holidays: holidays.map(serializeHoliday),
    });
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await requireAdminAuth(request);
  if (typeof auth !== 'object') return auth;

  try {
    await dbConnect();
    const body = await request.json();
    const holiday = await AttendaHoliday.create({
      semesterId: body.semesterId,
      date: body.date,
      name: body.name || 'Holiday',
      type: body.type || 'manual',
    });
    return NextResponse.json({
      success: true,
      holiday: serializeHoliday(holiday.toObject()),
    });
  } catch (error) {
    console.error('Failed to create holiday:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create holiday' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const auth = await requireAdminAuth(request);
  if (typeof auth !== 'object') return auth;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'id is required' }, { status: 400 });
    }

    const holiday = await AttendaHoliday.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!holiday) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete holiday:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete holiday' },
      { status: 500 }
    );
  }
}
