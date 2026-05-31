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

function formatToolContent(output) {
  return typeof output === 'string' ? output : JSON.stringify(output, null, 2);
}

export function listMcpServerDefinitions() {
  return MCP_SERVER_DEFINITIONS.map((definition) => ({
    key: definition.key,
    name: definition.name,
    version: definition.version,
    description: definition.description,
    instructions: definition.instructions,
    defaultScopes: definition.defaultScopes,
    supportedScopes: definition.supportedScopes,
    scopeDescriptions: definition.scopeDescriptions || {},
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
        title: tool.title,
        description: tool.description || '',
        inputSchema: safeJsonSchema(tool.schema),
        outputSchema: tool.outputSchema ? safeJsonSchema(tool.outputSchema) : undefined,
        annotations: tool.annotations,
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

      return formatToolContent(output);
    },
  };
}

export function createSdkMcpServer({ serverKey, scopes = [], context = {} }) {
  const scopedServer = createMcpServer({ serverKey, scopes, context });
  if (!scopedServer) {
    return null;
  }

  const server = new McpServer(
    {
      name: scopedServer.definition.name,
      version: scopedServer.definition.version,
    },
    scopedServer.definition.instructions
      ? { instructions: scopedServer.definition.instructions }
      : undefined
  );

  for (const tool of scopedServer.tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description || '',
        inputSchema: tool.schema,
        outputSchema: tool.outputSchema,
        annotations: tool.annotations,
      },
      async (args) => {
        const selectedTool = scopedServer.tools.find(
          (registeredTool) => registeredTool.name === tool.name
        );
        const output =
          typeof selectedTool.invoke === 'function'
            ? await selectedTool.invoke(args || {})
            : await selectedTool.func(args || {});
        const text = formatToolContent(output);
        const result = {
          content: [{ type: 'text', text }],
        };

        if (output && typeof output === 'object') {
          result.structuredContent = output;
        }

        return result;
      }
    );
  }

  return {
    definition: scopedServer.definition,
    server,
  };
}
