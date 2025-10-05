import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Analytics from '@/models/Analytics';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();

  try {
    const totalPageViews = await Analytics.countDocuments({ eventType: 'pageView' });
    const uniqueVisitors = await Analytics.distinct('sessionId').countDocuments();

    const pageViewsByPath = await Analytics.aggregate([
      { $match: { eventType: 'pageView' } },
      { $group: { _id: '$path', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const eventsByType = await Analytics.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return NextResponse.json({
      totalPageViews,
      uniqueVisitors,
      pageViewsByPath,
      eventsByType,
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}