import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';

export async function GET() {
  try {
    await dbConnect();
    const accounts = await Account.find({}).sort({ createdAt: 1 }).lean();
    const serialized = accounts.map((a) => ({
      ...a,
      _id: a._id.toString(),
      id: a._id.toString(),
    }));
    return NextResponse.json({ success: true, accounts: serialized });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const account = new Account(body);
    await account.save();
    const obj = account.toObject();
    return NextResponse.json({
      success: true,
      account: { ...obj, _id: obj._id.toString(), id: obj._id.toString() },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create account' },
      { status: 500 }
    );
  }
}
