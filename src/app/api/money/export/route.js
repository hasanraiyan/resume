import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { getTransactions } from '@/lib/apps/pocketly/service/service';

export async function GET(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeTransfers = searchParams.get('includeTransfers') === 'true';

    // Get transactions without limit
    const transactions = await getTransactions({
      startDate,
      endDate,
      limit: 10000, // Large enough for most exports
    });

    const filtered = includeTransfers
      ? transactions
      : transactions.filter((t) => t.type !== 'transfer');

    const headers = ['Date', 'Type', 'Category', 'Account', 'Description', 'Note', 'Amount'];
    const rows = filtered.map((t) => [
      new Date(t.date).toLocaleDateString('en-IN'),
      t.type.toUpperCase(),
      t.category?.name || 'Uncategorized',
      t.type === 'transfer'
        ? `${t.account?.name} -> ${t.toAccount?.name}`
        : t.account?.name || 'Unknown',
      t.description || '',
      t.note || '',
      t.amount,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="pocketly-export.csv"',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ success: false, message: 'Export failed' }, { status: 500 });
  }
}
