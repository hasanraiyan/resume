// src/app/api/admin/analytics/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Analytics from '@/lib/models/Analytics';

// Helper function to check if user is admin
async function isAdmin(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return false;
    }

    return session.user.role === 'admin';
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
}

// GET /api/admin/analytics - Get analytics data (admin only)
export async function GET(request) {
  try {
    // Check if user is admin
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || 'overview'; // overview, pageviews, sessions

    // Connect to database
    await dbConnect();
    let data = {};

    // Debug: Check total analytics records
    const totalRecords = await Analytics.countDocuments({});
    console.log('Total analytics records in database:', totalRecords);

    switch (type) {
      case 'pageviews':
        console.log('Fetching pageview stats for:', { startDate, endDate });
        data.pageviews = await Analytics.getPageviewStats(
          startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate ? new Date(endDate) : new Date()
        );
        console.log('Pageview stats result:', data.pageviews);
        break;

      case 'sessions':
        console.log('Fetching session stats for:', { startDate, endDate });
        data.sessions = await Analytics.getSessionStats(
          startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate ? new Date(endDate) : new Date()
        );
        console.log('Session stats result:', data.sessions);
        break;

      case 'search':
        console.log('Fetching search analytics for:', { startDate, endDate });
        // Aggregate search analytics
        const searchMatch = {
          eventName: 'search_performed',
          ...(startDate && endDate && {
            timestamp: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          })
        };

        data.searchAnalytics = await Analytics.aggregate([
          { $match: searchMatch },
          {
            $group: {
              _id: '$properties.searchTerm',
              count: { $sum: 1 },
              avgResults: { $avg: '$properties.resultCount' },
              totalProjects: { $sum: '$properties.projectCount' },
              totalArticles: { $sum: '$properties.articleCount' },
              lastSearched: { $max: '$timestamp' }
            }
          },
          {
            $project: {
              searchTerm: '$_id',
              count: 1,
              avgResults: { $round: ['$avgResults', 1] },
              totalProjects: 1,
              totalArticles: 1,
              lastSearched: 1,
              _id: 0
            }
          },
          { $sort: { count: -1 } },
          { $limit: 50 }
        ]);

        // Get search summary stats
        data.searchSummary = await Analytics.aggregate([
          { $match: searchMatch },
          {
            $group: {
              _id: null,
              totalSearches: { $sum: 1 },
              avgResultsPerSearch: { $avg: '$properties.resultCount' },
              zeroResultSearches: {
                $sum: { $cond: [{ $eq: ['$properties.resultCount', 0] }, 1, 0] }
              }
            }
          },
          {
            $project: {
              totalSearches: 1,
              avgResultsPerSearch: { $round: ['$avgResultsPerSearch', 1] },
              zeroResultSearches: 1,
              _id: 0
            }
          }
        ]);
        break;

      case 'events':
        // Get recent events with pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        console.log('Fetching events for page:', page, 'limit:', limit);
        const skip = (page - 1) * limit;

        data.events = await Analytics.find({})
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

        data.pagination = {
          page,
          limit,
          hasMore: data.events.length === limit
        };
        break;

      case 'overview':
      default:
        // Get overview data
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const now = new Date();

        // Total pageviews in last 30 days
        data.totalPageviews = await Analytics.countDocuments({
          eventType: 'pageview',
          timestamp: { $gte: thirtyDaysAgo, $lte: now }
        });

        // Total unique sessions in last 30 days
        data.totalSessions = await Analytics.distinct('sessionId', {
          timestamp: { $gte: thirtyDaysAgo, $lte: now }
        }).then(sessions => sessions.length);

        // Top pages
        data.topPages = await Analytics.getPageviewStats(thirtyDaysAgo, now);

        // Recent events
        data.recentEvents = await Analytics.find({})
          .sort({ timestamp: -1 })
          .limit(10)
          .lean();

        // Daily pageviews for the last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        data.dailyPageviews = await Analytics.aggregate([
          {
            $match: {
              eventType: 'pageview',
              timestamp: { $gte: sevenDaysAgo, $lte: now }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$timestamp'
                }
              },
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              date: '$_id',
              views: '$count',
              _id: 0
            }
          },
          { $sort: { date: 1 } }
        ]);

        break;
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin analytics API error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/analytics/cleanup - Clean up old analytics data (admin only)
export async function POST(request) {
  try {
    // Check if user is admin
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { olderThanDays = 365 } = body; // Default to 1 year

    await dbConnect();

    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const result = await Analytics.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} old analytics records`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Analytics cleanup error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
