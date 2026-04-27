import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function requireAdminAuth(request) {
  // Strategy 1: Bearer token (mobile app)
  const authHeader = request?.headers?.get?.('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
      const { payload } = await jwtVerify(token, secret);
      if (payload.role === 'admin' && payload.type === 'mobile-pocketly') {
        return payload;
      }
    } catch (error) {
      // invalid token — fall through to session check
    }
  }

  // Strategy 2: NextAuth session (web)
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }
  return session;
}
