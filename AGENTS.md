# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
# Development (Turbopack)
pnpm dev

# Production build (clears cache first)
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint

# Format all files
pnpm format

# Check formatting without writing
pnpm check-format
```

There are no automated tests. `mongodb-memory-server` is installed as a dev dep but no test runner is configured.

## Architecture Overview

This is a **Next.js 15 (App Router)** personal portfolio site that also hosts several mini-apps. Everything lives under `src/`.

### Route Structure

- **Public routes**: `/` (portfolio homepage), `/blog`, `/projects`, `/resume`, `/tools`, `/r/[slug]` (SnapLinks redirect), `/offline` (PWA fallback).
- **Admin routes**: `(admin)` route group at `src/app/(admin)/` — `/admin/*` dashboard, `/login`. Admin layout is a client component wrapping `SessionProvider` with sidebar nav.
- **Mini-app routes**: `/apps/*` — all five mini-apps are admin-only (enforced by middleware).
- **MCP/OAuth**: `/mcp-authorize` (Authorize/Decline prompt), `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource` (OAuth 2.0 discovery for MCP). The OAuth flow is integrated with NextAuth: `GET /api/mcp/oauth/authorize` checks for a session, redirects to `/login` if needed, then to `/mcp-authorize` for user approval.

### Middleware

`middleware.js` at project root uses `next-auth/middleware` `withAuth`. Matcher: `/admin/*`, `/apps/:path*`, `/api/pocketly/:path*`, `/api/taskly/:path*`. The `/apps` route requires `role === 'admin'`.

### Server Actions

19 server action files live under `src/app/actions/` (e.g., `heroActions.js`, `siteActions.js`, `projectActions.js`). The root layout calls `getHeroData()` and `getSiteConfig()` server actions. Server actions body size limit is 10MB (configured in `next.config.mjs`).

### Mini-Apps

Five self-contained apps live under `src/app/apps/`:

| App            | Route              | Description              |
| -------------- | ------------------ | ------------------------ |
| **Pocketly**   | `/apps/pocketly`   | Personal finance tracker |
| **Taskly**     | `/apps/taskly`     | Task/project manager     |
| **Memoscribe** | `/apps/memoscribe` | AI-powered notes         |
| **Snaplinks**  | `/apps/snaplinks`  | Short link manager       |
| **Vaultly**    | `/apps/vaultly`    | File/media vault         |

Each app follows the same pattern: a layout wrapping a context provider, a main `page.js` shell, tab components in `src/components/<app-name>/`, API routes under `src/app/api/<app-name>/`, and Mongoose models in `src/models/`.

### Authentication

Single admin user only. NextAuth `CredentialsProvider` validates against `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars. Optional TOTP via `TOTP_SECRET`. Session strategy is JWT (no DB adapter). The `role: 'admin'` claim lives in the JWT.

Every protected API route calls `requireAdminAuth(request)` from `src/lib/money-auth.js` at the top. This returns a 403 `NextResponse` if the session is missing or not admin — callers must check `if (result instanceof NextResponse) return result` before proceeding.

### Database

MongoDB via Mongoose. Connection is cached in `global.mongoose` (see `src/lib/dbConnect.js`) to survive hot reloads in dev and serverless cold starts. Always call `await dbConnect()` before any model query.

**Soft-delete pattern used everywhere**: models have `deletedAt: Date` (null = active) and `syncVersion: Number` (incremented on each mutation). Always filter `{ deletedAt: null }` for active records. Nothing is hard-deleted.

### Pocketly — Finance App Deep Dive

The most complex app. Key files:

- **API**: `src/app/api/money/` — REST CRUD for transactions, accounts, categories; plus `/bootstrap` (single-call data load) and `/analysis` (aggregated stats).
- **Context**: `src/context/MoneyContext.js` — `useReducer` store; manages all CRUD via REST calls + local state sync. `fetchBootstrap()` is the primary data entry point.
- **Account balances**: Never stored in DB. Computed on every read by `computeAccountSummaries()` in `src/lib/money-account-summary.js` — which replays all non-deleted transactions against `initialBalance`. Use `/api/money/accounts` (not raw DB queries) to get accurate balances.
- **Serializers**: `src/lib/money-serializers.js` converts Mongoose docs to plain objects, maps `_id` → `id` (both fields present), and ISO-stringifies all dates.
- **AI chat**: `src/app/api/pocketly/chat/route.js` runs a LangGraph ReAct agent streaming NDJSON. The agent has 6 tools defined in `src/lib/agents/utils/finance-tools.js`: `get_accounts`, `get_categories`, `get_transactions`, `get_analysis`, `draft_transaction`, `ask_clarification_question`. These tools hit MongoDB directly (not via HTTP).
- **`draft_transaction` enforcement**: IDs must be resolved via tool calls (`accountResolvedViaTool`, `categoryResolvedViaTool` flags). The tool throws if IDs look like they were invented.

### AI / Agent System

LangChain + LangGraph for agent orchestration. `src/lib/agents/` contains `AgentManager.js`, `AgentRegistry.js`, `BaseAgent.js`, plus `utils/` with tool definitions for each domain: `finance-tools.js`, `admin-tools.js`, `portfolio-tools.js`, `skill-tools.js`, `taskly-tools.js`, `embedding-agent.js`, `chatbot-utils.js`, `context-builder.js`. A `memory/` subdirectory handles agent memory.

- `@langchain/langgraph-checkpoint-mongodb` for persistent agent state.
- Finance agent stream events: `content`, `tool_start`, `tool_result`, `tool_end` (NDJSON over `text/plain`).
- **Dual chat runners**: `src/lib/finance-chat/cloudChatRunner.js` (server-side) and `deviceChatRunner.js` + `src/lib/finance-ai/deviceFinanceChat.js` (on-device). Also `persistence.js` and `messageState.js` for chat state management.

### MCP Server

`src/lib/mcp/pocketly/` implements a Pocketly MCP server using `@modelcontextprotocol/sdk`. `src/lib/mcp/oauth.js` implements OAuth 2.0 with PKCE for MCP authentication. The authorization flow uses a conditional UI: authenticated admins are redirected to a dedicated `/mcp-authorize` page for an Authorize/Decline prompt, avoiding double logins. MCP server configs are stored in MongoDB (not config files) — fetched via `src/lib/mcpConfig.js` using the `McpServer` model. Related models: `McpServer.js`, `McpClient.js`, `McpAuthCode.js`.

### UI Components

`src/components/ui/` has ~18 components with a barrel export at `index.js`. Import pattern: `import { Button, Card } from '@/components/ui'`. Design tokens live in `src/styles/tokens.js` and `src/styles/components.js` (imported as `@/styles/tokens`, `@/styles/components`).

### Context Providers

Root layout wraps everything in `SessionProvider > AnalyticsProvider > SiteProvider`. Each mini-app adds its own provider (e.g., `MoneyContext`, `TasklyContext`, `MemoscribeContext`). Additional contexts: `FinanceContext`, `FinanceChatContext`, `LoadingContext`, `TasklyChatContext`.

### Integrations

`src/lib/integrations/` has `IntegrationFactory.js`, `credentials.js`, and `adapters/` for external platform integrations (Telegram, WhatsApp).

### Path Alias

`@/` maps to `src/` throughout the codebase (configured in `jsconfig.json` / Next.js).

### Key Environment Variables

See `.env.example` for the full list. Critical ones:

```
MONGODB_URI
ADMIN_USERNAME
ADMIN_PASSWORD
NEXTAUTH_SECRET
TOTP_SECRET          # optional — enables 2FA on login
ENCRYPTION_SECRET    # AES encryption for credentials
NEXT_PUBLIC_BASE_URL
CLOUDINARY_*         # 3 vars — media hosting
UPLOADTHING_*        # 2 vars — file uploads
QDRANT_URL / QDRANT_API_KEY  # vector DB for AI embeddings
CRON_API_KEY
```

### Conventions

- All amounts are plain `Number` in INR (e.g., `50.75` = ₹50.75). No cents/paise encoding.
- `pnpm` is the package manager (lockfile is `pnpm-lock.yaml`).
- Tailwind CSS v4 with PostCSS.
- Prettier runs on pre-commit via Husky + lint-staged on `*.{js,jsx,ts,tsx,json,css,md}`. Config: `semi: true`, `singleQuote: true`, `trailingComma: "es5"`, `tabWidth: 2`, `printWidth: 100`.
- Codebase is JavaScript (`.js`/`.jsx`), not TypeScript, despite TypeScript being installed as a dev dep.
- Mongoose models use `mongoose.models.X || mongoose.model('X', Schema)` pattern to prevent recompilation. All models include `{ timestamps: true }`.
- `pnpm build` skips lint (`next build --no-lint`).
- PWA support: `PWAManager` component in root layout, `manifest.json` in `public/`, offline page at `/offline`.
- Utility helpers in `src/utils/`: `classNames.js` (exports `cn`), `math.js`, `string.js`, `pdfGenerator.js`, `analytics-helpers.js`.
