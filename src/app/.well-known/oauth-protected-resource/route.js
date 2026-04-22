import { getBaseUrl } from '@/lib/mcp/oauth';

export async function GET() {
  const base = getBaseUrl();
  return Response.json(
    {
      resource: `${base}/api/mcp`,
      authorization_servers: [base],
      bearer_methods_supported: ['header'],
      scopes_supported: ['pocketly', 'snaplinks'],
    },
    { headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
