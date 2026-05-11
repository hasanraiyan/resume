import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import DeviceAuth from '@/models/DeviceAuth';
import AppConnection from '@/models/AppConnection';
import { createMobileSessionToken, createConnectionKey } from '@/lib/app-connections';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { device_code } = body;

    if (!device_code) {
      return NextResponse.json({ error: 'device_code is required' }, { status: 400 });
    }

    const auth = await DeviceAuth.findOne({ deviceCode: device_code });

    if (!auth) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    if (new Date() > auth.expiresAt) {
      auth.status = 'expired';
      await auth.save();
      return NextResponse.json({ error: 'expired_token' }, { status: 400 });
    }

    if (auth.status === 'pending') {
      auth.lastCheckedAt = new Date();
      await auth.save();
      return NextResponse.json({ error: 'authorization_pending' }, { status: 400 });
    }

    if (auth.status === 'denied') {
      return NextResponse.json({ error: 'access_denied' }, { status: 403 });
    }

    if (auth.status === 'authorized') {
      // Create a persistent app connection for the CLI
      const connectionKey = createConnectionKey('cli');
      const connection = await AppConnection.findOneAndUpdate(
        { ownerId: auth.ownerId, clientName: 'Coursify CLI' },
        {
          $set: {
            appKey: 'coursify',
            channel: 'cli',
            connectionType: 'token',
            connectionKey,
            status: 'active',
            revokedAt: null,
            lastUsedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      const token = await createMobileSessionToken(connection);

      // Clean up the device auth record
      await DeviceAuth.deleteOne({ _id: auth._id });

      return NextResponse.json({
        access_token: token,
        token_type: 'Bearer',
        expires_in: 31536000, // 1 year (same as mobile session token)
      });
    }

    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  } catch (error) {
    console.error('[DeviceAuth:Token] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
