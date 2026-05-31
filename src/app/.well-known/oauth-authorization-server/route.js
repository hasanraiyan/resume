import { NextResponse } from 'next/server';
import { getAllSupportedScopes } from '@/lib/mcp/factory';
import { mcpOptionsResponse, withMcpCorsHeaders } from '@/lib/mcp/http-headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const origin = new URL(request.url).origin;

  return withMcpCorsHeaders(
    NextResponse.json({
      issuer: origin,
      authorization_endpoint: `${origin}/api/mcp/oauth/authorize`,
      token_endpoint: `${origin}/api/mcp/oauth/token`,
      revocation_endpoint: `${origin}/api/mcp/oauth/revoke`,
      registration_endpoint: `${origin}/api/mcp/oauth/register`,
      client_id_metadata_document_supported: false,
      response_types_supported: ['code'],
      response_modes_supported: ['query'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: getAllSupportedScopes(),
    })
  );
}

export async function OPTIONS() {
  return mcpOptionsResponse();
}
