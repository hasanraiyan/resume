# Issue: Refactoring Built-in Chatbot Tools to Scalable MCP Architecture

## 🎯 Overview

Currently, the chatbot uses a hybrid approach for tools:

1.  **Built-in Tools**: Hardcoded in `src/lib/chatbot-utils.js` (6 tools: projects, articles, search, contact).
2.  **External Tools (MCP)**: Dynamically connected via the Model Context Protocol.

This issue proposes refactoring the **built-in tools into a dedicated MCP server**. Additionally, it introduces the concept of **"Default Configuration"** for MCPs, allowing certain toolsets to be "always-on" for the AI without cluttering the frontend tool selection UI.

## 🚀 Key Objectives

- **Scalability**: Decouple portfolio logic from the main chat API route.
- **Dynamic Configuration**: Manage all tools (internal and external) through the same Admin UI.
- **Simplified Frontend**: "Default" tools are injected backend-side, so the user doesn't need to see or toggle core portfolio tools.
- **Protocol Consistency**: Move towards a unified MCP-first architecture for all AI capabilities.

## 🛠️ Proposed Changes

### 1. Database Model Updates

**File: `src/models/McpServer.js`**

- Add `isDefault` boolean field.

```javascript
isDefault: {
  type: Boolean,
  default: false
}
```

### 2. Configuration Logic Updates

**File: `src/lib/mcpConfig.js`**

- Update `getFrontendSafeMCPs` to **exclude** MCPs where `isDefault: true`.
- Update `getBackendMCPConfig` to include the `isDefault` flag in the returned objects.

### 3. Chat API Integration

**File: `src/app/api/chat/route.js`**

- Modify the tool loading logic to automatically fetch and connect all MCPs marked as `isDefault`, regardless of the `activeMCPs` array sent by the frontend.

```javascript
// Example logic update
const defaultMCPConfigs = backendMCPs.filter((m) => m.isDefault);
const selectedMCPConfigs = backendMCPs.filter((m) => activeMCPs.includes(m.id));
const allActiveConfigs = [...new Set([...defaultMCPConfigs, ...selectedMCPConfigs])];
```

### 4. Porting Built-in Tools to MCP

**Target: `src/lib/portfolio-mcp-server.js` (New)**

- Create an MCP server using the `@modelcontextprotocol/sdk`.
- Wrap the existing logic from `src/lib/chatbot-utils.js` (listAllProjects, getProjectDetails, etc.) into `server.tool()` definitions.
- Maintain tool names (e.g., `listAllProjects`) to preserve **Generative UI** compatibility in `src/lib/chatbot-generative-ui.js`.

#### Example Implementation (Reference):

```javascript
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { z } = require('zod');

function createPortfolioMcpServer() {
  const server = new McpServer(
    {
      name: 'portfolio-server',
      version: '1.0.0',
    },
    {
      capabilities: { tools: {}, resources: {}, prompts: {} },
    }
  );

  server.tool(
    'listAllProjects',
    'Get a list of all available project titles and slugs.',
    {},
    async () => {
      // Existing logic from chatbot-utils.js
      const projects = await listAllProjects();
      return { content: [{ type: 'text', text: JSON.stringify(projects) }] };
    }
  );

  return server;
}
```

### 5. Admin Panel Enhancements

- Add a toggle in the MCP Server management UI for "Always Enable (Default)".
- When enabled, the tool is removed from the public "Tool Picker" but remains active for the AI.

## 📝 Implementation Notes

- **Generative UI Tracking**: The AI agent in `route.js` uses `on_tool_end` to map result data to UI components. We must ensure the MCP tool outputs match the schema expected by `getUIBlockForToolResult`.
- **Performance**: Connecting to multiple MCP servers adds a small latency. "Default" MCPs should be well-optimized or hosted on the same infrastructure.

---

**Status**: 🆕 Proposed
**Priority**: High
**Tags**: #chatbot #mcp #architecture #refactoring
