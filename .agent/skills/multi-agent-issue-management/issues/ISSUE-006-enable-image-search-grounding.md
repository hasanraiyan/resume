# Issue: Enable Google Image Search Grounding for Image Agents

**ID**: ISSUE-006

## 🤖 Agent Assignment

**Primary Agent**: Codex
**Collaborators**: Antigravity

---

## 🎯 Objective

Enable grounding with Google Image Search for both the image generator and image editor AI agents using the new Google Gen AI SDK syntax.

---

## 🛠️ Implementation Scope

### 📂 Allowed Directories/Files

- `src/lib/agents/ai/image-generator-agent.js`
- `src/lib/agents/ai/image-editor-agent.js`

### ⚠️ Conflict Zones (DO NOT TOUCH)

- None

---

## 🚀 Requirements

1. **Update Image Generator Agent**: In `src/lib/agents/ai/image-generator-agent.js` where `client.models.generateContent` is called, add the `tools` array to the `config` object to enable image search grounding.
   ```javascript
   tools: [{ googleSearch: { searchTypes: { imageSearch: {} } } }];
   ```
2. **Update Image Editor Agent**: Perform the exact same update in `src/lib/agents/ai/image-editor-agent.js` within its `client.models.generateContent` call.
3. This will enable both agents to ground their generations with live internet image search results, improving visual fidelity and context.

---

## 📝 Coordination Notes

- **Branch**: `agent/codex/enable-image-search-grounding`
- **Dependencies**: None
- **PR Strategy**: Implement the tool injection in both agents and draft a PR.

---

**Priority**: Medium
**Status**: 🆕 Pending
