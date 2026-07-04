import { MCP_OAUTH_RESOURCES } from './resources';

export function getAuthorizationServerMetadata(origin) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/api/mcp-oauth/authorize`,
    token_endpoint: `${origin}/api/mcp-oauth/token`,
    registration_endpoint: `${origin}/api/mcp-oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: Object.values(MCP_OAUTH_RESOURCES).map((r) => r.scope),
  };
}
