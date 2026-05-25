'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import { SafeBlockRenderer } from '@/components/coursify/SafeBlockRenderer';

const DEMO_CONTENT = `---
title: "Coursify Interactive Blocks Demo"
description: "High-fidelity rendering demonstration of all available blocks in the platform."
learningGoals:
  - "Demonstrate visual and behavioral block extensions"
estimatedDuration: "10 mins"
status: "published"
order: 1
---

## [MdBlock]
### 1. Markdown Block & Rich Typography
This is a standard **[MdBlock]** that serves as the foundation for narratives, definitions, and technical explanations. It supports full typography, inline math formulas like $f(x) = x^2 + 2x + 1$, and block-level LaTeX calculations:

$$
\\sigma = \\sqrt{\\frac{1}{N} \\sum_{i=1}^{N} (x_i - \\mu)^2}
$$

It also supports inline [keyword definitions]{def="Hoverable terms that show a quick, elegant explanation tooltip on desktop or modal on mobile"} for technical terms like [Big-O notation]{def="A mathematical notation that describes the limiting behavior of a function when the argument tends towards a particular value or infinity"} and links to external sources[^1].

---

## [MdBlock]
### 2. Native Mermaid Architecture Diagrams
You can write code blocks with the \`mermaid\` language to automatically render interactive, zoomable, and pannable diagrams:

\`\`\`mermaid
graph TD
    A[Client User] -->|1. HTTP Request| B(Next.js App Router)
    B -->|2. Query Mongoose| C{MongoDB Database}
    C -->|3. Return Doc| B
    B -->|4. HTML Stream| A
\`\`\`

---

## [CalloutBlock]
type: "tip"
title: "Pro-Tip: Leverage LaTeX & Footnotes"
content: "You can write full [Markdown]{def=\"A lightweight markup language with plain-text-formatting syntax\"} syntax inside Callout Blocks, including inline math like $O(1)$ and hoverable citations[^2]."

---

## [CalloutBlock]
type: "warning"
title: "Action Required: Check console"
content: "Make sure you run \`pnpm dev\` before trying to edit sections in the visual studio editor."

---

## [TabsBlock]
- tab: "JavaScript"
  content: "\`\`\`javascript\n// Copy me to check out the premium clipboard toggle!\nconst greet = function(name) { return 'Hello, ' + name + '!'; };\nconsole.log(greet('Coursify'));\n\`\`\`"
- tab: "Python"
  content: "\`\`\`python\n# Premium OS detection will pre-select matching OS tabs!\ndef greet(name):\n    return 'Hello, ' + name + '!'\n\nprint(greet('Coursify'))\n\`\`\`"

---

## [ChartBlock]
type: "bar"
title: "Algorithm Performance Comparisons"
description: "Relative execution duration in milliseconds (lower is better)[^3]."
data:
  labels: ["100 items", "1,000 items", "10,000 items"]
  datasets:
    - label: "Bubble Sort"
      data: [15, 1200, 95000]
      color: "#e74c3c"
    - label: "Quick Sort"
      data: [0.5, 4.5, 42.0]
      color: "#1f644e"
options:
  showLegend: true
  showGrid: true
  footer: "Click on Line or Pie above to toggle the representation dynamically, or expand the data grid below."

---

## [TimelineBlock]
title: "Block Implementation Roadmap"
timelineItems:
  - date: "Phase 1"
    title: "Planning & Architecture"
    icon: "layers"
    content: "Establish central config in \`coursify-blocks.js\` and model fields."
  - date: "Phase 2"
    title: "Core Parser Integration"
    icon: "code"
    content: "Write parsing rules for YAML-based arrays inside [coursify-parser.js](file:///D:/projects/resume/src/utils/coursify-parser.js)."
  - date: "Phase 3"
    title: "Web Component Rendering"
    icon: "play"
    content: "Create interactive visual interfaces using \`framer-motion\` for fluid milestones."
  - date: "Phase 4"
    title: "Studio & CLI Tooling"
    icon: "check"
    content: "Inject editor modals in [EditSectionModal.js](file:///D:/projects/resume/src/components/coursify/EditSectionModal.js) and add support to CLI validators."

---

## [StepByStepBlock]
title: "How to Scaffold Sections"
- step: "1. Navigate to Course Folder"
  content: "Use your terminal to navigate inside the initialized course workspace."
- step: "2. Execute Section Command"
  content: "Run the CLI tool scaffold command: \`coursify init-section 'My New Lesson'\`"
- step: "3. Customize Scaffolded Markdown"
  content: "Open the created \`data.md\` file and customize your blocks."

---

## [AccordionBlock]
title: "Frequently Asked Questions"
- item: "Is everything local-first?"
  content: "Yes! All courses can be completely authored, scaffolded, and validated offline via the CLI before publishing to the server."
- item: "Are interactive features backward-compatible?"
  content: "Absolutely. All blocks are designed to degrade gracefully (falling back to simple markdown renders or returning safely) if viewed on older clients."

---

## [QuizBlock]
title: "Test Your Understanding"
- question: "Which block is best suited for visual comparisons or data metrics?"
  type: "multiple_choice"
  options:
    - "[MdBlock]"
    - "[ChartBlock]"
    - "[StepByStepBlock]"
    - "[AccordionBlock]"
  correctAnswer: "[ChartBlock]"
  explanation: "[ChartBlock] renders dynamic Chart.js visualizations (bar, line, pie) and includes accessible fallback grids."
  points: 1
- question: "True or False: TimelineBlock content fields support custom Markdown and footnotes."
  type: "true_false"
  options:
    - "True"
    - "False"
  correctAnswer: "True"
  explanation: "TimelineBlock milestones are parsed with footnote support and rendered natively using MarkdownRenderer."
  points: 1

---

## [VideoBlock]
title: "Introduction to Next.js App Router Architecture"
url: "https://www.youtube.com/watch?v=R9Z_b90S4sQ"

---

## [ResourceBlock]
title: "Supplementary Materials & Guides"
url: "https://hasanraiyan.me/projects/resume"
type: "doc"

---

[^1]: [Next.js Documentation](https://nextjs.org) - Official Next.js framework tutorials.
[^2]: [LaTeX Syntax Guide](https://en.wikibooks.org/wiki/LaTeX/Mathematics) - Detailed guide for formatting algebraic equations in LaTeX.
[^3]: [Big-O Cheat Sheet](https://www.bigocheatsheet.com) - Time complexity cheat sheets for sorting algorithms.
`;

