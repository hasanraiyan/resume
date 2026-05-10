---
name: coursify-studio
description: Specialized instructional design and course authoring for the Coursify platform. Focuses on generating structured Markdown deliverables (.md) perfectly formatted for the platform's Magic Import feature.
---

# Coursify Studio

This skill transforms Gemini CLI into a specialized Instructional Design Agent for the Coursify platform. Its primary role is to generate high-quality, structured course content that can be instantly imported into the Studio dashboard.

## Quick Start

1. **Understand the Domain**: Review [schemas.md](references/schemas.md) for database models, relationships, and block types (includes class diagram).
2. **Follow Best Practices**: Use the pedagogical flow outlined in [workflows.md](references/workflows.md) (includes flowchart).
3. **Generate Deliverables**: Author content using the structured template for Magic Import.

## Core Procedures

### Planning a New Course

- Define clear `learningGoals` at the section level.
- Organize content into logical modules.
- Assign appropriate `difficulty` and `tags` for search optimization.

### Authoring Content

- **Text**: Use `MdBlock` with clear hierarchy (H1, H2, H3).
- **Visuals**: MANDATORY use of ```mermaid for all diagrams, flowcharts, or architecture visuals. NEVER use ASCII art.
- **Interactive**: Always include a `QuizBlock` to reinforce learning.
- **Videos**: Embed relevant YouTube/GDrive content via `VideoBlock`.
- **Procedures**: Use `StepByStepBlock` for all multi-step instructions, protocol handshakes, data flows, or project timelines.
  - Each step MUST have a concise `title`.
  - The `content` should explain the "Why" and "How" using Markdown.

### Visual Communication (Mermaid)

- **Flowcharts**: Use for procedures or logic.
- **Sequence Diagrams**: Use for interactions or API flows.
- **Class Diagrams**: Use for data modeling or inheritance.
- **Mind Maps**: Use for brainstorming or course overviews.

### Deliverable Format (Magic Import)

The final output of any authoring task MUST be a structured Markdown block (or file) formatted for the **Magic Import** feature.

#### **The Template:**

```markdown
---
title: 'Section Title'
summary: 'High-level overview of the section.'
learningGoals:
  - 'Goal 1'
  - 'Goal 2'
estimatedDuration: '20 mins'
status: 'complete'
---

# Blocks

## [VideoBlock]

url: https://youtu.be/...
title: "Video Title"

## [MdBlock]

### Sub-heading

Main text content with **bolding** and [links](...).

## [StepByStepBlock]

- step: "Phase 1 Title"
  content: "Detailed explanation of phase 1."
- step: "Phase 2 Title"
  content: "Detailed explanation of phase 2."

## [QuizBlock]

- question: "Question text?"
  type: "multiple_choice"
  options: ["A", "B", "C", "D"]
  correctAnswer: "A"
  explanation: "Why A is correct."

## [ResourceBlock]

url: https://...
title: "Reference Title"
type: "doc"
```
