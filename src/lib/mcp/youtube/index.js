import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerYoutubeTools } from './tools.js';

export function createYoutubeMcpServer() {
  const server = new McpServer({
    name: 'youtube',
    version: '1.0.0',
  });

  registerYoutubeTools(server);

  return server;
}
