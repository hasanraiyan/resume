import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { markConnectionUsed, verifyMobileSessionToken } from '@/lib/app-connections';

export async function requireAdminAuth(request, options = {}) {
  // Strategy 1: Bearer token (mobile app)
  const authHeader = request?.headers?.get?.('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const requiredScopes = options.requiredScopes || (options.scope ? [options.scope] : ['admin']);
    const mobileAuth = await verifyMobileSessionToken(token, {
      ...options,
      requiredScopes,
    });

    if (mobileAuth) {
      markConnectionUsed(mobileAuth.connection._id).catch(() => {});
      return {
        role: 'admin',
        ownerId: mobileAuth.ownerId,
        connectionId: mobileAuth.connection._id.toString(),
        source: 'mobile',
        connection: mobileAuth.connection,
      };
    }
  }

  // Strategy 2: NextAuth session (web)
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }
  return session;
}
