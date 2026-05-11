import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import DeviceAuth from '@/models/DeviceAuth';

export async function POST(request) {
  try {
    await dbConnect();

    // Generate codes
    const deviceCode = crypto.randomBytes(32).toString('hex');
    // Readable user code: 8 characters, alphanumeric uppercase
    const userCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const expiresIn = 600; // 10 minutes
    const interval = 5; // Poll every 5 seconds

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUri = `${baseUrl}/auth/device`;

    await DeviceAuth.create({
      deviceCode,
      userCode,
      expiresAt,
      status: 'pending',
      metadata: {
        clientName: 'Coursify CLI',
      }
    });

    return NextResponse.json({
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: verificationUri,
      expires_in: expiresIn,
      interval: interval,
    });
  } catch (error) {
    console.error('[DeviceAuth:Code] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
