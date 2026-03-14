import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import ShortLink from '@/models/ShortLink';
import LinkClick from '@/models/LinkClick';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug'); // Optional: filter by specific link
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Build match criteria for the click aggregation
    const matchCriteria = {
      timestamp: { $gte: startDate, $lte: endDate },
    };
    if (slug) {
      matchCriteria.slug = slug.toLowerCase();
    }

    // Parallel fetching of analytics
    const [
      totalClicksResult,
      uniqueVisitorsResult,
      clicksOverTime,
      topReferrers,
      topSources,
      topCampaigns,
      devices,
      countries,
    ] = await Promise.all([
      // Total Clicks
      LinkClick.countDocuments(matchCriteria),

      // Unique Visitors (distinct IP Hashes)
      LinkClick.distinct('ipHash', matchCriteria).then((hashes) => hashes.length),

      // Clicks Over Time (grouped by day)
      LinkClick.aggregate([
        { $match: matchCriteria },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        {
          $project: {
            _id: 0,
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: {
                  $dateFromParts: {
                    year: '$_id.year',
                    month: '$_id.month',
                    day: '$_id.day',
                  },
                },
              },
            },
            clicks: '$count',
          },
        },
      ]),

      // Top Referrers
      LinkClick.aggregate([
        { $match: matchCriteria },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, referrer: '$_id', count: 1 } },
      ]),

      // Top Sources (custom src parameters)
      LinkClick.aggregate([
        {
          $match: {
            ...matchCriteria,
            source: { $ne: '', $exists: true }, // Only include hits with a source
          },
        },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, source: '$_id', count: 1 } },
      ]),

      // Top Campaigns (UTM parameters)
      LinkClick.aggregate([
        {
          $match: {
            ...matchCriteria,
            utm_campaign: { $ne: '', $exists: true },
          },
        },
        { $group: { _id: '$utm_campaign', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, campaign: '$_id', count: 1 } },
      ]),

      // Devices Breakdown
      LinkClick.aggregate([
        { $match: matchCriteria },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, device: '$_id', count: 1 } },
      ]),

      // Countries Breakdown
      LinkClick.aggregate([
        { $match: matchCriteria },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, country: '$_id', count: 1 } },
      ]),
    ]);

    // If filtering by a specific slug, fetch its basic info too
    let linkDetails = null;
    if (slug) {
      linkDetails = await ShortLink.findOne({ slug: slug.toLowerCase() }).lean();
    } else {
      // If overview, also calculate total links created in this period
      linkDetails = {
        totalLinksCreated: await ShortLink.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
        }),
      };
    }

    // Format final response
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalClicks: totalClicksResult,
          uniqueVisitors: uniqueVisitorsResult,
        },
        linkDetails,
        clicksOverTime,
        topReferrers,
        topSources,
        topCampaigns,
        devices,
        countries,
      },
    });
  } catch (error) {
    console.error('Short link analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
