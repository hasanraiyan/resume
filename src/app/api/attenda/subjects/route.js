import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AttendaSubject from '@/models/AttendaSubject';
import { requireAdminAuth } from '@/lib/money-auth';
import { serializeSubject } from '@/lib/attenda/serializers';

export async function GET(request) {
  const auth = await requireAdminAuth(request);
  if (typeof auth !== 'object') return auth;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const semesterId = searchParams.get('semesterId');

    const query = { deletedAt: null };
    if (semesterId) query.semesterId = semesterId;

    const subjects = await AttendaSubject.find(query).sort({ name: 1 }).lean();
    return NextResponse.json({
      success: true,
      subjects: subjects.map(serializeSubject),
    });
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subjects' },
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
    const subject = await AttendaSubject.create({
      semesterId: body.semesterId,
      name: body.name || 'Untitled',
      facultyName: body.facultyName || '',
      color: body.color || '#4a86e8',
      credits: body.credits ?? null,
      requiredAttendance: body.requiredAttendance ?? 75,
      isActive: body.isActive ?? true,
    });
    return NextResponse.json({
      success: true,
      subject: serializeSubject(subject.toObject()),
    });
  } catch (error) {
    console.error('Failed to create subject:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create subject' },
      { status: 500 }
    );
  }
}
