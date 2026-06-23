import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { getMcpServerDefinition, listMcpServerDefinitions } from './factory';
import { getMcpServerConfig } from './config';
import { verifyAppConnectionToken, normalizeScopes } from '@/lib/app-connections';

// ── Auth helpers ─────────────────────────────────────────────────────

/**
 * Creates a verifyToken function for withMcpAuth that validates
 * Bearer tokens against our NextAuth-based token store.
 */
function createVerifyMcpToken(serverKey) {
  return async (_req, bearerToken) => {
    const auth = await verifyAppConnectionToken(bearerToken, { appKey: serverKey });
    if (!auth) {
      return undefined;
    }

    return {
      token: bearerToken,
      scopes: normalizeScopes(auth.connection.scope),
      clientId: auth.connection.clientId || auth.connection.connectionKey,
      extra: {
        ownerId: auth.ownerId,
        connectionId: auth.connection._id.toString(),
        appKey: auth.connection.appKey,
      },
    };
  };
}

// ── Tool formatting ──────────────────────────────────────────────────

function formatToolOutput(output) {
  const text = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
  const result = { content: [{ type: 'text', text }] };

  if (output && typeof output === 'object') {
    result.structuredContent = Array.isArray(output) ? { items: output } : output;
    result._meta = {
      ...(result._meta || {}),
      structuredContent: output,
    };
  }

  return result;
}

// ── Handler factory ──────────────────────────────────────────────────

/**
 * Builds an mcp-handler (createMcpHandler + withMcpAuth) for the given
 * server key (e.g. 'pocketly', 'test', 'youtube').
 *
 * @param {string} serverKey - The server key to build a handler for
 * @param {object} [options]
 * @param {string[]} [options.scopes] - Scopes to filter tools by. If not provided,
 *   defaults to the server's supported scopes from config.
 * @returns {(request) => Promise<Response>|null} The wrapped handler, or null if
 *   the server is unknown or disabled.
 */
export async function createServerMcpHandler(serverKey, options = {}) {
  const definition = getMcpServerDefinition(serverKey);
  if (!definition) {
    return null;
  }

  const config = await getMcpServerConfig(serverKey);
  if (!config.isEnabled) {
    return null;
  }

  // Compute effective scopes from provided scopes (from token) or config
  const { scopes: providedScopes } = options;
  const allowedScopes = new Set(
    config.allowedScopes?.length ? config.allowedScopes : definition.supportedScopes || []
  );
  const scopePool = providedScopes?.length ? providedScopes : definition.supportedScopes || [];
  const effectiveScopes = scopePool.filter((s) => allowedScopes.has(s));

  // Build the handler with tools filtered to the effective scopes
  const handler = createMcpHandler(
    (server) => {
      const disabledTools = new Set(config.disabledTools || []);
      const tools = definition.createTools({ scopes: effectiveScopes });

      for (const tool of tools) {
        if (disabledTools.has(tool.name)) {
          continue;
        }

        server.registerTool(
          tool.name,
          {
            title: tool.title || tool.name,
            description: tool.description || '',
            inputSchema: tool.schema,
            outputSchema: tool.outputSchema,
            annotations: tool.annotations,
          },
          async (args) => {
            const output =
              typeof tool.invoke === 'function'
                ? await tool.invoke(args || {})
                : await tool.func(args || {});
            return formatToolOutput(output);
          }
        );
      }
    },
    {},
    { basePath: '/api', maxDuration: 30 }
  );

  const verifyToken = createVerifyMcpToken(serverKey);

  return withMcpAuth(handler, verifyToken, {
    required: true,
    resourceMetadataPath: '/.well-known/oauth-protected-resource',
  });
}

/**
 * Lists all known MCP server definitions with their config status.
 */
export async function listServerHandlers() {
  const servers = [];

  for (const definition of listMcpServerDefinitions()) {
    const config = await getMcpServerConfig(definition.key);
    servers.push({
      ...definition,
      isEnabled: config.isEnabled,
    });
  }

  return servers;
}
