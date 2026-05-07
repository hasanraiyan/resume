import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerCoursifyTools } from './tools.js';

export function createCoursifyMcpServer() {
  const server = new McpServer({
    name: 'coursify',
    version: '1.0.0',
  });

  registerCoursifyTools(server);

  return server;
}
