import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { getTransactions, createTransaction } from '@/lib/apps/pocketly/service/service';

export async function GET(request) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const account = searchParams.get('account');
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    const transactions = await getTransactions({
      startDate,
      endDate,
      account,
      category,
      type
    });

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    const body = await request.json();
    const serialized = await createTransaction(body);

    return NextResponse.json({ success: true, transaction: serialized });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
