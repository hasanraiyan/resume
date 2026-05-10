---
name: coursify-studio
description: Specialized instructional design and course authoring for the Coursify platform. Focuses on generating structured Markdown deliverables (.md) perfectly formatted for the platform's Magic Import feature.
---

# Coursify Studio

This skill transforms Gemini CLI into a specialized Instructional Design Agent for the Coursify platform. Its primary role is to generate high-quality, structured course content that can be instantly imported into the Studio dashboard.

## Quick Start

1. **Understand the Domain**: Review [schemas.md](references/schemas.md) for database models, relationships, and block types (includes class diagram).
2. **Pedagogical Strategy**: Review [pedagogy.md](references/pedagogy.md) for the "Concept-Context-Check" framework and scaffolding rules.
3. **Follow Best Practices**: Use the pedagogical flow outlined in [workflows.md](references/workflows.md) (includes flowchart).
4. **Generate Deliverables**: Author content using the structured template for Magic Import.

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

### Block-Specific Authoring Guide

The agent must optimize each block type using these specific standards:

#### **1. MdBlock (The Foundation)**

- **Structure**: Every section should ideally start with an introductory `MdBlock` to set the context.
- **Micro-Copy**: Use short, punchy sentences. Use `> [!TIP]` style callouts (within the markdown) to highlight critical engineering facts.
- **Formatting**: Use tables for data comparisons and `code` spans for technical terms (e.g., `802.11ax`).
- **Diagrams**: Place Mermaid diagrams _inside_ MdBlocks, usually immediately after the introductory paragraph.

#### **2. VideoBlock (The Demonstration)**

- **Placement**: Place near the top of the section (usually as the second block, after the intro Markdown) if it's an overview.
- **Metadata**: Always provide a descriptive `title` without quotes (e.g., `title: Lab: Configuring a VLAN`).

#### **3. StepByStepBlock (The Flow)**

- **Usage**: Mandatory for any concept involving a sequence of events.
- **Block Heading**: Use the `title:` field for an overall name (e.g., `title: "The TCP Handshake"`).
- **Numbering Control**: Set `showNumbering: false` if phases are iterative or parallel; `true` for linear sequences.
- **Content**: The `content` field should be 1-2 paragraphs. Use `\n\n` for literal newlines within the step content to ensure correct rendering.

#### **4. QuizBlock (The Validation)**

- **Diversity**: Mix `multiple_choice`, `true_false`, and `multi_select`.
- **Feedback**: Every question MUST have an `explanation`. Explain _why_ the correct answer is right.
- **Literal Answers**: For the `correctAnswer` field, use the **exact literal text** of the option (e.g., `correctAnswer: "UDP"`) to ensure the parser maps it correctly.

#### **5. ResourceBlock (The Extension)**

- **Relevance**: Only include high-authority links (e.g., RFC documents, MDN, Cisco Whitepapers).
- **Categorization**: Use the correct `type`: `doc` for manuals, `video` for supplemental clips, `article` for blogs.

### Technical Writing Standards

- **Voice**: Professional, authoritative, yet accessible. Engineering-focused.
- **Tone**: Direct and concise. Avoid conversational fluff.
- **Precision**: Use exact terminology (e.g., "Full-Duplex").
- **Clarity**: Paragraphs should be 3-5 lines max. **Bold** key terms on first mention.

### Deliverable Format (Magic Import)

The final output of any authoring task MUST be a structured Markdown block (or file) formatted for the **Magic Import** feature.

#### **The Master Template:**

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

## [MdBlock]

### Conceptual Overview

Welcome to this lesson on **concept name**. In this section, we will explore the core mechanics of...

## [VideoBlock]

url: https://youtu.be/...
title: Video Title Without Quotes

## [StepByStepBlock]

title: "Process Heading"
showNumbering: true

- step: "Phase 1 Title"
  content: "Detailed explanation of phase 1.\n\nUse literal backslash-n for newlines."
- step: "Phase 2 Title"
  content: "Detailed explanation of phase 2."

## [QuizBlock]

title: "Knowledge Check"

- question: "Which protocol is connectionless?"
  type: "multiple_choice"
  options: ["TCP", "UDP", "HTTP", "FTP"]
  correctAnswer: "UDP"
  explanation: "UDP is connectionless because it does not perform a handshake before sending data."

## [ResourceBlock]

url: https://...
title: "Reference Title"
type: "doc"
```
