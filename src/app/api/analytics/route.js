import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Analytics from '@/models/Analytics';

export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { eventType, path, sessionId } = body;

    if (!eventType || !path || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const event = new Analytics({
      eventType,
      path,
      sessionId,
    });

    await event.save();

    return NextResponse.json({ message: 'Event saved successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error saving analytics event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}