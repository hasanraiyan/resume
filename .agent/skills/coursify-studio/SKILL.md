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

### Planning a New Course

- Define clear `learningGoals` at the section level.
- Organize content into `CoursifyModule` groups for better structure.
- Assign appropriate `difficulty` and `tags` for search optimization.

### Authoring Content

- **Text**: Use `MdBlock` with clear hierarchy (H1, H2, H3).
- **Interactive**: Always include a `QuizBlock` to reinforce learning.
- **Videos**: Embed relevant YouTube/GDrive content via `VideoBlock`.

### Managing Publication

- Use `status: 'complete'` only when the content is polished.
- Remember: A section is hidden if its parent module or course is not yet published.
- Use `authoringStatus` on the Course model to track the internal production lifecycle.

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
