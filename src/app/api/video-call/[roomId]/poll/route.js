import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import VideoRoom from '@/models/VideoRoom';

export async function GET(request, { params }) {
  const { roomId } = params;
  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get('participantId');
  const since = searchParams.get('since');

  if (!participantId) {
    return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const room = await VideoRoom.findOne({ roomId });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    let signals = [];
    if (since) {
      signals = room.signals.filter(
        (signal) =>
          signal.receiverId === participantId && new Date(signal.createdAt) > new Date(since)
      );
    } else {
      signals = room.signals.filter((signal) => signal.receiverId === participantId);
    }

    return NextResponse.json({ signals });
  } catch (error) {
    console.error(`Error polling signals in room ${roomId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
