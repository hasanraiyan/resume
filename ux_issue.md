# UX Issue: Model Selection for Unsaved Providers

Currently, models can only be fetched for providers that have already been saved to the database. This creates a "Chicken and Egg" problem:

1. User adds a new provider.
2. User wants to select a model for that provider immediately.
3. The model list is empty because the backend `/api/admin/chatbot/providers/[id]/models` returns 404 since the provider ID isn't in the database yet.

## Proposed Fixes

### Affected Files

- `src/app/(admin)/admin/chatbot/page.js` (UI state management)
- `src/app/api/admin/chatbot/providers/[id]/models/route.js` (API endpoints)

## Proposed Fixes

1. **Save-First Workflow**: Inform the user via UI that they need to "Save Settings" before model lists can be fetched for a new provider.
2. **Dynamic Preview**: Allow the "Model Fetch" API to accept an optional `apiKey` and `baseUrl` in the request body (via POST) so the UI can test/preview models before committing to the database.
3. **Manual Entry**: Allow users to manually type a model name if the dropdown is empty.

## Current status

I have added a safety migration to the `GET` handler that ensures at least one provider ("OpenAI Default") is always present in the database to populate the initial dropdowns, so the chatbot isn't "stuck" without any models.
