import dbConnect from '@/lib/dbConnect';
import McpServer from '@/models/McpServer';

/**
 * Server-side configuration for all available Model Context Protocol (MCP) integrations.
 * This file is NEVER sent to the client. It contains the actual connection URLs,
 * which may include secret API keys injected via environment variables.
 */
export const getBackendMCPConfig = async () => {
  try {
    await dbConnect();
    const dynamicServers = await McpServer.find({ isActive: true });

    const dbConfigs = dynamicServers.map((server) => ({
      id: server._id.toString(),
      name: server.name,
      description: server.description || '',
      type: 'mcp',
      url: server.url,
      icon: server.icon || 'Server',
      color: server.color || 'blue-500',
    }));

    return [
      ...dbConfigs,
      {
        id: 'mcp-pdf-service',
        name: 'PDF Tools',
        description: 'Create and process PDF documents',
        type: 'mcp',
        url: 'https://pdfservice.pyqdeck.in/mcp/sse',
        icon: 'FileText',
        color: 'red-500',
      },
      {
        id: 'mcp-tavily',
        name: 'Search',
        description: 'Search the web for latest information',
        type: 'rest',
        apiKey: process.env.TAVILY_API_KEY || null,
        icon: 'Globe',
        color: 'green-500',
      },
    ];
  } catch (error) {
    console.error('Error fetching dynamic MCP config:', error);
    return [];
  }
};

/**
 * Returns a sanitized list of available MCPs for the frontend.
 * Strips out the actual URLs and keys to prevent leaking secrets to the browser.
 */
export const getFrontendSafeMCPs = async () => {
  const config = await getBackendMCPConfig();
  return (
    config
      // Only expose tools that are fully configured
      .filter(
        (mcp) =>
          (mcp.type === 'mcp' && mcp.url !== null) || (mcp.type === 'rest' && mcp.apiKey !== null)
      )
      .map(({ id, name, description, icon, color }) => ({
        id,
        name,
        description,
        icon: icon || 'Server',
        color: color || 'blue-500',
      }))
  );
};
