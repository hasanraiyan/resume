# Bug: ChatbotSettings Validation Failure (Multi-Provider)

A 500 error occurs when saving chatbot settings because the newly structured `modelName` field fails Mongoose validation. Specifically, the `model` property within the `modelName` object is required but is being sent as an empty string from the Admin UI.

## Error Details

- **Message**: `ChatbotSettings validation failed: modelName.model: Path model is required.`
- **Location**: `src/app/api/admin/chatbot/route.js` during the `settings.save()` operation.
- **Cause**: The Admin UI allows selecting a provider without selecting a model. If a roll (like Default, Fast, etc.) is partially configured (Provider selected but Model empty), the POST request sends `{ providerId: "...", model: "" }`. Since the schema has `required: true` for the `model` field, the save fails.

## Root Causes

1. **Strict Schema Constraints**: The `model` field is marked as `required: true` in the nested schema, but the UI initialization or user interaction can leave it empty.
2. **Missing Provider Logic**: If the "Default OpenAI" provider is not explicitly listed in the `providers` array in the UI, the model dropdown remains empty, forcing the user to save an empty model string.
3. **Implicit Overwrites**: The POST handler blindly accepts `{ providerId, model }` from the body. If `model` is empty, it overwrites any working defaults.

## Proposed Fixes

### 1. Relax Schema Validation

In `src/models/ChatbotSettings.js`, change `required: true` to `false` for the nested `model` fields, or provide a smarter default. Since these are optional slots (especially for Fast/Thinking/Pro), they should only be required if a `providerId` is present, or simply allowed to be empty strings.

### 2. Backend Sanitization

In `src/app/api/admin/chatbot/route.js`, the POST handler should sanitize incoming model slots. If a slot has a `providerId` but an empty `model`, it should either be cleared or reverted to a safe default rather than throwing a validation error.

### 3. UI Improvements

Ensure the "Default OpenAI" provider (driven by env vars) is always available in the dropdowns even if the user hasn't added it as a custom provider, or ensure the migration logic in `GET` correctly populates the UI state so it's not empty on first load.

## Technical Notes

- The current migration in `GET /api/admin/chatbot` correctly converts old strings to objects, but it doesn't prevent the UI from "un-setting" them if the user interacts with the new dropdowns before providers are fully loaded.
