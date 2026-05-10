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

- **Structure**: Start with an `###` H3 header for the block's main topic.
- **Micro-Copy**: Use short, punchy sentences. Use `> [!TIP]` style callouts (within the markdown) to highlight critical engineering facts.
- **Formatting**: Use tables for data comparisons and `code` spans for technical terms (e.g., `802.11ax`).
- **Diagrams**: Place Mermaid diagrams _inside_ MdBlocks, usually immediately after the introductory paragraph.

#### **2. VideoBlock (The Demonstration)**

- **Placement**: Place near the top of the section if it's an overview, or immediately after a complex `MdBlock` if it's a specific demonstration.
- **Metadata**: Always provide a descriptive `title` (e.g., "Lab: Configuring a VLAN").

#### **3. StepByStepBlock (The Flow)**

- **Usage**: Mandatory for any concept involving a sequence of events.
- **Atomicity**: Each step must represent one discrete action or state.
- **Content**: The `content` field should be 1-2 paragraphs max. Use it to explain the "internal mechanics" of that specific step.
- **Example**: Use for "The 4-Step DHCP Handshake" or "Building a Cat6 Cable."

#### **4. QuizBlock (The Validation)**

- **Diversity**: Mix `multiple_choice` (conceptual) with `true_false` (fact-checking).
- **Feedback**: Every question MUST have an `explanation`. Do not just say "Correct"; explain _why_ the concept works that way.
- **Points**: Standardize to `1` point for standard questions, `2` for complex calculations.

#### **5. ResourceBlock (The Extension)**

- **Relevance**: Only include high-authority links (e.g., RFC documents, MDN, Cisco Whitepapers).
- **Categorization**: Use the correct `type`: `doc` for manuals, `video` for supplemental clips, `article` for blogs.

### Technical Writing Standards

- **Voice**: Maintain a professional, authoritative, yet accessible voice. Use "we" or "let's" to create a collaborative learning environment.
- **Precision**: Use exact terminology (e.g., "Full-Duplex" instead of "Two-way").
- **Clarity**: Keep paragraphs short (3-5 lines). Use **bolding** for key terms on first mention.
- **Tone**: Engineering-focused. Avoid excessive fluff or conversational filler.

### Deep Learning Patterns (Pedagogy)

The agent must implement these patterns from [pedagogy.md](references/pedagogy.md):

- **Concept-Context-Check**: Each major concept should be followed by a demo and a quick assessment.
- **Scaffolding**: Always link the current section's concepts to those learned in the previous section.
- **Visual Mental Maps**: Use Mermaid diagrams early in a section to provide a structural overview.

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
