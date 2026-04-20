import { getBaseUrl } from '@/lib/mcp/oauth';

export async function GET() {
  const base = getBaseUrl();
  return Response.json(
    {
      issuer: base,
      authorization_endpoint: `${base}/api/mcp/oauth/authorize`,
      token_endpoint: `${base}/api/mcp/oauth/token`,
      registration_endpoint: `${base}/api/mcp/oauth/register`,
      scopes_supported: ['pocketly'],
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      token_endpoint_auth_methods_supported: ['none'],
      code_challenge_methods_supported: ['S256'],
    },
    { headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
