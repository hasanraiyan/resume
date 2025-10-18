/**
 * @fileoverview Admin Analytics API route for managing and retrieving analytics data.
 * This module provides comprehensive analytics functionality for administrators,
 * including pageview stats, session data, search analytics, user flow visualization,
 * and data cleanup capabilities.
 *
 * @description This API endpoint offers:
 * - Overview analytics with pageviews, sessions, and top pages
 * - Detailed pageview and session statistics with date filtering
 * - Search analytics including popular terms and performance metrics
 * - User flow visualization data for understanding navigation patterns
 * - Event logging and recent activity tracking
 * - Chatbot interaction analytics and tool usage statistics
 * - Proactive engagement analytics for user interaction tracking
 * - Data cleanup functionality for removing old records
 *
 * All endpoints require admin authentication and provide JSON responses
 * with detailed analytics data for dashboard visualization.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Analytics from '@/models/Analytics';

/**
 * Verifies if the current user has admin privileges.
 * Checks the user's session for authentication and admin role.
 *
 * @async
 * @function isAdmin
 * @param {Request} request - The Next.js request object containing session information
 * @returns {Promise<boolean>} True if the user is authenticated and has admin role, false otherwise
 * @throws {Error} Logs error to console but returns false for any authentication failures
 */
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

/**
 * Handles GET requests for analytics data with admin authentication.
 * Provides comprehensive analytics information based on query parameters.
 *
 * @async
 * @function GET
 * @param {Request} request - Next.js request object
 * @param {URL} request.url - Request URL for extracting query parameters
 * @returns {Promise<NextResponse>} JSON response with analytics data or error message
 *
 * @description Supports multiple analytics data types:
 * - overview: General stats including pageviews, sessions, top pages, and chatbot analytics
 * - pageviews: Detailed pageview statistics with date filtering
 * - sessions: Session-based analytics and user behavior data
 * - search: Search term analytics and performance metrics
 * - user_flow: User journey visualization data for Sankey diagrams
 * - events: Recent analytics events with pagination support
 *
 * @example
 * // Get overview analytics
 * GET /api/admin/analytics?type=overview
 *
 * @example
 * // Get pageviews for specific date range
 * GET /api/admin/analytics?type=pageviews&startDate=2024-01-01&endDate=2024-01-31
 *
 * @example
 * // Get paginated events
 * GET /api/admin/analytics?type=events&page=2&limit=25
 */
