import { requireAdminAuth } from '@/lib/money-auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DeviceAuth from '@/models/DeviceAuth';
import { getSessionOwnerId } from '@/lib/app-connections';

export async function POST(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await dbConnect();
    const body = await request.json();
    const { userCode, action } = body; // action: 'authorize' or 'deny'

    if (!userCode) {
      return NextResponse.json({ success: false, error: 'User code is required' }, { status: 400 });
    }

    const deviceAuth = await DeviceAuth.findOne({ userCode: userCode.toUpperCase() });

    if (!deviceAuth) {
      return NextResponse.json({ success: false, error: 'Invalid or expired code' }, { status: 404 });
    }

    if (deviceAuth.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Code already used or expired' }, { status: 400 });
    }

    const ownerId = getSessionOwnerId(auth);

    if (action === 'authorize') {
      deviceAuth.status = 'authorized';
      deviceAuth.ownerId = ownerId;
    } else {
      deviceAuth.status = 'denied';
    }

    await deviceAuth.save();

    return NextResponse.json({ success: true, status: deviceAuth.status });
  } catch (error) {
    console.error('[DeviceAuth:Authorize] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
