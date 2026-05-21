import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { getAccounts, getTransactions } from '@/lib/apps/pocketly/service/service';
import { escapeTelegramMarkdownV2, sendTelegramDocumentFromSettings } from '@/lib/telegram';
import { generatePocketlyPdf } from '@/utils/pdfGenerator';

const DATE_RANGE_LABELS = {
  'last-7-days': 'Last 7 Days',
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'all-time': 'All Time',
  custom: 'Custom Range',
};

function parseExportDates(payload = {}) {
  const now = new Date();
  const dateRange = payload.dateRange || 'this-month';
  let start;
  let end;

  if (dateRange === 'this-month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (dateRange === 'last-month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (dateRange === 'last-7-days') {
    start = new Date(now);
    start.setDate(now.getDate() - 7);
    end = new Date(now);
  } else if (dateRange === 'all-time') {
    start = new Date(2000, 0, 1);
    end = new Date(2100, 0, 1);
  } else if (dateRange === 'custom') {
    start = payload.fromDate ? new Date(payload.fromDate) : new Date(2000, 0, 1);
    end = payload.toDate ? new Date(payload.toDate) : new Date(2100, 0, 1);
  } else {
    throw new Error('Invalid export date range.');
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid export date.');
  }

  end.setHours(23, 59, 59, 999);
  return { dateRange, start, end };
}

function getExportFilename(dateRange) {
  const today = new Date().toISOString().split('T')[0];
  return `pocketly-export-${dateRange}-${today}.pdf`;
}

export async function POST(request) {
  const session = await requireAdminAuth(request);
  if (session instanceof NextResponse) return session;

  try {
    const payload = await request.json().catch(() => ({}));
    const { dateRange, start, end } = parseExportDates(payload);

    const [transactions, accounts] = await Promise.all([
      getTransactions({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 10000,
      }),
      getAccounts({ includeBalances: true }),
    ]);

    const totalBalance = accounts.reduce(
      (sum, account) => sum + (account.currentBalance ?? account.balance ?? 0),
      0
    );

    const doc = await generatePocketlyPdf({
      start,
      end,
      dateRange,
      transactions,
      totalBalance,
      accountsWithBalance: accounts,
      accounts,
    });

    const filename = getExportFilename(dateRange);
    const document = doc.output('arraybuffer');
    const caption = `*Pocketly PDF Export*\n${escapeTelegramMarkdownV2(
      DATE_RANGE_LABELS[dateRange] || dateRange
    )}\n${escapeTelegramMarkdownV2(`${transactions.length} transactions`)}`;

    const result = await sendTelegramDocumentFromSettings({
      document,
      filename,
      caption,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          message: result.description || 'Failed to send PDF to Telegram',
          skipped: result.skipped || false,
        },
        { status: result.skipped ? 200 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filename,
      transactionCount: transactions.length,
    });
  } catch (error) {
    console.error('[PocketlyExportTelegram] Failed to send export:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send PDF to Telegram' },
      { status: 500 }
    );
  }
}
