import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { getTransactions } from '@/lib/apps/pocketly/service/service';

export async function GET(request) {
  const session = await requireAdminAuth(request);
  if (session instanceof NextResponse) return session;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const transactions = await getTransactions({ startDate, endDate, limit: 1000 });

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryTotals = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const name = t.category?.name || 'Uncategorized';
        categoryTotals[name] = (categoryTotals[name] || 0) + t.amount;
      });

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));

    // Here we'll simulate the AI summary for the purpose of the report tool
    // In a real scenario, this endpoint could call an LLM.
    const summaryText = `In this period, you had an income of ${income} and expenses totaling ${expense}. Your top spending categories were ${topCategories.map((c) => c.name).join(', ')}.`;

    return NextResponse.json({
      success: true,
      summary: summaryText,
      stats: { income, expense, net: income - expense },
      topCategories,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
