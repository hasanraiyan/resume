import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { getSessionOwnerId } from '@/lib/app-connections';
import { createPairingSession } from '@/lib/attenda/pairing';

export async function POST(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const ownerId = getSessionOwnerId(auth);
    const session = await createPairingSession({ ownerId, expiresInSeconds: 120 });

    let origin = process.env.NEXTAUTH_URL?.replace(/\/+$/, '');
    if (!origin || origin.includes('localhost')) {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
      if (host) {
        const protocol =
          request.headers.get('x-forwarded-proto') ||
          (host.includes('localhost') ? 'http' : 'https');
        origin = `${protocol}://${host}`;
      } else {
        origin = 'https://hasanraiyan.me';
      }
    }

    const pairUrl = `${origin}/apps/attenda/pair?code=${session.code}`;
    const qrPayload = JSON.stringify({
      app: 'attenda',
      v: 1,
      code: session.code,
      serverUrl: origin,
      pairUrl,
    });

    return NextResponse.json({
      success: true,
      code: session.code,
      qrPayload,
      pairUrl,
      serverUrl: origin,
      expiresIn: session.expiresInSeconds,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('Failed to start attenda pairing:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to initiate device pairing' },
      { status: 500 }
    );
  }
}
