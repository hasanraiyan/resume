import { createMcpHandler } from 'mcp-handler';
import { registerPocketlyMcp } from '@/lib/mcp/pocketly/register';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const handler = createMcpHandler(
  (server) => {
    registerPocketlyMcp(server);
  },
  {
    serverInfo: {
      name: 'pocketly-mcp',
      version: '0.1.0',
    },
  },
  {
    basePath: '/api/pocketly-mcp',
    maxDuration: 60,
    disableSse: true,
  }
);

export { handler as GET, handler as POST };
