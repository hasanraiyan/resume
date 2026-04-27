import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SignJWT } from 'jose';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const token = await new SignJWT({ role: 'admin', type: 'mobile-pocketly' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1y')
    .sign(secret);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;

  return NextResponse.json({
    success: true,
    token,
    baseUrl,
    expiresAt: expiresAt.toISOString(),
  });
}
