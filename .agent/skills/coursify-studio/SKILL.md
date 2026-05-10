---
name: coursify-studio
description: Specialized instructional design and course authoring for the Coursify platform. Use when creating, updating, or planning courses, modules, and sections, ensuring high-quality pedagogical structure and hierarchical publication logic.
---

# Coursify Studio

This skill transforms ai agent into a specialized Instructional Design Agent for the Coursify platform.

## Quick Start

1. **Understand the Domain**: Review [schemas.md](references/schemas.md) for database models and block types.
2. **Follow Best Practices**: Use the high-quality section design outlined in [workflows.md](references/workflows.md).
3. **Respect Publication Rules**: Always ensure the hierarchical visibility logic is maintained.

## Core Procedures

### Planning & Progress Tracking

- **Discovery**: Always call `courses list` first to avoid duplicates.
- **ID Synchronization**: Before updating any existing module or section, call `courses get <id>` or a specific list command to ensure you have the most current Database IDs. Stale context is the #1 cause of "Resource not found" errors.
- **Scratchpad**: Use the `agentNotes` field via `courses upsert` as your session scratchpad. Store current state (which module/section is next, decisions made, tasks remaining) to survive session interruptions.

### Authoring Content (The Quality Bar)

Follow the **Standardized Section Flow** in [pedagogy.md](references/pedagogy.md).

- **Depth**: Lessons must be **500-1200 words**. Be thorough and technical.
- **TOC Compatibility**: Use `##` for primary headings and `###` for secondary headings within `MdBlock`.
- **Procedural Content**: **Mandatory usage** of `StepByStepBlock` for all setups and workflows.
- **Architectural Clarity**: Use Mermaid `graph TD/LR` to visualize any multi-stage logic, data flows, or system architectures.
- **Interactivity**: Always end with a `QuizBlock` (3-5 questions). Use literal text mapping for `correctAnswer`.
- **Magic Blocks**: Start files with `## [MdBlock]`. Use `## [BlockType]` headers for all transitions.

### Managing Publication

- Use `status: 'complete'` only when the content is polished.
- Remember: A section is hidden if its parent module or course is not yet published.
- Use `authoringStatus` on the Course model to track the internal production lifecycle.

## Troubleshooting

- **Thumbnail Generation Failure**: If you see `Error: Agent class must extend BaseAgent`, this is a non-fatal error in the backend agent registry. The course and its content will still be created successfully.
- **Missing Blocks**: Ensure every block starts with the `## [BlockType]` header. If a block is missing from the DB after an upsert, check the header syntax.

## Scripts & Utilities

### Bundled CLI Tool: `coursify.js`

The skill includes a deterministic CLI script to manage content directly. Use it via `node` from the workspace root:

```bash
# List all courses
node .agent/skills/coursify-studio/scripts/coursify.js courses list

# Get full course content
node .agent/skills/coursify-studio/scripts/coursify.js courses get <id>

# Upsert a section
node .agent/skills/coursify-studio/scripts/coursify.js sections upsert --courseId="..." --title="New Lesson" --status="complete"
```

- **Logic Layer**: The CLI tool wraps `src/lib/coursify/db-ops.js` to ensure consistent side-effects.
- **Transports**: This is the primary tool for Gemini CLI when performing complex database operations.
