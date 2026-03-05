# Issue: Consolidate Media Upload Logic into Unified MediaService

**ID**: ISSUE-009

## 🤖 Agent Assignment

**Primary Agent**: Codex
**Collaborators**: Antigravity (for Review)

---

## 🎯 Objective

Refactor the redundant media upload and persistence logic scattered across the codebase into a single, SOLID-compliant `MediaService`. Eliminate critical code duplication that violates DRY and SRP principles.

---

## 🛠️ Implementation Scope

### 📂 Allowed Directories/Files

- `[NEW] src/lib/services/MediaService.js` (The core service class)
- `src/app/actions/mediaActions.js` (Refactor to use MediaService)
- `src/app/api/media/upload/route.js` (Refactor to use MediaService)
- `src/app/api/media/public-generate/route.js` (Refactor to use MediaService)
- `src/lib/agents/ai/blog-writer-agent.js` (Verify external usage)

### ⚠️ Conflict Zones (DO NOT TOUCH)

- `src/components/tools/PresentationGenerator.js` (Internal component state)
- `src/lib/agents/AgentRegistry.js` (Core agent registration)

---

## 🚀 Requirements

1.  **Extract Core Logic**: Create a `MediaService` class that handles:
    - Cloudinary stream initialization and management.
    - MongoDB `MediaAsset` creation and persistence.
    - Triggering background `processAndIndexAsset` via the unified interface.
2.  **Support Multiple Sources**: The service must handle:
    - `File`/`FormData` objects (from browser uploads).
    - `Buffer` objects (from AI generators).
    - `Stream` objects (if applicable).
3.  **Refactor Endpoints**: Replace raw `cloudinary.uploader.upload_stream` and `new MediaAsset().save()` calls in `mediaActions.js` and `api/media/upload/route.js` with calls to the new service.
4.  **Error Handling**: Centralize Cloudinary error parsing and formatting to provide consistent feedback across all upload points.
5.  **Interface Segregation**: Ensure the service has clear, dedicated methods for different upload scenarios (e.g., `uploadBuffer`, `uploadFile`).

---

## 📝 Coordination Notes

- **Branch**: `agent/codex/unified-media-service`
- **Dependencies**: None. This is an architectural cleanup.
- **PR Strategy**: Comprehensive PR replacing all legacy direct-upload calls.

---

**Priority**: High
**Status**: 🆕 Pending