export default function CoursifyDemoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      {/* Back to Portal Header */}
      <div className="mb-8">
        <Link
          href="/coursify"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7c8e88] hover:text-[#1f644e] transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Courses
        </Link>
      </div>

      {/* Hero Badge */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="h-12 w-12 rounded-2xl bg-[#f0f5f2] border border-[#1f644e]/20 text-[#1f644e] flex items-center justify-center mb-4 shadow-sm animate-bounce">
          <Sparkles className="w-5 h-5" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1e3a34] tracking-tight leading-none mb-3">
          Coursify Interactive Blocks
        </h1>
        <p className="text-sm md:text-base text-[#7c8e88] max-w-xl">
          High-fidelity demo page showcasing all 10 interactive block types supported in the
          Coursify e-learning framework.
        </p>
      </div>

      {/* Content Renderer */}
      <div className="bg-white border border-[#e5e3d8]/80 rounded-[32px] p-6 md:p-10 shadow-sm relative overflow-visible">
        <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f5f2] text-[10px] font-bold text-[#1f644e] border border-[#1f644e]/10 select-none uppercase tracking-wider">
          <BookOpen className="w-3 h-3" />
          Interactive Demo
        </div>

        <SafeBlockRenderer content={DEMO_CONTENT} isComplete={true} />
      </div>
    </div>
  );
}
