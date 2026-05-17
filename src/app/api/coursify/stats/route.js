import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import dbConnect from '@/lib/dbConnect';

export async function GET(request) {
  const authCheck = await requireAdminAuth(request);
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    await dbConnect();
    const CoursifyResearch = (await import('@/models/CoursifyResearch')).default;

    // Total research count
    const totalCount = await CoursifyResearch.countDocuments({ deletedAt: null });

    // Records with promptHash (can be cached)
    const withHashCount = await CoursifyResearch.countDocuments({
      deletedAt: null,
      promptHash: { $exists: true },
    });

    // Calculate coverage %
    const hashCoverage = totalCount > 0 ? Math.round((withHashCount / totalCount) * 100) : 0;

    // Get aggregated stats by topic
    const topicStats = await CoursifyResearch.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: '$topic',
          count: { $sum: 1 },
          withHash: {
            $sum: { $cond: [{ $ne: ['$promptHash', null] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Calculate potential cache hit rate (if same topic requested again)
    const duplicateTopics = await CoursifyResearch.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: '$topic',
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      {
        $group: {
          _id: null,
          duplicateRecords: { $sum: '$count' },
          duplicateTopics: { $sum: 1 },
        },
      },
    ]);

    const duplicateStats = duplicateTopics[0] || { duplicateRecords: 0, duplicateTopics: 0 };

    // Potential savings (if duplicates used cache instead of regenerating)
    const potentialSavingsPercent =
      totalCount > 0
        ? Math.round(
            ((duplicateStats.duplicateRecords - duplicateStats.duplicateTopics) / totalCount) * 100
          )
        : 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalResearch: totalCount,
        withPromptHash: withHashCount,
        hashCoverage: `${hashCoverage}%`,
        potentialCacheSavings: `${potentialSavingsPercent}%`,
        duplicateTopics: duplicateStats.duplicateTopics,
      },
      topicStats: topicStats.map((stat) => ({
        topic: stat._id,
        totalGenerations: stat.count,
        cachedVersions: stat.withHash,
        duplicates: stat.count - 1,
      })),
    });
  } catch (error) {
    console.error('[CoursifyStats] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
