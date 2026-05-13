# Workflow: Adding a New Magic Block to Coursify

This guide outlines the complete process for extending Coursify with a new interactive "Magic Block". To ensure a block is a first-class citizen, it must be supported in the **Web UI (Reader & Studio)**, the **CLI Tool**, and the **Agent Skills**.

---

## Phase 1: Core Logic & Configuration

### 1. Register the Block

Add your new block name to the central registry. This enables the frontend to recognize it.

- **File:** `src/config/coursify-blocks.js`
- **Action:** Add your block name (e.g., `CodeSandboxBlock`) to the `SUPPORTED_BLOCKS` array.

### 2. Update the Parser

The parser is responsible for converting Markdown to JSON (for the database/UI) and back.

- **File:** `src/utils/coursify-parser.js`
- **Action 1:** Update the local `SUPPORTED_BLOCKS` array inside `parseMarkdownToBlocks`.
- **Action 2:** In `parseMarkdownToBlocks`, add an `else if (m.type === 'YourBlock')` branch to handle your specific Markdown syntax (YAML-like fields or custom splitting).
- **Action 3:** In `generateMarkdownFromBlocks`, add logic to serialize your block's data back into the standard Markdown format.

### 3. Update Table of Contents (TOC)

Ensure the block appears correctly in the sidebar navigation.

- **File:** `src/hooks/coursify/useTableOfContents.js`
- **Action:** Add your block type to the regex and the display name mapping logic.

### 4. Update Data Normalization

Ensure the block's data is correctly passed to the Studio.

- **File:** `src/lib/mcp/coursify/utils.js`
- **Action:** Update the `normalizeSection` function to include any new fields your block introduces (e.g., `items`, `showNumbering`) in the `blocks.map` logic. This prevents the API from stripping these fields when serving the Studio.

---

## Phase 2: Web Implementation (UI)

### 5. Create the Component

Build the interactive React component for the course reader.

- **Location:** `src/components/coursify/reader/`
- **File:** `YourBlock.js`
- **Requirement:** Export a functional component that accepts a `block` prop. Use `framer-motion` for animations to match the platform's feel.

### 6. Register in Renderer

Connect your component to the main block dispatcher.

- **File:** `src/components/coursify/reader/CoursifyBlockRenderer.js`
- **Action:** Import your new component and add a case for it in the `switch` statement inside `CoursifyBlockRenderer`.

### 7. Update the Studio (Visual Editor)

Enable authors to manage the block via the visual UI.

- **File:** `src/components/coursify/EditSectionModal.js`
- **Action 1:** Add the block to `BLOCK_TYPES` with a suitable `lucide-react` icon.
- **Action 2:** Initialize default data for the block in the `addBlock` function.
- **Action 3:** Implement the editing UI (inputs, textareas, etc.) inside the `blocks.map` section.

---

## Phase 3: Tooling & AI Support

### 8. CLI Validation

Ensure the CLI validator doesn't flag your new block as "unknown".

- **File:** `packages/coursify-cli/src/validator.js`
- **Action:** Add your block name to the `SUPPORTED_BLOCKS` array inside the `validateCourse` function.

### 9. CLI Scaffolding

Update the default section template to include your new block as an example.

- **File:** `packages/coursify-cli/src/scaffold.js`
- **Action:** Add an example snippet of your block's Markdown syntax to the `scaffoldSection` content string.

### 10. Agent Skills (AI Authoring)

Teach AI agents how to author your new block.

- **Files:**
  - `.agent/skills/coursify-studio/references/schemas.md` (Add technical schema/syntax)
  - `.agent/skills/coursify-studio/references/demo-data.md` (Add a realistic example)
  - `.agent/skills/coursify-studio/SKILL.md` (Add a brief description in the block list)
- **Note:** Mirror changes in `.claude/skills/coursify-studio/SKILL.md` if applicable.

---

## Phase 4: Release

### 11. Increment Version

Prepare the CLI for update.

- **File:** `packages/coursify-cli/package.json`
- **Action:** Increment the version number (e.g., `1.1.2` -> `1.1.3`).
- **File:** `packages/coursify-cli/bin/coursify.js`
- **Action:** Update the hardcoded `.version()` string.

---

## Summary Checklist

- [ ] Registered in `config/coursify-blocks.js`
- [ ] Parser support in `utils/coursify-parser.js`
- [ ] TOC support in `hooks/coursify/useTableOfContents.js`
- [ ] Data normalization in `lib/mcp/coursify/utils.js`
- [ ] Reader component in `components/coursify/reader/`
- [ ] Integrated in `components/coursify/reader/CoursifyBlockRenderer.js`
- [ ] Editor UI in `components/coursify/EditSectionModal.js`
- [ ] CLI validation in `packages/coursify-cli/src/validator.js`
- [ ] CLI scaffold in `packages/coursify-cli/src/scaffold.js`
- [ ] Agent documentation in `.agent/skills/`
- [ ] CLI version incremented
