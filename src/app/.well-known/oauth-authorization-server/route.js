import { getPublicOrigin } from 'mcp-handler';
import { getAuthorizationServerMetadata } from '@/lib/mcp/oauth/metadata';

export async function GET(request) {
  return Response.json(getAuthorizationServerMetadata(getPublicOrigin(request)));
}
