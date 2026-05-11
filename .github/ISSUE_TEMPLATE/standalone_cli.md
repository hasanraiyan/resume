name: "Standalone API-Driven Coursify CLI"
about: "Develop a decoupled, API-driven CLI that supports Bearer token authentication."
title: "[RFC] Standalone API-Driven Coursify CLI"
labels: ["enhancement", "cli", "security", "labels", "jules"
]
assignees: ""

---

## Problem Statement

The current `coursify-studio` CLI is tightly coupled to the codebase and requires direct database access. This restricts authoring to environments with full source code access and local `.env` secrets.

## Proposed Solution

Develop a standalone CLI (e.g., `@coursify/cli`) that communicates with the platform via the REST API using an **OAuth2 Device Flow**.

### Key Features

- [ ] **Auth Strategy**: Implement **OAuth2 Device Authorization Grant (RFC 8628)**.
  - `coursify login`: Generates a code and URL for browser-based authorization.
- [ ] **Decoupled Transport**: Use a standalone HTTP client (Axios/Undici) instead of internal `db-ops.js`.
- [ ] **Command Parity**: Full CRUD support for `courses`, `modules`, and `sections`.
- [ ] **Local Validation**: Port the Markdown "Magic Block" parser to the CLI for pre-upload linting.
- [ ] **Batch Sync**: Port the `sync --dir` logic for directory-based content management.
- [ ] **Distribution**: Distribute as a standalone NPM package or compiled binary.

## Technical Details

- **Language**: Node.js or Go.
- **API Target**: `https://hasanraiyan.me/api/coursify/*`
- **Config**: Store auth tokens and base URLs in `~/.coursifyrc`.

## Additional Context

This moves Coursify towards a "Content-as-a-Service" model, allowing authoring from any terminal.
