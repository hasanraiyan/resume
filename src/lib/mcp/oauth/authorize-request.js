import { findOAuthClient } from './clients';
import { resolveResourceKeyFromUrl } from './resources';

/**
 * Validates the query params of an /api/mcp-oauth/authorize request.
 *
 * Returns `{ ok: true, client, resourceKey, params }` on success.
 * On failure, returns `{ ok: false, status, error, description, redirectTo }`
 * — `redirectTo` is only set once client_id/redirect_uri are known-good,
 * since redirecting on an unverified redirect_uri would be an open redirect.
 */
export async function validateAuthorizeRequest(searchParams) {
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type');
  const resource = searchParams.get('resource');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');
  const scope = searchParams.get('scope') || '';
  const state = searchParams.get('state') || '';

  if (!clientId || !redirectUri) {
    return {
      ok: false,
      status: 400,
      error: 'invalid_request',
      description: 'client_id and redirect_uri are required',
    };
  }

  const client = await findOAuthClient(clientId);
  if (!client || !client.redirectUris.includes(redirectUri)) {
    return {
      ok: false,
      status: 400,
      error: 'invalid_request',
      description: 'Unknown client_id or redirect_uri',
    };
  }

  const redirectTo = (params) => {
    const url = new URL(redirectUri);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.toString();
  };

  if (responseType !== 'code') {
    return {
      ok: false,
      status: 400,
      error: 'unsupported_response_type',
      description: 'Only "code" response_type is supported',
      redirectTo: redirectTo({ error: 'unsupported_response_type', state }),
    };
  }

  if (!codeChallenge || codeChallengeMethod !== 'S256') {
    return {
      ok: false,
      status: 400,
      error: 'invalid_request',
      description: 'PKCE with S256 code_challenge_method is required',
      redirectTo: redirectTo({ error: 'invalid_request', state }),
    };
  }

  const resourceKey = resolveResourceKeyFromUrl(resource);
  if (!resourceKey) {
    return {
      ok: false,
      status: 400,
      error: 'invalid_target',
      description: 'Unknown or missing resource',
      redirectTo: redirectTo({ error: 'invalid_target', state }),
    };
  }

  return {
    ok: true,
    client,
    resourceKey,
    params: { clientId, redirectUri, resource, codeChallenge, codeChallengeMethod, scope, state },
  };
}
