# Roadmap: Coursify Beta CLI (Decoupled & Standalone)

The "Beta" phase focuses on moving from an **Internal Tool** to a **Standalone Utility** for a small group of trusted authors. It prioritizes content velocity over complex infrastructure.

---

## Phase 1: The "Beta Core" (MVP)

_Goal: Enable authoring without the `resume` repo._

### 1. Simplified Auth (The "Developer Token")

- **Temporary Strategy**: Instead of full OAuth2, provide a "Developer API Key" in the user profile settings.
- **CLI Implementation**: `coursify auth --key <your-key>`.
- **Backend**: Update `requireAdminAuth` to recognize `X-Coursify-Key` headers for specific beta users.

### 2. Basic CRUD & Transports

- **Standalone Package**: Move `coursify.js` logic into a separate `beta-cli/` directory with its own `package.json`.
- **API-First**: All commands target `https://hasanraiyan.me/api/coursify/studio/*`.
- **Essential Commands**:
  - `coursify courses list`
  - `coursify sections get <id>`
  - `coursify sections upsert --file <content.md>`

### 3. The "Library" Validator (Local Linting)

- **Local Parsing**: Port the "Magic Block" parser to the CLI.
- **Linting**: Command to check for:
  - Heading level consistency (TOC safety).
  - Quiz structure validity.
  - Required block sequences.
- **Benefit**: Authors find errors _before_ they upload.

---

## Phase 2: Workflow Optimization (Beta v0.2)

_Goal: Make authoring feel professional._

### 1. Batch Sync (`sync --dir`)

- Scan a local directory for course content.
- Support a `course.json` or `module.json` manifest to define the hierarchy.
- Perform batch upserts with progress bars.

### 2. Interactive Scaffolding

- `coursify init-section --type [lab|lesson|intro]`: Generates a pre-filled Markdown file with the "Standardized Section Flow".

### 3. Quick Preview

- `coursify preview <file.md>`: Open a local browser tab with the rendered HTML of the section (using a local CSS-injected previewer).

---

## Phase 3: Transition to Stable (v1.0)

_Goal: Robustness and Public Distribution._

- **Auth Upgrade**: Move from API Keys to **OAuth2 Device Flow**.
- **Binary Distribution**: Use `pkg` to distribute as a single executable for Windows, macOS, and Linux.
- **Telemetry**: Add opt-in error reporting to catch parser bugs in the wild.

---

## Success Metrics for Beta

1.  **Repo-Independent**: An author can create a 5-section module without cloning the `resume` repo.
2.  **Zero DB Leaks**: No direct DB calls; 100% of data travels via HTTPS.
3.  **Low Latency**: Validation happens locally in <100ms.
