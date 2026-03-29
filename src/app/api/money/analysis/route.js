import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Transaction from '@/models/Transaction';
import Account from '@/models/Account';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query = { deletedAt: null };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      { $match: { ...query, type: { $in: ['income', 'expense'] } } },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id.category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryId: '$_id.category',
          type: '$_id.type',
          total: 1,
          count: 1,
          name: { $ifNull: ['$category.name', 'Uncategorized'] },
          icon: { $ifNull: ['$category.icon', 'dollar-sign'] },
          color: { $ifNull: ['$category.color', '#000000'] },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Daily flow
    const dailyFlow = await Transaction.aggregate([
      { $match: { ...query, type: { $in: ['income', 'expense'] } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Account analysis
    const accountAnalysis = await Transaction.aggregate([
      { $match: { ...query, type: { $in: ['income', 'expense'] } } },
      {
        $group: {
          _id: { account: '$account', type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'accounts',
          localField: '_id.account',
          foreignField: '_id',
          as: 'account',
        },
      },
      { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          accountId: '$_id.account',
          type: '$_id.type',
          total: 1,
          name: { $ifNull: ['$account.name', 'Unknown'] },
          icon: { $ifNull: ['$account.icon', 'wallet'] },
        },
      },
    ]);

    // Totals
    const totals = await Transaction.aggregate([
      { $match: { ...query, type: { $in: ['income', 'expense'] } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    const totalExpense = totals.find((t) => t._id === 'expense')?.total || 0;
    const totalIncome = totals.find((t) => t._id === 'income')?.total || 0;

    return NextResponse.json({
      success: true,
      analysis: {
        categoryBreakdown: categoryBreakdown.map((c) => ({
          ...c,
          categoryId: c.categoryId?.toString(),
        })),
        dailyFlow: dailyFlow.map((d) => ({
          date: d._id.date,
          type: d._id.type,
          total: d.total,
        })),
        accountAnalysis: accountAnalysis.map((a) => ({
          ...a,
          accountId: a.accountId?.toString(),
        })),
        totalExpense,
        totalIncome,
        netBalance: totalIncome - totalExpense,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
