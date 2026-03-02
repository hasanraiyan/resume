import dbConnect from '@/lib/dbConnect';
import McpServer from '@/models/McpServer';

/**
 * Server-side configuration for all available Model Context Protocol (MCP) integrations.
 * This file is NEVER sent to the client. It contains the actual connection URLs,
 * which may include secret API keys injected via environment variables.
 */
export const getBackendMCPConfig = async (isAdmin = false) => {
  try {
    await dbConnect();
    const query = { isActive: true };
    if (!isAdmin) {
      query.adminOnly = { $ne: true };
    }
    const dynamicServers = await McpServer.find(query);

    const dbConfigs = dynamicServers.map((server) => ({
      id: server._id.toString(),
      name: server.name,
      description: server.description || '',
      type: 'mcp',
      url: server.url,
      icon: server.icon || 'Server',
      color: server.color || 'blue-500',
      adminOnly: server.adminOnly || false,
      isDefault: server.isDefault || false,
    }));

    return [...dbConfigs];
  } catch (error) {
    console.error('Error fetching dynamic MCP config:', error);
    return [];
  }
};

/**
 * Returns a sanitized list of available MCPs for the frontend.
 * Strips out the actual URLs and keys to prevent leaking secrets to the browser.
 */
export const getFrontendSafeMCPs = async (isAdmin = false) => {
  const config = await getBackendMCPConfig(isAdmin);
  return (
    config
      // Only expose tools that are fully configured and not default
      .filter(
        (mcp) =>
          ((mcp.type === 'mcp' && mcp.url !== null) || (mcp.type === 'rest' && mcp.apiKey !== null)) && !mcp.isDefault
      )
      .map(({ id, name, description, icon, color, isDefault }) => ({
        id,
        name,
        description,
        icon: icon || 'Server',
        color: color || 'blue-500',
      }))
  );
};
