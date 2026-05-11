# Design: Standalone API-Driven Coursify CLI (v2)

## Goal

Transform the internal `coursify-studio` scripts into a **standalone CLI application** that can be used by authorized authors without access to the `resume` repository or direct database credentials.

---

## 1. Authentication Architecture (OAuth2 Device Flow)

For a CLI, the **Device Authorization Grant (RFC 8628)** is the most user-friendly and secure method.

### The Flow:

1.  **Initiation**: User runs `coursify auth login`.
2.  **Device Request**: CLI sends a request to `POST /api/coursify/auth/device`.
3.  **User Verification**: CLI displays a short code (e.g., `ABCD-1234`) and a URL (e.g., `https://hasanraiyan.me/activate`).
4.  **Browser Authorization**: User visits the URL, logs in (if not already), and enters the code.
5.  **Polling**: CLI polls `POST /api/coursify/auth/token` every few seconds.
6.  **Token Issuance**: Once the user authorizes, the server returns an **Access Token** (JWT) and a **Refresh Token**.
7.  **Storage**: CLI stores these in `~/.coursify/auth.json` with restricted permissions.

---

## 2. CLI Command Structure

The CLI will be structured for professional instructional design workflows.

### Core Commands

- `coursify login`: Initialize the OAuth device flow.
- `coursify logout`: Clear local session.
- `coursify whoami`: Display current authorized user and status.

### Resource Management (API-First)

- `coursify courses [list|get|create|update|delete]`
- `coursify modules [list|get|create|update|delete]`
- `coursify sections [list|get|create|update|delete]`

### Authoring Power Tools

- `coursify validate <file.md>`: Lint a Markdown file locally against Coursify "Magic Block" standards before uploading.
- `coursify sync <directory>`: **Batch Upload**. Scan a directory, parse frontmatter/magic-blocks, and upsert all resources.
- `coursify preview <file.md>`: Generate a temporary local HTML preview of the section.

---

## 3. Distribution & Standalone Nature

### Zero Dependency on Source Code

- The CLI will be a compiled Node.js binary (using `pkg`) or a distributed NPM package (`@coursify/cli`).
- It will NOT import `db-ops.js`. Instead, it will use a thin HTTP client (e.g., `axios` or `undici`) to communicate with the platform.

### Local Configuration

- Store settings (base URL, preferences) and auth tokens in a dedicated config directory.
- Support environment variables (e.g., `COURSIFY_TOKEN`) for CI/CD environments.

---

## 4. Required Backend Updates

To support the standalone CLI, the following must be implemented in the `resume` repo:

1.  **Auth Routes**:
    - `POST /api/coursify/auth/device`: Issue device codes.
    - `POST /api/coursify/auth/token`: Issue tokens after polling.
    - `GET /activate`: Web interface for code entry.
2.  **Studio API Layer**:
    - Wrap the existing `db-ops.js` logic in auth-protected API routes under `src/app/api/coursify/studio/*`.
    - Ensure `requireAdminAuth` correctly validates CLI-issued JWTs.

---

## 5. Success Roadmap

1.  [ ] **Phase 1**: Expose `courses`, `modules`, and `sections` via authenticated REST endpoints.
2.  [ ] **Phase 2**: Implement the OAuth2 Device Flow in the backend.
3.  [ ] **Phase 3**: Build the minimal standalone CLI client with `login` and `list` commands.
4.  [ ] **Phase 4**: Port the `sync` and `validate` logic to the new CLI.
5.  [ ] **Phase 5**: Package and distribute the CLI.
