import { NextResponse } from 'next/server';
import { confirmPairingSession } from '@/lib/attenda/pairing';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, deviceName, platform } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid pairing code' },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get('user-agent') || '';
    const result = await confirmPairingSession(code.trim(), {
      deviceName: deviceName || 'Attenda Mobile Device',
      platform: platform || 'android',
      userAgent,
    });

    if (result.error) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      connection: result.connection,
      ownerId: result.ownerId,
    });
  } catch (error) {
    console.error('Failed to confirm attenda pairing:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to confirm device pairing' },
      { status: 500 }
    );
  }
}
