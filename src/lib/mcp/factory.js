import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MCP_SERVER_DEFINITIONS } from './server-definitions';
import { normalizeScopes } from '@/lib/app-connections';

const definitionMap = new Map(
  MCP_SERVER_DEFINITIONS.map((definition) => [definition.key, definition])
);

function safeJsonSchema(schema) {
  if (!schema) {
    return { type: 'object', properties: {} };
  }

  try {
    if (typeof z.toJSONSchema === 'function') {
      return z.toJSONSchema(schema);
    }
  } catch {
    // Fall through to the minimal schema below.
  }

  return { type: 'object', properties: {} };
}

export function listMcpServerDefinitions() {
  return MCP_SERVER_DEFINITIONS.map((definition) => ({
    key: definition.key,
    name: definition.name,
    version: definition.version,
    description: definition.description,
    defaultScopes: definition.defaultScopes,
    supportedScopes: definition.supportedScopes,
  }));
}

export function getMcpServerDefinition(serverKey) {
  return definitionMap.get(serverKey) || null;
}

export function getAllSupportedScopes() {
  return [
    ...new Set(MCP_SERVER_DEFINITIONS.flatMap((definition) => definition.supportedScopes || [])),
  ];
}

export function createMcpServer({ serverKey, scopes = [], context = {} }) {
  const definition = getMcpServerDefinition(serverKey);
  if (!definition) {
    return null;
  }

  const normalizedScopes = normalizeScopes(scopes);
  const tools = definition.createTools({ ...context, scopes: normalizedScopes });

  return {
    definition,
    tools,
    getToolDescriptors() {
      return tools.map((tool) => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: safeJsonSchema(tool.schema),
      }));
    },
    async callTool(name, args = {}) {
      const selectedTool = tools.find((tool) => tool.name === name);
      if (!selectedTool) {
        const error = new Error(`Unknown tool: ${name}`);
        error.code = -32602;
        throw error;
      }

      const output =
        typeof selectedTool.invoke === 'function'
          ? await selectedTool.invoke(args)
          : await selectedTool.func(args);

      return typeof output === 'string' ? output : JSON.stringify(output);
    },
  };
}

export function createSdkMcpServer({ serverKey, scopes = [], context = {} }) {
  const scopedServer = createMcpServer({ serverKey, scopes, context });
  if (!scopedServer) {
    return null;
  }

  const server = new McpServer({
    name: scopedServer.definition.name,
    version: scopedServer.definition.version,
  });

  for (const tool of scopedServer.tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description || '',
        inputSchema: tool.schema,
      },
      async (args) => {
        const text = await scopedServer.callTool(tool.name, args || {});
        return {
          content: [{ type: 'text', text }],
        };
      }
    );
  }

  return {
    definition: scopedServer.definition,
    server,
  };
}
