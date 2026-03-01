# Multi-Provider AI Support Plan

This plan outlines the architecture for supporting multiple AI providers (OpenAI, Anthropic, Google, OpenRouter, etc.) by allowing admins to configure custom base URLs and API keys.

## 1. Database Schema Updates (`src/models/ChatbotSettings.js`)

Extend the current singleton schema to support a list of providers:

```javascript
providers: [
  {
    id: String, // Unique internal ID (e.g., 'openai-main', 'openrouter-01')
    name: String, // Display name (e.g., 'OpenRouter')
    baseUrl: String, // API endpoint (e.g., 'https://openrouter.ai/api/v1')
    apiKey: String, // Encrypted or hidden API key
    isActive: Boolean,
  },
];
```

Update role assignments to link to specific providers:

```javascript
fastModel: { providerId: String, model: String },
thinkingModel: { providerId: String, model: String },
proModel: { providerId: String, model: String },
```

## 2. API Enhancements

- **New Endpoints**:
  - `POST /api/admin/chatbot/providers`: Add/Update a provider.
  - `GET /api/admin/chatbot/providers/:id/models`: Dynamically fetch models from the provider's `baseUrl` using their `apiKey`.
- **Chat API (`/api/chat/route.js`)**:
  - Look up the `providerId` for the selected model role.
  - Use the provider's `baseUrl` and `apiKey` to initialize the LLM client (OpenAI-compatible clients for most).

## 3. Admin UI Refactoring (`src/app/(admin)/admin/chatbot/page.js`)

- **Providers Tab**: A new tab to manage the provider list.
  - Card-based UI for each provider.
  - "Add Provider" modal with fields: `Name`, `Base URL`, `API Key`.
- **Updated General Tab**:
  - The role assignment slots (Fast, Thinking, Pro) will change to a two-step selection:
    1. Select **Provider** from the list of added providers.
    2. Select **Model** (populated dynamically from that provider).

## 4. Scalability & Security

- **API Key Proxy**: The frontend never sees the API keys. All model fetching and chat requests are proxied through the backend.
- **Client Factory**: Implement a factory pattern in the backend to handle different provider formats (OpenAI, Anthropic, etc.) based on their base URL or an explicit "Client Type" setting.

## 5. Implementation Steps

1.  **Step 1**: Migrate MongoDB schema to support `providers` array.
2.  **Step 2**: Build the Provider management UI and API.
3.  **Step 3**: Implement dynamic model fetching logic.
4.  **Step 4**: Update chat streaming logic to use per-role provider settings.
