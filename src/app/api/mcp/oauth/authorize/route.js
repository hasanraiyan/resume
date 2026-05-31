import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createAuthorizationCode, createOAuthErrorRedirect } from '@/lib/mcp/oauth';
import { mcpOptionsResponse, withMcpCorsHeaders } from '@/lib/mcp/http-headers';

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

  const consentUrl = new URL('/mcp-authorize', url.origin);
  consentUrl.search = url.search;
  return NextResponse.redirect(consentUrl);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const url = new URL(request.url);

  if (!session || session.user?.role !== 'admin') {
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('callbackUrl', `${url.pathname}${url.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const formData = await request.formData();
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    if (key !== 'consent' && typeof value === 'string') {
      params.append(key, value);
    }
  }

  try {
    const requestedRedirectUri = params.get('redirect_uri');
    const requestedState = params.get('state');

    if (formData.get('consent') !== 'approve') {
      if (!requestedRedirectUri) {
        throw new Error('redirect_uri is required');
      }

      return withMcpCorsHeaders(
        NextResponse.redirect(
          createOAuthErrorRedirect({
            redirectUri: requestedRedirectUri,
            state: requestedState,
            error: 'access_denied',
            description: 'The authorization request was declined.',
          })
        )
      );
    }

    const { code, redirectUri, state } = await createAuthorizationCode({
      session,
      params: new URLSearchParams([...params.entries(), ['origin', url.origin]]),
    });
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set('code', code);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    return withMcpCorsHeaders(NextResponse.redirect(redirectUrl));
  } catch (error) {
    return withMcpCorsHeaders(
      NextResponse.json(
        { error: 'invalid_request', error_description: error.message },
        { status: 400 }
      )
    );
  }
}

export async function OPTIONS() {
  return mcpOptionsResponse();
}
