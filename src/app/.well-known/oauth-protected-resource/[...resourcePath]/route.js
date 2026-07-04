import {
  generateProtectedResourceMetadata,
  getPublicOrigin,
  metadataCorsOptionsRequestHandler,
} from 'mcp-handler';
import { MCP_OAUTH_RESOURCES } from '@/lib/mcp/oauth/resources';

export async function GET(request, { params }) {
  const { resourcePath = [] } = await params;
  const path = `/${resourcePath.join('/')}`;
  const entry = Object.values(MCP_OAUTH_RESOURCES).find((r) => r.path === path);
  const origin = getPublicOrigin(request);

  const metadata = generateProtectedResourceMetadata({
    authServerUrls: [origin],
    resourceUrl: `${origin}${path}`,
    additionalMetadata: entry ? { scopes_supported: [entry.scope] } : undefined,
  });

  return Response.json(metadata);
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
