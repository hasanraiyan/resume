import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import VideoRoom from '@/models/VideoRoom';

export async function POST(request, { params }) {
  const { roomId } = params;
  const { participantId } = await request.json();

  if (!participantId) {
    return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const room = await VideoRoom.findOne({ roomId });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const otherParticipants = room.participants.filter((p) => p !== participantId);

    if (!room.participants.includes(participantId)) {
      room.participants.push(participantId);
      await room.save();
    }

    return NextResponse.json({ otherParticipants });
  } catch (error) {
    console.error(`Error joining room ${roomId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
