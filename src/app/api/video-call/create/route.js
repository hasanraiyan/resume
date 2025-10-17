import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import VideoRoom from '@/models/VideoRoom';
import { randomUUID } from 'crypto';

export async function POST() {
  try {
    await dbConnect();

    const roomId = randomUUID();

    const newRoom = new VideoRoom({
      roomId,
      participants: [],
      signals: [],
    });

    await newRoom.save();

    return NextResponse.json({ roomId });
  } catch (error) {
    console.error('Error creating video room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
