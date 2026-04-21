# Technical Analysis: Pocketly MCP Server & App Integration

## 1. Executive Summary

This report provides a comprehensive technical analysis of the **Pocketly MCP (Model Context Protocol) Server** and its integration with the overarching **Pocketly Next.js application**. The MCP server implementation operates as an intermediary gateway, allowing external AI clients (like the Claude Desktop application) to directly interact with Pocketly's backend financial tracker via secure WebTransport streams.

The architecture marries the `@modelcontextprotocol/sdk` with a custom OAuth 2.0 PKCE flow integrated deeply within Next.js API route handlers.

---

## 2. Architecture Overview

### Next.js API Integration

The MCP server does not run as a standalone Node.js process; instead, it runs within the Next.js App Router context.
- **Routing:** Handled entirely by `src/app/api/mcp/route.js`.
- **Transport:** Relies on `WebStandardStreamableHTTPServerTransport`, wrapping incoming HTTP requests into an MCP-compatible streaming protocol.
- **Bootstrapping:** The server logic is instantiated per-request via `createMcpServer()` located in `src/lib/mcp/server.js`.

### The Pocketly Data Models

The integration ties directly into Pocketly's Mongoose models (`Account`, `Category`, `Transaction`), which store financial data for the application. The front-end React components (such as `AccountsTab.js`, `ChatTab.js`) and context providers (`MoneyContext.js`) manage user interaction natively on the web, while the MCP server provides an alternate, AI-driven interface strictly mirroring the database schema.

---

## 3. Tool Capabilities (Pocketly Integration)

The `createMcpServer()` function registers seven primary tools to manage finances autonomously:

1. **`get_accounts`**: Retrieves all active accounts along with their dynamically computed balances.
2. **`get_categories`**: Fetches all available categories, sorted logically.
3. **`get_transactions`**: Retrieves a paginated list of transactions, capable of filtering by type (income/expense/transfer).
4. **`get_financial_summary`**: Performs server-side data aggregation to present a holistic view of finances—including total net flow, total balance across all accounts, and top expense/income categories.
5. **`create_transaction`**: Allows an LLM to add new records. It properly enforces relational data checks (e.g., verifying `accountId` and `categoryId` as valid ObjectIds, validating transfer logic between source and destination accounts).
6. **`delete_transaction`**: Soft-deletes a record by appending a `deletedAt` timestamp.
7. **`update_transaction`**: A PATCH-like mechanism to alter amounts, notes, dates, or classifications of existing transactions.

These tools serialize database responses via helpers (`serializeTransaction`, `serializeAccount`) to ensure compatibility and strict data formatting for the AI client.

---

## 4. Authentication & Security Structure

The MCP server implements a custom OAuth 2.0 authorization code flow with PKCE (`S256`), acting as its own Identity Provider.

### The OAuth Flow
1. **Registration:** Clients can register themselves via `/api/mcp/oauth/register` to receive a `client_id`. This endpoint utilizes an in-memory rate-limiter based on IP.
2. **Authorization:** `/api/mcp/oauth/authorize` acts as the entry point, storing pending authorization state in HTTP-only cookies and redirecting to the `/mcp-auth` login page.
3. **Login:** Once the user inputs valid credentials, a one-time `McpAuthCode` document is created in MongoDB.
4. **Token Generation:** The client exchanges the authorization code alongside the PKCE challenge at `/api/mcp/oauth/token` to receive an Access Token and Refresh Token.

### Security Implementation Details
- **Token Encoding:** Tokens are generated using NextAuth's `next-auth/jwt` functions, cryptographically signed with `process.env.NEXTAUTH_SECRET`.
- **Privilege Separation (Crucial Finding):** The `/mcp-auth` login page explicitly validates user input against `process.env.ADMIN_USERNAME` and `process.env.ADMIN_PASSWORD` via a constant-time equality check (`timingSafeEqual`). **It does not authenticate against standard user collections.**
- **Mongoose Data Isolation:** The `Transaction`, `Category`, and `Account` schemas **do not** implement a `userId` field. This indicates that Pocketly is currently structured as a single-tenant (or unified admin) application.

---

## 5. Observations & Recommendations

### 1. Data Model & Multi-Tenancy Conflict
There is a notable architectural decision where the database models do not associate records with individual users. Since the MCP server queries (`Transaction.find({ deletedAt: null })`) execute without `userId` filters, any authorized client gets complete read/write access to the entire application's data layer. While acceptable for a single-user portfolio app, this architecture will face severe limitations if Pocketly is expanded to serve multiple public users.

### 2. Rate Limiting Scope
Currently, basic rate limiting is only implemented on the `/api/mcp/oauth/register` endpoint (in-memory `Map` tracking IPs). It is recommended to extend this rate-limiting to:
- The `/api/mcp/oauth/token` endpoint (to prevent brute-forcing token exchanges).
- The primary `/api/mcp` execution endpoint (to protect against malicious LLM looping executing thousands of database queries).

### 3. Serverless Extensibility
Because the system runs inside Next.js API Routes (serverless functions) rather than a persistent Node server, the MCP `WebTransport` stream could face abrupt terminations if executing long-running LLM workflows, constrained by Vercel/Next.js maximum execution timeouts.

### 4. Admin Credentials Exposure
The integration bypasses the standard NextAuth session logic in favor of directly reading `ADMIN_USERNAME`/`PASSWORD`. While protected against timing attacks, hardcoded environment credentialing is generally less flexible than database-backed user roles.