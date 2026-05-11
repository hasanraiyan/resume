import crypto from 'crypto';
import http from 'http';
import open from 'open';
import { URL } from 'url';

export function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

export function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export async function receiveAuthorizationCode(authorizeUrl) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const code = url.searchParams.get('code');

      if (code) {
        res.writeHead(200, {
          'Content-Type': 'text/html',
          Connection: 'close',
        });
        res.end('<h1>Authorization successful!</h1><p>You can close this window now.</p>');
        const { port } = server.address();
        server.close();
        resolve({
          code,
          redirectUri: `http://127.0.0.1:${port}`,
          port,
        });
      } else {
        res.writeHead(400, { Connection: 'close' });
        res.end('Authorization code missing');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.unref(); // Prevent server from keeping the process alive
      const finalAuthorizeUrl = new URL(authorizeUrl);
      finalAuthorizeUrl.searchParams.set('redirect_uri', `http://127.0.0.1:${port}`);
      open(finalAuthorizeUrl.toString());
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}

export async function exchangeCodeForTokens({
  baseUrl,
  code,
  codeVerifier,
  clientId,
  redirectUri,
}) {
  const response = await fetch(`${baseUrl}/api/mcp/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      client_id: clientId,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to exchange code: ${response.statusText}`);
  }

  return response.json();
}

export async function refreshToken({ baseUrl, refreshToken, clientId }) {
  const response = await fetch(`${baseUrl}/api/mcp/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to refresh token: ${response.statusText}`);
  }

  return response.json();
}

export async function registerClient({ baseUrl, redirectUris, clientName }) {
  const response = await fetch(`${baseUrl}/api/mcp/oauth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      redirect_uris: redirectUris,
      client_name: clientName,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'coursify',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to register client: ${response.statusText}`);
  }

  return response.json();
}
