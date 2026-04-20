# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

Every protected API route calls `requireAdminAuth()` from `src/lib/money-auth.js` at the top. This returns a 403 `NextResponse` if the session is missing or not admin — callers must check `if (result instanceof NextResponse) return result` before proceeding.

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

### AI / LangChain Infrastructure

- LangChain + LangGraph for agent orchestration.
- `@langchain/mcp-adapters` and `@modelcontextprotocol/sdk` are already installed — the foundation for MCP server work.
- `@langchain/langgraph-checkpoint-mongodb` is installed for persistent agent state.
- Finance agent stream events: `content`, `tool_start`, `tool_result`, `tool_end` (NDJSON over `text/plain`).

### Path Alias

`@/` maps to `src/` throughout the codebase (configured in `jsconfig.json` / Next.js).

### Key Environment Variables

```
MONGODB_URI
ADMIN_USERNAME
ADMIN_PASSWORD
NEXTAUTH_SECRET
TOTP_SECRET          # optional — enables 2FA on login
```

### Conventions

- All amounts are plain `Number` in INR (e.g., `50.75` = ₹50.75). No cents/paise encoding.
- `pnpm` is the package manager (lockfile is `pnpm-lock.yaml`).
- Tailwind CSS v4 with PostCSS.
- Prettier runs on pre-commit via Husky + lint-staged on `*.{js,jsx,ts,tsx,json,css,md}`.
- Codebase is JavaScript (`.js`/`.jsx`), not TypeScript, despite TypeScript being installed as a dev dep.
