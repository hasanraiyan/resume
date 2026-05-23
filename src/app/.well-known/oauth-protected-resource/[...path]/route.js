import { getBaseUrl } from '@/lib/mcp/oauth';
import { MCP_SCOPES_SUPPORTED, scopeFromResource } from '@/lib/mcp/scopes';

export async function GET(_request, { params }) {
  const base = getBaseUrl();
  const pathParts = (await params)?.path || [];
  const resourcePath = `/${pathParts.join('/')}`;
  const scope = scopeFromResource(resourcePath);
  const scopesSupported = scope ? [scope] : MCP_SCOPES_SUPPORTED;

  return Response.json(
    {
      resource: `${base}${resourcePath}`,
      authorization_servers: [base],
      bearer_methods_supported: ['header'],
      scopes_supported: scopesSupported,
    },
    { headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
