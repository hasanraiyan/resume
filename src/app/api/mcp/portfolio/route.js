import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createPortfolioMcpServer } from '@/lib/portfolio-mcp-server';

let server = null;

export async function GET(req) {
  if (!server) {
    server = createPortfolioMcpServer();
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Store transport globally
  global.mcpPortfolioTransports = global.mcpPortfolioTransports || new Map();

  class NextSseTransport {
    constructor(sessionId, writer) {
      this.sessionId = sessionId;
      this.writer = writer;
      this.onmessage = null;
      this.onclose = null;
      this.onerror = null;
    }

    async start() {
      // Send the endpoint URL
      const endpoint = new URL(`/api/mcp/portfolio/messages?sessionId=${this.sessionId}`, req.url).toString();
      await this.writer.write(encoder.encode(`event: endpoint\ndata: ${endpoint}\n\n`));
    }

    async send(message) {
      await this.writer.write(encoder.encode(`event: message\ndata: ${JSON.stringify(message)}\n\n`));
    }

    async close() {
      await this.writer.close();
      if (this.onclose) {
        this.onclose();
      }
    }
  }

  const sessionId = crypto.randomUUID();
  const nextTransport = new NextSseTransport(sessionId, writer);

  global.mcpPortfolioTransports.set(sessionId, nextTransport);

  // Attach nextTransport to the MCP Server instance
  await server.connect(nextTransport);
  await nextTransport.start();

  req.signal.addEventListener('abort', () => {
    global.mcpPortfolioTransports.delete(sessionId);
    nextTransport.close();
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
