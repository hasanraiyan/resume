import { NextResponse } from 'next/server';
import { getPairingSession } from '@/lib/attenda/pairing';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Missing code parameter' },
        { status: 400 }
      );
    }

    const session = await getPairingSession(code.trim());

    if (!session) {
      return NextResponse.json({
        success: true,
        status: 'expired',
        message: 'Pairing session not found or expired',
      });
    }

    if (session.status === 'expired' || new Date(session.expiresAt) <= new Date()) {
      return NextResponse.json({
        success: true,
        status: 'expired',
        message: 'Pairing code has expired',
      });
    }

    if (session.status === 'linked') {
      return NextResponse.json({
        success: true,
        status: 'linked',
        clientName: session.clientName,
        connectionId: session.connectionId,
      });
    }

    const expiresIn = Math.max(
      0,
      Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)
    );

    return NextResponse.json({
      success: true,
      status: 'pending',
      expiresIn,
    });
  } catch (error) {
    console.error('Failed to check attenda pair status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check pairing status' },
      { status: 500 }
    );
  }
}
