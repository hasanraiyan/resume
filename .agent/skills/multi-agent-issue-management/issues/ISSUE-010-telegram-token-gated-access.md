# Issue: Telegram Token-Gated Access

**ID**: ISSUE-010

## Agent Assignment

**Primary Agent**: Codex
**Collaborators**: Antigravity (review)

---

## Objective

Gate the Telegram chatbot so only private chats that send `auth:<generated-code>` can use it, then persist authorized Telegram chats on the integration record.

---

## Implementation Scope

### Allowed Directories/Files

- `src/app/(admin)/admin/agents/page.js`
- `src/app/api/admin/integrations/route.js`
- `src/app/api/admin/integrations/[id]/route.js`
- `src/app/api/webhooks/[platform]/route.js`
- `src/lib/integrations/adapters/TelegramAdapter.js`
- `src/lib/integrations/credentials.js`
- `src/models/IntegrationSettings.js`

### Conflict Zones (DO NOT TOUCH)

- `src/models/TelegramSettings.js`
- `src/app/api/admin/telegram-settings/route.js`
- `src/lib/agents/ai/telegram-agent.js`

---

## Requirements

1. Add `credentials.telegramAuthToken` to the Telegram channel integration flow and encrypt/redact it like other sensitive integration secrets.
2. Generate a unique Telegram auth code automatically for each Telegram integration and expose it to admins as `auth:<code>`.
3. Persist Telegram access control in `metadata.authorizedChats` with entries shaped as `{ chatId, username?, firstAuthorizedAt, lastAuthorizedAt }`.
4. Intercept Telegram webhook traffic before agent execution:
   - allow open access when no Telegram auth token is configured
   - reject non-private chats when auth is enabled
   - accept `auth:<generated-code>` to authorize or refresh a chat
   - block unauthorized chats until they authenticate
5. Surface the generated Telegram auth code and authorized chat count in `/admin/agents` under the Channels modal.
6. Clear the stored Telegram allowlist when the Telegram auth code is regenerated.

---

## Linked Files

- `src/app/(admin)/admin/agents/page.js`
- `src/app/api/admin/integrations/route.js`
- `src/app/api/admin/integrations/[id]/route.js`
- `src/app/api/webhooks/[platform]/route.js`
- `src/lib/integrations/adapters/TelegramAdapter.js`
- `src/lib/integrations/credentials.js`
- `src/models/IntegrationSettings.js`

---

## Coordination Notes

- **Branch**: `codex/telegram-token-gated-access`
- **Dependencies**: None
- **PR Strategy**: Single focused PR covering admin UI, integration persistence, webhook gating, and issue tracking artifact

---

**Priority**: High
**Status**: Pending
