import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import AttendaSemester from '@/models/AttendaSemester';
import AttendaSubject from '@/models/AttendaSubject';
import AttendaDay from '@/models/AttendaDay';
import AttendaTimetable from '@/models/AttendaTimetable';
import AttendaHoliday from '@/models/AttendaHoliday';
import { requireAdminAuth } from '@/lib/money-auth';
import {
  serializeSemester,
  serializeSubject,
  serializeDay,
  serializeTimetable,
  serializeHoliday,
} from '@/lib/attenda/serializers';

export async function GET(request) {
  const auth = await requireAdminAuth(request);
  if (typeof auth !== 'object') return auth;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const semesterId = searchParams.get('semesterId');

    const semesterQuery = { deletedAt: null };
    const subjectQuery = { deletedAt: null };
    const dayQuery = { deletedAt: null };
    const holidayQuery = { deletedAt: null };

    if (semesterId) {
      subjectQuery.semesterId = semesterId;
      dayQuery.semesterId = semesterId;
      holidayQuery.semesterId = semesterId;
    }

    const [semesters, subjects, days, timetables, holidays] = await Promise.all([
      AttendaSemester.find(semesterQuery).sort({ createdAt: -1 }).lean(),
      AttendaSubject.find(subjectQuery).lean(),
      AttendaDay.find(dayQuery).lean(),
      AttendaTimetable.find(
        semesterId ? { semesterId, deletedAt: null } : { deletedAt: null }
      ).lean(),
      AttendaHoliday.find(holidayQuery).lean(),
    ]);

    return NextResponse.json({
      success: true,
      semesters: semesters.map(serializeSemester),
      subjects: subjects.map(serializeSubject),
      days: days.map(serializeDay),
      timetables: timetables.map(serializeTimetable),
      holidays: holidays.map(serializeHoliday),
    });
  } catch (error) {
    console.error('Failed to fetch attenda bootstrap:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load attendance data' },
      { status: 500 }
    );
  }
}
