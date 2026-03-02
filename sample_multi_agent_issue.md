# Issue: Refactor MCP Tools Architecture (Multi-Agent Assignment)

## 🤖 Agent Assignment

**Primary Agent**: Antigravity (Coordination)
**Collaborators**: Cloud Codex (Core logic), Google Jules (Admin UI)

---

## 🎯 Objective

Refactor the hardcoded portfolio tools into a scalable MCP architecture and introduce "Default" tool functionality in the Admin Panel.

---

## 🛠️ Implementation Scope

### 📂 Allowed Directories/Files

- **Cloud Codex**: `src/models/`, `src/lib/mcpConfig.js`, `src/lib/portfolio-mcp-server.js` (NEW)
- **Google Jules**: `src/components/admin/`, `src/app/(admin)/admin/chatbot/page.js`
- **Antigravity**: `src/app/api/chat/route.js`, `src/lib/chatbot-utils.js`

### ⚠️ Conflict Zones (DO NOT TOUCH)

- `src/app/api/chat/route.js`: Owned by Antigravity during the injection phase.
- `src/lib/mcpConfig.js`: Owned by Cloud Codex for schema updates.

---

## 🚀 Requirements

1. **Cloud Codex**: Add `isDefault` field to `McpServer` model and implement the new `portfolio-mcp-server.js`.
2. **Google Jules**: Add a "Default Tool" toggle to the MCP management UI.
3. **Antigravity**: Update the chat API to auto-inject all `isDefault` MCP servers.

---

## 📝 Coordination Notes

- **Branch**: `multi-agent/mcp-refactor-coordination`
- **Dependencies**: Jules and Antigravity must wait for Codex to finish the `McpServer` model update before testing the UI/API.
- **PR Strategy**: Codex PRs first, then Jules/Antigravity PRs.

---

**Priority**: High
**Status**: 🆕 Pending
