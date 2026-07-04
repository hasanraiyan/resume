import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getSessionOwnerId } from '@/lib/app-connections';
import { validateAuthorizeRequest } from '@/lib/mcp/oauth/authorize-request';
import { createAuthorizationCode } from '@/lib/mcp/oauth/codes';

async function requireAdminSession(request, url) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === 'admin') return session;

  const loginUrl = new URL('/login', url.origin);
  loginUrl.searchParams.set('callbackUrl', request.url);
  return NextResponse.redirect(loginUrl);
}

// Step 1: user's browser lands here with the authorization request. If the
// admin isn't logged in, bounce through /login; otherwise show the consent page.
export async function GET(request) {
  const url = new URL(request.url);

  const sessionOrRedirect = await requireAdminSession(request, url);
  if (sessionOrRedirect instanceof NextResponse) return sessionOrRedirect;

  const result = await validateAuthorizeRequest(url.searchParams);
  if (!result.ok) {
    if (result.redirectTo) return NextResponse.redirect(result.redirectTo);
    return NextResponse.json(
      { error: result.error, error_description: result.description },
      { status: result.status }
    );
  }

  const consentUrl = new URL('/mcp-authorize', url.origin);
  consentUrl.search = url.search;
  return NextResponse.redirect(consentUrl);
}

// Step 2: the consent page posts here with the admin's decision.
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'access_denied' }, { status: 401 });
  }

  const formData = await request.formData();
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    if (key !== 'decision') params.set(key, value);
  }

  const result = await validateAuthorizeRequest(params);
  if (!result.ok) {
    if (result.redirectTo) return NextResponse.redirect(result.redirectTo, 303);
    return NextResponse.json(
      { error: result.error, error_description: result.description },
      { status: result.status }
    );
  }

  const { client, resourceKey, params: p } = result;
  const redirectUrl = new URL(p.redirectUri);

  if (formData.get('decision') !== 'approve') {
    redirectUrl.searchParams.set('error', 'access_denied');
    if (p.state) redirectUrl.searchParams.set('state', p.state);
    return NextResponse.redirect(redirectUrl.toString(), 303);
  }

  const code = await createAuthorizationCode({
    clientId: client.clientId,
    redirectUri: p.redirectUri,
    resource: p.resource,
    scope: p.scope || resourceKey,
    codeChallenge: p.codeChallenge,
    codeChallengeMethod: p.codeChallengeMethod,
    ownerId: getSessionOwnerId(session),
  });

  redirectUrl.searchParams.set('code', code);
  if (p.state) redirectUrl.searchParams.set('state', p.state);
  return NextResponse.redirect(redirectUrl.toString(), 303);
}
