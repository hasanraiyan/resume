import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WIDGETS } from './constants.js';
import { registerPocketlyWidget } from './widgets.js';
import { registerPocketlyTools } from './tools.js';

export function createMcpServer() {
  const server = new McpServer({
    name: 'pocketly',
    version: '1.0.0',
  });

  registerPocketlyWidget(server, WIDGETS.accounts, 'accounts');
  registerPocketlyWidget(server, WIDGETS.transactions, 'transactions');
  registerPocketlyWidget(server, WIDGETS.budgets, 'budgets');
  registerPocketlyWidget(server, WIDGETS.summary, 'summary');

  registerPocketlyTools(server);

  return server;
}
