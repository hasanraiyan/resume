import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createAuthorizationCode } from '@/lib/mcp/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  const url = new URL(request.url);

  if (!session || session.user?.role !== 'admin') {
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('callbackUrl', `${url.pathname}${url.search}`);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { code, redirectUri, state } = await createAuthorizationCode({
      session,
      params: url.searchParams,
    });
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set('code', code);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: error.message },
      { status: 400 }
    );
  }
}
