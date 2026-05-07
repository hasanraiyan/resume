import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerJournalyTools } from './tools.js';

export function createMcpServer() {
  const server = new McpServer({
    name: 'journaly',
    version: '1.0.0',
  });

  registerJournalyTools(server);

  return server;
}
