import { getBaseUrl } from '@/lib/mcp/oauth';

export async function GET() {
  const base = getBaseUrl();
  const metadata = {
    resource: `${base}/api/mcp`,
    authorization_servers: [base],
    bearer_methods_supported: ['header'],
    scopes_supported: ['pocketly'],
  };

  return Response.json(metadata, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
