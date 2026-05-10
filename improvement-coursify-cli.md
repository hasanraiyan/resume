# Issue: Enhancing Coursify CLI for Production-Grade Authoring

## Overview

Based on the intensive integration and authoring of the 10-module RAG course, several key areas for improvement in the `coursify` CLI and its underlying `db-ops.js` logic have been identified. These enhancements focus on improving developer velocity, reducing state-related errors, and ensuring high-fidelity content rendering.

## Proposed Improvements

### 1. Robust ID Management & Slug-based Lookups

**Problem:** The CLI currently relies heavily on internal Database IDs. During long sessions, context drift often leads to "Resource not found" errors when IDs are miscopied or become stale.
**Solution:**

- Implement **Slug-based resolution**: Allow commands to accept slugs (e.g., `--course slug-name`) instead of just IDs.
- Add an `id-map` cache: A local temporary file that maps human-readable names to IDs during a session to reduce `courses get` round-trips.

### 2. "Dry-Run" & Parsing Preview Mode

**Problem:** Content rendering issues (like the recent escaping/unescaping bug or TOC heading levels) are only visible after a full database upsert and UI refresh.
**Solution:**

- Add a `--dry-run` or `coursify preview <file>` command.
- This should parse the Markdown "Magic Blocks" and output a structured JSON summary (or a mock HTML view) to verify that headings, Mermaid diagrams, and Quizzes are parsed correctly _before_ hitting the DB.

### 3. Batch Directory Synchronization

**Problem:** Updating a 54-section course currently requires 54 individual CLI calls.
**Solution:**

- Implement `coursify sections sync --dir <path>`.
- The CLI should scan a directory for files named like `01-title.md`, extract metadata from frontmatter, and perform batch upserts. This aligns better with Git-based content workflows.

### 4. High-Fidelity Block Templates

**Problem:** Creating complex blocks like `StepByStepBlock` or `QuizBlock` in raw Markdown is error-prone (literal `\n\n` requirements, specific indentations).
**Solution:**

- Add `coursify init-section --type [standard|lab|procedural]`.
- This would generate a scaffolded `.md` file with the "Standardized Section Flow" template already populated with Level 2/3 headings and block placeholders.

### 5. Integrated Validation & Linting

**Problem:** Non-standard heading levels (e.g., `#` instead of `##`) break the Table of Contents, and unquoted strings in YAML-like blocks can cause parser failures.
**Solution:**

- Build a "Linter" into the `upsert` command that checks:
  - Heading level consistency (TOC compatibility).
  - Mermaid syntax validity.
  - Quiz `correctAnswer` literal matching.
  - Image/Link accessibility.

### 6. Observability & Verbose Error Handling

**Problem:** "Section not found" or "Course not found" errors are currently generic.
**Solution:**

- Provide more context in error messages (e.g., "Section ID 'abc' not found in Course 'xyz'").
- Add a `--verbose` flag to log the raw JSON payload being sent to `db-ops.js` for easier debugging of parsing issues.

## Technical Debt to Address

- **Parser Hardening**: The current `unescapeString` logic in `utils.js` (fixed in this session) should be unit-tested against diverse Markdown inputs.
- **Connection Reliability**: Ensure `dbConnect.js` remains robust across diverse execution environments (CI vs Local vs Production).

## Impact

Implementing these features will transform the Coursify CLI from a basic DB wrapper into a powerful, professional IDE for technical instructional design.
