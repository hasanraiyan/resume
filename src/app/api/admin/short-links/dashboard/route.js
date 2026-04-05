import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import ShortLink from '@/models/ShortLink';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const [totalLinks, activeLinks, totalClicksAggregation, topLinkResult] = await Promise.all([
      ShortLink.countDocuments({}),
      ShortLink.countDocuments({ isActive: true }),
      ShortLink.aggregate([{ $group: { _id: null, totalClicks: { $sum: '$totalClicks' } } }]),
      ShortLink.find({}).sort({ totalClicks: -1 }).limit(1).select('slug title totalClicks').lean(),
    ]);

    const totalClicks = totalClicksAggregation[0]?.totalClicks || 0;
    const topLink = topLinkResult.length > 0 ? topLinkResult[0] : null;

    return NextResponse.json({
      success: true,
      data: {
        totalLinks,
        activeLinks,
        totalClicks,
        topLink,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
