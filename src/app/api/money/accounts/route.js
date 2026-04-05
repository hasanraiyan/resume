import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import { serializeAccount } from '@/lib/money-serializers';
import { requireAdminAuth } from '@/lib/money-auth';

export async function GET() {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const accounts = await Account.find({ deletedAt: null }).sort({ createdAt: 1 }).lean();
    const serialized = accounts.map(serializeAccount);
    return NextResponse.json({ success: true, accounts: serialized });
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
