// src/app/api/meet/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Meeting from '@/models/Meeting';

// Helper to generate a random meeting ID (e.g., abc-def-ghi)
function generateMeetingId() {
  const segment = () => Math.random().toString(36).substring(2, 5);
  return `${segment()}-${segment()}-${segment()}`;
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  // Secure the endpoint to admin-only
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const meetingId = generateMeetingId();

    const newMeeting = new Meeting({
      meetingId,
      // You can associate the admin user ID if needed
      // createdBy: session.user.id
    });

    await newMeeting.save();

    return NextResponse.json({ success: true, meetingId });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
