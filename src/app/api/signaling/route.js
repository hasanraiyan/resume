// src/app/api/signaling/route.js
import { NextResponse } from 'next/server';

// IMPORTANT: In-memory store is for demonstration only.
// In a production environment, use a more persistent and scalable store like Redis or a dedicated database collection.
const messageStore = new Map();

// POST: A client sends a message for another client in the room
export async function POST(request) {
  try {
    const { meetingId, message } = await request.json();

    if (!meetingId || !message) {
      return NextResponse.json({ error: 'Missing meetingId or message' }, { status: 400 });
    }

    if (!messageStore.has(meetingId)) {
      messageStore.set(meetingId, []);
    }

    messageStore.get(meetingId).push(message);

    // Clean up old rooms periodically (simple cleanup)
    if (messageStore.size > 100) {
      // This is a naive cleanup. A better approach would use TTL on rooms.
      const oldestKey = messageStore.keys().next().value;
      messageStore.delete(oldestKey);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: A client polls for messages from other clients in the room
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get('meetingId');
  const clientId = searchParams.get('clientId'); // To ensure clients don't get their own messages

  if (!meetingId || !clientId) {
    return NextResponse.json({ error: 'Missing meetingId or clientId' }, { status: 400 });
  }

  if (!messageStore.has(meetingId)) {
    return NextResponse.json({ messages: [] });
  }

  // Filter out messages sent by the client itself
  const allMessages = messageStore.get(meetingId);
  const messagesForClient = allMessages.filter((msg) => msg.senderId !== clientId);

  // Remove the messages that have been delivered to this client to prevent re-delivery
  const remainingMessages = allMessages.filter((msg) => msg.senderId === clientId);
  messageStore.set(meetingId, remainingMessages);

  return NextResponse.json({ messages: messagesForClient });
}
