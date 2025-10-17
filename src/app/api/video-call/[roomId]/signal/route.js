import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import VideoRoom from '@/models/VideoRoom';

export async function POST(request, { params }) {
  const { roomId } = params;
  const { senderId, receiverId, type, payload } = await request.json();

  if (!senderId || !receiverId || !type || !payload) {
    return NextResponse.json({ error: 'Missing signal data' }, { status: 400 });
  }

  try {
    await dbConnect();

    const room = await VideoRoom.findOne({ roomId });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const newSignal = {
      senderId,
      receiverId,
      type,
      payload,
    };

    room.signals.push(newSignal);
    await room.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error sending signal in room ${roomId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
