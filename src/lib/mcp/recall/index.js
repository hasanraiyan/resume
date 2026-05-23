import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerRecallTools } from './tools.js';

export function createMcpServer() {
  const server = new McpServer({
    name: 'recall',
    version: '1.0.0',
  });

  registerRecallTools(server);

  return server;
}
