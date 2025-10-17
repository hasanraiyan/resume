// src/app/api/meet/[meetingId]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Meeting from '@/models/Meeting';

export async function GET(request, { params }) {
  const { meetingId } = params;

  if (!meetingId) {
    return NextResponse.json({ success: false, error: 'Meeting ID is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const meeting = await Meeting.findOne({ meetingId });

    if (!meeting) {
      return NextResponse.json({ success: false, error: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error validating meeting:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
