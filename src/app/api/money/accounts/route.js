import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { getAccounts, createAccount } from '@/lib/apps/pocketly/service/service';

export async function GET() {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    const accounts = await getAccounts({ includeBalances: true });

    // totalAccountBalance calculation like original code did
    const totalAccountBalance = accounts.reduce(
      (sum, acc) => (!acc.ignored ? sum + (acc.balance || 0) : sum),
      0
    );

    return NextResponse.json({
      success: true,
      accounts: accounts,
      totalAccountBalance: totalAccountBalance,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    const body = await request.json();
    const account = await createAccount(body);
    return NextResponse.json({
      success: true,
      account: account,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create account' },
      { status: 500 }
    );
  }
}