export async function GET(request) {
  try {
    // Check if user is admin
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
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
        console.log('Session stats result:', data.sessions?.length || 0, 'sessions found');
        break;

      case 'search':
        console.log('Fetching search analytics for:', { startDate, endDate });
        // Aggregate search analytics
        const searchMatch = {
          eventName: 'search_performed',
          ...(startDate &&
            endDate && {
              timestamp: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            }),
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
              lastSearched: { $max: '$timestamp' },
            },
          },
          {
            $project: {
              searchTerm: '$_id',
              count: 1,
              avgResults: { $round: ['$avgResults', 1] },
              totalProjects: 1,
              totalArticles: 1,
              lastSearched: 1,
              _id: 0,
            },
          },
          { $sort: { count: -1 } },
          { $limit: 50 },
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
                $sum: { $cond: [{ $eq: ['$properties.resultCount', 0] }, 1, 0] },
              },
            },
          },
          {
            $project: {
              totalSearches: 1,
              avgResultsPerSearch: { $round: ['$avgResultsPerSearch', 1] },
              zeroResultSearches: 1,
              _id: 0,
            },
          },
        ]);
        break;

      case 'user_flow':
        console.log('Fetching user flow data for:', { startDate, endDate });
        data.userFlow = await getUserFlowData(
          startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default to 7 days
          endDate ? new Date(endDate) : new Date()
        );
        console.log('User flow data generated:', data.userFlow);
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
          hasMore: data.events.length === limit,
        };
        break;

      case 'overview':
      default:
        // Get overview data
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const now = new Date();

        // --- Updated Pageviews and Sessions Aggregation ---
        const [visitorPageviews, adminPageviews, visitorSessions, adminSessions] =
          await Promise.all([
            Analytics.countDocuments({
              eventType: 'pageview',
              timestamp: { $gte: thirtyDaysAgo, $lte: now },
              userRole: 'visitor',
            }),
            Analytics.countDocuments({
              eventType: 'pageview',
              timestamp: { $gte: thirtyDaysAgo, $lte: now },
              userRole: 'admin',
            }),
            Analytics.distinct('sessionId', {
              timestamp: { $gte: thirtyDaysAgo, $lte: now },
              userRole: 'visitor',
            }),
            Analytics.distinct('sessionId', {
              timestamp: { $gte: thirtyDaysAgo, $lte: now },
              userRole: 'admin',
            }),
          ]);

        data.totalPageviews = {
          total: visitorPageviews + adminPageviews,
          visitor: visitorPageviews,
          admin: adminPageviews,
        };

        data.totalSessions = {
          total: visitorSessions.length + adminSessions.length,
          visitor: visitorSessions.length,
          admin: adminSessions.length,
        };

        // Top pages
        data.topPages = await Analytics.getPageviewStats(thirtyDaysAgo, now);

        // Recent events
        data.recentEvents = await Analytics.find({}).sort({ timestamp: -1 }).limit(10).lean();

        // Daily pageviews for the last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        data.dailyPageviews = await Analytics.aggregate([
          {
            $match: {
              eventType: 'pageview',
              timestamp: { $gte: sevenDaysAgo, $lte: now },
            },
          },
          {
            $group: {
              _id: {
                date: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$timestamp',
                  },
                },
                userRole: '$userRole',
              },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              date: '$_id.date',
              userRole: '$_id.userRole',
              views: '$count',
              _id: 0,
            },
          },
          { $sort: { date: 1, userRole: 1 } },
        ]);

        // Chatbot analytics aggregation
        const chatbotStatsPromise = Analytics.aggregate([
          {
            $match: {
              eventType: 'chatbot_interaction',
              userRole: 'visitor', // Only count visitor interactions for chatbot stats
              timestamp: { $gte: thirtyDaysAgo, $lte: now },
            },
          },
          {
            $facet: {
              totalInteractions: [{ $count: 'count' }],
              topQuestions: [
                { $group: { _id: '$properties.userQuestion', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                { $project: { question: '$_id', count: 1, _id: 0 } },
              ],
              ctaPerformance: [
                {
                  $group: {
                    _id: null,
                    total: { $sum: 1 },
                    ctaCount: { $sum: { $cond: ['$properties.isCallToAction', 1, 0] } },
                  },
                },
              ],
              toolUsage: [
                {
                  $match: {
                    'properties.toolsCount': { $gt: 0 },
                  },
                },
                {
                  $unwind: '$properties.toolsUsed',
                },
                {
                  $group: {
                    _id: '$properties.toolsUsed.name',
                    count: { $sum: 1 },
                    successRate: {
                      $avg: {
                        $cond: [
                          {
                            $eq: [{ $ifNull: ['$properties.toolResults.hasError', false] }, false],
                          },
                          1,
                          0,
                        ],
                      },
                    },
                  },
                },
                {
                  $project: {
                    toolName: '$_id',
                    count: 1,
                    successRate: { $multiply: ['$successRate', 100] },
                    _id: 0,
                  },
                },
                { $sort: { count: -1 } },
              ],
              interactionsWithTools: [
                {
                  $match: {
                    'properties.toolsCount': { $gt: 0 },
                  },
                },
                { $count: 'count' },
              ],
            },
          },
        ]);

        // Proactive engagement analytics
        const proactiveStatsPromise = Analytics.aggregate([
          {
            $match: {
              eventName: { $in: ['proactive_message_sent', 'user_responded_to_proactive'] },
              timestamp: { $gte: thirtyDaysAgo, $lte: now },
            },
          },
          {
            $facet: {
              totalProactiveMessages: [
                { $match: { eventName: 'proactive_message_sent' } },
                { $count: 'count' },
              ],
              totalResponses: [
                { $match: { eventName: 'user_responded_to_proactive' } },
                { $count: 'count' },
              ],
              topTriggers: [
                { $match: { eventName: 'proactive_message_sent' } },
                { $group: { _id: '$properties.trigger_name', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                { $project: { triggerName: '$_id', count: 1, _id: 0 } },
              ],
            },
          },
        ]);

        // Wait for all promises including chatbot stats
        const [chatbotResults, proactiveResults] = await Promise.all([
          chatbotStatsPromise,
          proactiveStatsPromise,
        ]);

        // Structure chatbot analytics data
        data.chatbotAnalytics = {
          totalInteractions: chatbotResults[0]?.totalInteractions[0]?.count || 0,
          topQuestions: chatbotResults[0]?.topQuestions || [],
          ctaPerformance: chatbotResults[0]?.ctaPerformance[0] || { total: 0, ctaCount: 0 },
          toolUsage: chatbotResults[0]?.toolUsage || [],
          interactionsWithTools: chatbotResults[0]?.interactionsWithTools[0]?.count || 0,
        };

        break;
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin analytics API error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generalizes a URL path to group dynamic segments for analytics aggregation.
 * Converts specific dynamic paths (like /projects/123) into generic patterns
 * (like /projects/[slug]) to enable meaningful user flow analysis.
 *
 * @function generalizePath
 * @param {string} path - The specific URL path to generalize
 * @returns {string} The generalized path with dynamic segments replaced by placeholders
 *
 * @example
 * // Returns: '/projects/[slug]'
 * generalizePath('/projects/my-awesome-project');
 *
 * @example
 * // Returns: '/projects' (unchanged - main listing page)
 * generalizePath('/projects');
 *
 * @example
 * // Returns: '/admin/projects/[id]/edit'
 * generalizePath('/admin/projects/123/edit');
 */
function generalizePath(path) {
  if (path.startsWith('/admin/projects/') && path.endsWith('/edit')) {
    return '/admin/projects/[id]/edit';
  }
  if (path.startsWith('/admin/articles/') && path.endsWith('/edit')) {
    return '/admin/articles/[id]/edit';
  }
  if (path.startsWith('/projects/')) {
    // Avoid generalizing the main /projects page itself
    return path === '/projects' ? path : '/projects/[slug]';
  }
  if (path.startsWith('/blog/')) {
    return path === '/blog' ? path : '/blog/[slug]';
  }
  // Add more rules as your app grows
  return path;
}

/**
 * Aggregates analytics events to generate user flow data for visualization.
 * Processes pageview events to create Sankey diagram data showing user navigation patterns.
 * Groups similar paths and calculates transition frequencies between pages.
 *
 * @async
 * @function getUserFlowData
 * @param {Date} startDate - The start date for the analysis period
 * @param {Date} endDate - The end date for the analysis period
 * @returns {Promise<{nodes: Array<string>, links: Array<{from: string, to: string, flow: number}>, topJourneys: Array<{path: string, count: number}>}>}
 * Object containing:
 * - nodes: Array of unique page paths (both specific and generalized)
 * - links: Array of transitions between pages with flow counts
 * - topJourneys: Array of most common user journey patterns
 *
 * @description This function performs several steps:
 * 1. Aggregates ordered page paths for each user session
 * 2. Generalizes dynamic paths (e.g., /projects/abc → /projects/[slug])
 * 3. Calculates transition frequencies between pages
 * 4. Prunes insignificant flows to keep only top transitions
 * 5. Identifies top user journey patterns
 *
 * @example
 * const flowData = await getUserFlowData(
 *   new Date('2024-01-01'),
 *   new Date('2024-01-31')
 * );
 * // Returns: { nodes: ['/', '/projects', '/projects/[slug]'], links: [...], topJourneys: [...] }
 */
async function getUserFlowData(startDate, endDate) {
  // Step 1: Aggregate ordered paths for each session
  const userJourneys = await Analytics.aggregate([
    {
      $match: {
        eventType: 'pageview',
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $sort: { sessionId: 1, timestamp: 1 }, // Crucial for correct path ordering
    },
    {
      $group: {
        _id: '$sessionId',
        path: { $push: '$path' },
      },
    },
  ]);

  // Step 2: Process journeys into path transitions WITH GENERALIZATION
  const transitions = new Map();
  userJourneys.forEach((session) => {
    // Apply generalization to the entire path array first
    const generalizedPath = session.path.map(generalizePath);

    if (generalizedPath.length > 0) {
      const startKey = `(start)|${generalizedPath[0]}`;
      transitions.set(startKey, (transitions.get(startKey) || 0) + 1);
    }

    for (let i = 0; i < generalizedPath.length - 1; i++) {
      const from = generalizedPath[i];
      const to = generalizedPath[i + 1];
      if (from === to) continue;

      const key = `${from}|${to}`;
      transitions.set(key, (transitions.get(key) || 0) + 1);
    }

    if (generalizedPath.length > 0) {
      const lastPath = generalizedPath[generalizedPath.length - 1];
      const endKey = `${lastPath}|(end)`;
      transitions.set(endKey, (transitions.get(endKey) || 0) + 1);
    }
  });

  // Step 3: Format data for the Sankey diagram (no changes here)
  // ...

  // Step 4: Intelligent Pruning - Keep only the most significant flows
  const allLinks = Array.from(transitions, ([key, count]) => {
    const [from, to] = key.split('|');
    return { from, to, flow: count };
  });

  // Sort by flow count and take the top N (e.g., 30)
  const MAX_LINKS = 30;
  const significantLinks = allLinks.sort((a, b) => b.flow - a.flow).slice(0, MAX_LINKS);

  // Re-build nodes from only the significant links to remove orphans
  const finalNodes = new Set();
  significantLinks.forEach((link) => {
    finalNodes.add(link.from);
    finalNodes.add(link.to);
  });

  // NEW: Calculate Top Journeys
  const journeyCounts = new Map();
  userJourneys.forEach((session) => {
    // Limit journey length for readability (e.g., first 5 steps)
    const journey = session.path.map(generalizePath).slice(0, 5).join(' → ');
    journeyCounts.set(journey, (journeyCounts.get(journey) || 0) + 1);
  });

  const topJourneys = Array.from(journeyCounts, ([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Get top 10

  return {
    nodes: Array.from(finalNodes),
    links: significantLinks,
    topJourneys: topJourneys, // <-- Add this
  };
}

// POST /api/admin/analytics/cleanup - Clean up old analytics data (admin only)

/**
 * Handles POST requests for cleaning up old analytics data.
 * Removes analytics records older than the specified number of days.
 * Requires admin authentication for security.
 *
 * @async
 * @function POST
 * @param {Request} request - Next.js request object
 * @returns {Promise<NextResponse>} JSON response with cleanup results or error message
 *
 * @description This endpoint allows administrators to:
 * - Remove old analytics data to manage database size
 * - Specify custom retention period in days
 * - Get detailed feedback on cleanup operation results
 * - Maintain database performance by removing historical data
 *
 * @example
 * // Clean up data older than 1 year (default)
 * POST /api/admin/analytics/cleanup
 * Body: {}
 *
 * @example
 * // Clean up data older than 6 months
 * POST /api/admin/analytics/cleanup
 * Body: { "olderThanDays": 180 }
 *
 * @example
 * // Clean up data older than 2 years
 * POST /api/admin/analytics/cleanup
 * Body: { "olderThanDays": 730 }
 */
export async function POST(request) {
  try {
    // Check if user is admin
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await request.json();
    const { olderThanDays = 365 } = body; // Default to 1 year

    await dbConnect();

    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const result = await Analytics.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} old analytics records`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Analytics cleanup error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
