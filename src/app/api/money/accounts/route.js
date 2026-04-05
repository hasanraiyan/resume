import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';
import { serializeAccount } from '@/lib/money-serializers';
import { requireAdminAuth } from '@/lib/money-auth';
import { computeAccountSummaries } from '@/lib/money-account-summary';

export async function GET() {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const [accounts, transactions] = await Promise.all([
      Account.find({ deletedAt: null }).sort({ createdAt: 1 }).lean(),
      Transaction.find({ deletedAt: null }).select('type amount account toAccount').lean(),
    ]);

    const accountSummary = computeAccountSummaries(accounts, transactions);
    return NextResponse.json({
      success: true,
      accounts: accountSummary.accounts.map(serializeAccount),
      totalAccountBalance: accountSummary.totalAccountBalance,
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
    await dbConnect();
    const body = await request.json();
    const account = new Account(body);
    await account.save();
    const obj = account.toObject();
    return NextResponse.json({
      success: true,
      account: serializeAccount(obj),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create account' },
      { status: 500 }
    );
  }
}
