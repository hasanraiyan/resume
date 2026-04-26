import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WIDGETS } from './constants.js';
import { registerSnaplinksWidget } from './widgets.js';
import { registerSnaplinksTools } from './tools.js';

export function createSnaplinksMcpServer() {
  const server = new McpServer({
    name: 'snaplinks',
    version: '1.0.0',
  });

  registerSnaplinksWidget(server, WIDGETS.links, 'links');
  registerSnaplinksWidget(server, WIDGETS.analytics, 'analytics');

  registerSnaplinksTools(server);

  return server;
}
