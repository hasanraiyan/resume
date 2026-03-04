import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Presentation from '@/models/Presentation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const presentations = await Presentation.find({ authorId: { $ne: null } })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, presentations });

  } catch (error) {
    console.error('Fetch Presentations Error:', error);
    return NextResponse.json({ error: 'Failed to fetch presentations' }, { status: 500 });
  }
}
