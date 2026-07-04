import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import McpOAuthClient from '@/models/McpOAuthClient';

export async function registerOAuthClient({ redirectUris, clientName }) {
  await dbConnect();

  const client = await McpOAuthClient.create({
    clientId: crypto.randomUUID(),
    clientName: clientName || 'MCP Client',
    redirectUris,
    tokenEndpointAuthMethod: 'none',
  });

  return client;
}

export async function findOAuthClient(clientId) {
  if (!clientId) return null;
  await dbConnect();
  return McpOAuthClient.findOne({ clientId }).lean();
}
