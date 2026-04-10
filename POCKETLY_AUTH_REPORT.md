# Pocketly App & Authentication Security Report

## 1. General Architecture Overview

The Pocketly app is a robust personal finance tracker built natively into the Next.js ecosystem. It aims to provide seamless budget, account, and transaction tracking, heavily intertwined with an AI Chat Assistant to aid users.

**Key Components:**

- **Database Models:** Built on MongoDB via Mongoose. The primary models are `Transaction`, `Account`, and `Category`.
- **Frontend Components:** Reside in `src/components/pocketly-tracker`. Key components include modular tabs for records (`RecordsTab.js`), accounts (`AccountsTab.js`), categories (`CategoriesTab.js`), and chat interface (`ChatTab.js`). State like `editTransactionData` is managed globally.
- **API Layer:** Data endpoints are located under `src/app/api/money` (handling basic CRUD for transactions, accounts, categories, and bootstrap syncing) and AI agent communication is rooted at `src/app/api/pocketly/chat/route.js`.
- **AI Integration:** Leverages the `FINANCE_ASSISTANT` agent utilizing real-time Server-Sent Events (SSE) for chat streaming and actions like `draft_transaction`.

## 2. Data Flow for Transactions

The flow of transaction data focuses on consistency, offline capabilities (indicated by sync versions), and AI integration.

- **Creation/Drafting:** A user can create a transaction via `AddTransactionModal` or via chat where the AI agent invokes `draft_transaction`.
- **Mutation Request:** The frontend makes a POST/PUT request to `src/app/api/money/transactions/route.js` (or `[id]/route.js`).
- **Database Operation:** The route performs Mongoose database interactions (`Transaction.save()` or `findByIdAndUpdate`). It supports soft deletion (`deletedAt`) and handles optimistic concurrency via `$inc: { syncVersion: 1 }`.
- **Serialization:** The response returns the fully populated transaction object passed through `serializeTransaction()` in `src/lib/money-serializers.js` to ensure the correct shape is transmitted back to the frontend state.
- **Read Flow:** The GET request handles filtering (by date range, account, type, category) returning an array of serialized items used by the main UI components for tabular and summary display.

## 3. Security Analysis: NextAuth and API Routes

The authentication ecosystem is strictly role-based and secured natively by `NextAuth.js`.

### NextAuth Implementation

- **Provider Strategy:** The platform uses a standalone `CredentialsProvider` rather than standard OAuth or magic links. It securely reads expected `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env` variables, preventing the need for complex database-backed sessions.
- **Session Management:** It uses a `jwt` (JSON Web Token) strategy. Upon successful login, the `user.role = 'admin'` attribute is embedded into the token.
- **Callbacks:** Both `jwt()` and `session()` callbacks ensure that this role flag (`isAdmin`) propagates correctly down to the client environment safely, without exposing sensitive configuration info.

### API Routes & Actions Protection

- **Middleware/Route Handlers:** API endpoints explicitly use helper functions like `requireAdminSession()` (from `src/lib/auth/admin.js`) or `requireAdminAuth()` (from `src/lib/money-auth.js`). These wrappers invoke `getServerSession()` and validate both presence and `user.role === 'admin'`.
- **Rejection Behavior:** Unauthorized access consistently throws `401 Unauthorized` or `403 Forbidden` JSON responses instead of crashing, preserving stability against unauthenticated scans.
- **Chat Agent Security:** `src/app/api/pocketly/chat/route.js` specifically validates admin privilege _and_ wraps incoming traffic with `rateLimit` (e.g. 10 requests / 60s) before creating secure streaming IDs, mitigating bot spamming and brute-force interactions with the AI execution costs.

---

_Report generated based on recent codebase review of API, models, and authentication configuration parameters._
