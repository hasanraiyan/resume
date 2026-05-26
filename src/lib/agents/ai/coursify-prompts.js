/**
 * Shared Coursify prompt templates
 * Used by both COURSIFY_SEARCH and COURSIFY_RESEARCH agents
 */

export const COURSIFY_MARKDOWN_FORMAT = `
## Coursify Markdown Format
All content must use ## [BlockType] headers. Generate blocks as required.

### Available Block Types and use this exact format for each some are in yaml format:

**## [MdBlock]**
Primary narrative text. Supports LaTeX math ($O(n \\log n)$), markdown tables, and Mermaid diagrams.
\`\`\`mermaid
graph TD
  A --> B
\`\`\`
IMPORTANT: For Mermaid diagrams, use only standard types (graph, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, gantt, pie, journey, gitGraph, mindmap). DO NOT hallucinate custom types like 'grid-layout'. Use markdown tables for grid structures.
For Mermaid diagrams, ALWAYS wrap node labels in double quotes.
Example:
A["Text"] --> B["More text"]

**## [StepByStepBlock]**
For processes, algorithms, sequential walkthroughs.
title: "Step Title"
showNumbering: true
- step: "Step Name"
  content: "Step details here. IMPORTANT: Do NOT repeat the 'Step Name' inside this content field. Can include mermaid: \\n\`\`\`mermaid\\\\ngraph LR\\\\n  A---B\\\\n\`\`\`"

**## [AccordionBlock]**
For FAQs, edge cases, supplementary info.
title: "Section Title"
- item: "Question or topic"
  content: "Detailed answer... IMPORTANT: Do NOT repeat the 'Question or topic' inside this content field."

**## [QuizBlock]**
Multiple choice questions (ALWAYS include at end).
- question: "Question text"
  type: "multiple_choice"
  options:
    - "Option A"
    - "Option B"
    - "Option C"
    - "Option D"
  correctAnswer: "Option A"
  explanation: "Why this is correct."
  points: 1

**## [CalloutBlock]**
Highlighted alert boxes. Types: info (blue), tip (green), warning (yellow), danger (red).
type: "tip"
title: "Pro Tip"
content: "Important thing to remember."

**## [TabsBlock]**
Side-by-side comparison or multi-language examples.
- tab: "JavaScript"
  content: "\`\`\`javascript\\\\nconsole.log('Hello');\\\\n\`\`\`"
- tab: "Python"
  content: "\`\`\`python\\\\nprint('Hello')\\\\n\`\`\`"

**## [ChartBlock]**
Data visualizations (bar, line, pie, radar, doughnut).
type: "bar"
title: "Chart Title"
description: "Subtitle"
data:
  labels: ["A", "B", "C"]
  datasets:
    - label: "Series 1"
      data: [10, 20, 15]
      color: "#1f644e"
options:
  showLegend: true
  showGrid: true
  beginAtZero: true

**## [TimelineBlock]**
Interactive chronological milestones, event streams, or lifecycles.
title: "Development Lifecycle"
timelineItems:
  - date: "Step 1"
    title: "Planning"
    icon: "play"
    content: "Establish baseline rules."
  - date: "Step 2"
    title: "Design"
    icon: "code"
    content: "Write beautiful components."

**## [VideoBlock]**
Embed relevant YouTube or educational videos.
title: "Video Title"
url: "https://www.youtube.com/watch?v=..."

## Quality Rules
- MANDATORY: If a [VideoBlock] is included, place it immediately AFTER the first introductory [MdBlock].
- MANDATORY: [VideoBlock] URLs MUST be direct links to a specific video (e.g., https://www.youtube.com/watch?v=...).
- MANDATORY: To find video URLs, you MUST call the **youtube_search** tool. Do NOT try to find videos via web search.
- FORBIDDEN: Do NOT use YouTube search result URLs (e.g., youtube.com/results?search_query=...). You MUST pick a specific video from tool results.
- MANDATORY: Use at least 5 different block types
- MANDATORY: End with a [QuizBlock] containing 3-5 questions
- MANDATORY: Include at least 2 [CalloutBlock]s (tips, warnings)
- Use [StepByStepBlock] for any process or algorithm
- Use [ChartBlock] when data or comparisons are involved
- Use [TimelineBlock] for timelines, histories, lifecycles, or chronological roadmap pathways.
- Use Mermaid diagrams in [MdBlock]s for visual concepts
- Cover the topic deeply and comprehensively
- Professional, academic tone — no fluff
- Separate each block with ---
- Use $...$ for inline LaTeX and $$...$$ for block/display LaTeX.
- Use only blocks that are necessary for the use case.
- DO NOT summarize or talk about your process. Just output markdown.

## Keyword Definitions (Interactive Learning)
- Use [keyword]{def="clear, concise definition"} syntax for important technical terms throughout content
- Keep definitions under 150 characters, plain text only (no markdown formatting)
- Add 3-5 key terms per major section for better learning
- Example: [Algorithm]{def="A step-by-step procedure for solving a problem or performing a computation"}
- Place keywords naturally in sentences where they're first introduced
- DO NOT define common words; focus on domain-specific or technical terms

## Reference System (Wikipedia-style) - MANDATORY
- Use inline citations with the exact syntax [^1], [^2], [^3] etc. within the text of ANY block.
- MANDATORY: Every major claim, statistic, or technical detail must be backed by a search result citation.
- MANDATORY: Provide the corresponding footnote definitions ONLY ONCE at the VERY END.
  [^1]: [Source Title](Source URL) - Brief description.
`;
