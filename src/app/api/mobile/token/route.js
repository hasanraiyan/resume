import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  createAppConnection,
  createConnectionKey,
  createMobileSessionToken,
  getSessionOwnerId,
} from '@/lib/app-connections';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  const ownerId = getSessionOwnerId(session);
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
  const connection = await createAppConnection({
    ownerId,
    appKey: 'pocketly',
    channel: 'android',
    connectionType: 'session',
    connectionKey: createConnectionKey('android'),
    clientName: 'Pocketly Android App',
    scope: 'pocketly',
    metadata: {
      issuedFrom: 'settings_qr',
      issuedAt: new Date().toISOString(),
      baseUrl,
    },
  });
  const token = await createMobileSessionToken(connection);

  return NextResponse.json({
    success: true,
    token,
    connectionId: connection._id.toString(),
    baseUrl,
    expiresAt: expiresAt.toISOString(),
  });
}
