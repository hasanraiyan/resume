import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { markConnectionUsed, verifyMobileSessionToken } from '@/lib/app-connections';

export async function requireCoursifyAuth(request) {
  const authHeader = request?.headers?.get?.('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    // Strategy 1: Mobile bearer token
    const mobileAuth = await verifyMobileSessionToken(token);
    if (mobileAuth) {
      markConnectionUsed(mobileAuth.connection._id).catch(() => {});
      return {
        role: 'admin',
        ownerId: mobileAuth.ownerId,
        connectionId: mobileAuth.connection._id.toString(),
        source: 'mobile',
      };
    }
  }

  // Strategy 2: NextAuth session (web)
  const session = await getServerSession(authOptions);
  if (session && session.user?.role === 'admin') {
    return {
      ...session,
      source: 'web',
    };
  }

  return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
}
