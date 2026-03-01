// src/lib/mcpConfig.js

/**
 * Server-side configuration for all available Model Context Protocol (MCP) integrations.
 * This file is NEVER sent to the client. It contains the actual connection URLs,
 * which may include secret API keys injected via environment variables.
 */
export const getBackendMCPConfig = () => {
  return [
    {
      id: 'mcp-pdf-service',
      name: 'PDF Tools',
      description: 'Create and process PDF documents',
      type: 'mcp',
      // Safe, public MCP url
      url: 'https://pdfservice.pyqdeck.in/mcp/sse',
    },
    {
      id: 'mcp-tavily',
      name: 'Search',
      description: 'Search the web for latest information',
      type: 'rest',
      // Secret API key injected with process.env on the server side
      apiKey: process.env.TAVILY_API_KEY || null,
    },
  ];
};

/**
 * Returns a sanitized list of available MCPs for the frontend.
 * Strips out the actual URLs and keys to prevent leaking secrets to the browser.
 */
export const getFrontendSafeMCPs = () => {
  const config = getBackendMCPConfig();
  return (
    config
      // Only expose tools that are fully configured
      .filter(
        (mcp) =>
          (mcp.type === 'mcp' && mcp.url !== null) || (mcp.type === 'rest' && mcp.apiKey !== null)
      )
      .map(({ id, name, description }) => ({
        id,
        name,
        description,
      }))
  );
};
