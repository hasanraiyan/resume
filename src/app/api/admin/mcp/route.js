import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getSessionOwnerId } from '@/lib/app-connections';
import { getMcpServerConfig } from '@/lib/mcp/config';
import { createMcpServer, listMcpServerDefinitions } from '@/lib/mcp/factory';
import AppConnection from '@/models/AppConnection';
import dbConnect from '@/lib/dbConnect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin' ? session : null;
}

function serializeConnection(connection) {
  return {
    id: connection._id.toString(),
    clientId: connection.clientId,
    clientName: connection.clientName,
    connectionType: connection.connectionType,
    scope: connection.scope,
    resource: connection.resource,
    lastUsedAt: connection.lastUsedAt?.toISOString?.() || null,
    createdAt: connection.createdAt?.toISOString?.() || null,
    metadata: connection.metadata || {},
  };
}

function getServerStatus(config, toolsCount, disabledToolsCount) {
  if (!config.isEnabled) {
    return 'disabled';
  }

  if (toolsCount > 0 && disabledToolsCount > 0) {
    return 'partial';
  }

  return 'enabled';
}

export async function GET(request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const ownerId = getSessionOwnerId(session);
  const origin = new URL(request.url).origin;
  const servers = await Promise.all(
    listMcpServerDefinitions().map(async (definition) => {
      const config = await getMcpServerConfig(definition.key);
      const allToolsServer = createMcpServer({
        serverKey: definition.key,
        scopes: definition.defaultScopes,
        config: { ...config, isEnabled: true, disabledTools: [] },
      });
      const activeToolsServer = createMcpServer({
        serverKey: definition.key,
        scopes: definition.defaultScopes,
        config,
      });
      const connections = await AppConnection.find({
        ownerId,
        appKey: definition.key,
        channel: 'mcp',
        status: 'active',
      })
        .sort({ lastUsedAt: -1, createdAt: -1 })
        .lean();

      const disabledTools = new Set(config.disabledTools);
      const tools = (allToolsServer?.getToolDescriptors() || []).map((tool) => ({
        ...tool,
        isEnabled: config.isEnabled && !disabledTools.has(tool.name),
      }));
      const toolsCount = tools.length;
      const enabledToolsCount = activeToolsServer?.tools?.length || 0;
      const disabledToolsCount = toolsCount - enabledToolsCount;
      const scopes = config.allowedScopes.length
        ? config.allowedScopes
        : definition.supportedScopes;

      return {
        key: definition.key,
        name: definition.name,
        version: definition.version,
        description: definition.description,
        instructions: definition.instructions,
        isEnabled: config.isEnabled,
        status: getServerStatus(config, toolsCount, disabledToolsCount),
        toolsCount,
        enabledToolsCount,
        disabledToolsCount,
        scopes,
        defaultScopes: definition.defaultScopes,
        scopeDescriptions: definition.scopeDescriptions,
        resource: `${origin}/api/mcp/${definition.key}`,
        authUrl: `${origin}/api/mcp/oauth/authorize`,
        activeConnections: connections.length,
        connections: connections.map(serializeConnection),
        tools,
        notes: config.notes,
      };
    })
  );

  return NextResponse.json({ servers });
}
