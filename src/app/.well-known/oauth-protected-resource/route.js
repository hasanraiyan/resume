import { getBaseUrl } from '@/lib/mcp/oauth';
import { MCP_SCOPES_SUPPORTED } from '@/lib/mcp/scopes';

export async function GET() {
  const base = getBaseUrl();
  return Response.json(
    {
      resource: `${base}/api/mcp`,
      authorization_servers: [base],
      bearer_methods_supported: ['header'],
      scopes_supported: MCP_SCOPES_SUPPORTED,
    },
    { headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
