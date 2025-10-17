// src/app/meet/[meetingId]/page.js
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import MeetPageClient from '@/components/meet/MeetPageClient'; // We will create this
import Meeting from '@/models/Meeting';
import dbConnect from '@/lib/dbConnect';

export default async function MeetPage({ params }) {
  const { meetingId } = params;

  // Server-side validation of the meetingId
  await dbConnect();
  const meeting = await Meeting.findOne({ meetingId });

  if (!meeting) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const user = {
    name: session?.user?.name || `Guest-${Math.random().toString(36).substring(2, 6)}`,
    isAdmin: session?.user?.role === 'admin',
  };

  return <MeetPageClient meetingId={meetingId} user={user} />;
}
