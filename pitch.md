# Pitch: Coursify

**Demo Video URL**: [Insert Demo Video Link Here - e.g., YouTube or Vercel URL]

### 1. Problem Statement

Online learning is currently fractured between two inadequate extremes. On one side, traditional MOOCs (like Udemy or Coursera) are static, rigid, and take months to update, making them obsolete for rapidly evolving technical subjects. On the other side, general AI chatbots provide fragmented, unstructured answers without pedagogical flow. When someone needs to learn a highly specific, complex topic—like advanced Low Level Design—they are forced to waste hours piecing together disparate blog posts, videos, and documentation. There is no middle ground offering instant, structured progression.

### 2. Innovation

Coursify is an AI-powered education engine that instantly replaces search-based learning with dynamic curriculum generation. We achieve this through a unified Deep Agent architecture powered by Anthropic's Claude.

**Deep Agent Core**: Instead of rigid, multi-agent handoffs, a single Deep Agent handles the entire educational lifecycle: structuring the syllabus, authoring deep technical content, and generating automated assessments.

**Custom MCP Server**: We built a specialized Model Context Protocol (MCP) server loaded with custom "Coursify skills." This gives the Claude-powered agent direct, secure access to our curriculum-building logic.

**Developer-Native Execution**: We treat course creation like software development. Our **@coursify/cli** enables a local-first workflow where technical content is authored in the IDE, version-controlled via Git, and synced instantly. Simultaneously, our **MCP Server** allows the Deep Agent to enter this developer environment, autonomously performing research, architecting complex curricula, and authoring high-fidelity technical content (Mermaid diagrams, LaTeX, and Magic Blocks) directly into the platform. This bridge allows experts and AI to collaborate where they work best: the terminal and the code editor.

### 3. Revenue Model

Coursify operates on a Freemium SaaS model:

- **Free Tier**: Allows users to generate basic, text-based single-module courses.
- **Pro Subscription ($10–$15/month)**: Unlocks complex, multi-module course generation, technical diagram synthesis, and advanced progress analytics.
- **B2B Enterprise (Future Expansion)**: API licensing for coding bootcamps, universities, and corporate training platforms to generate custom, on-demand curricula for their students and employees.

### 4. Target Audience

The initial wedge targets **Computer Science students and Software Developers**. This demographic constantly needs to upskill in niche, rapidly changing technologies (e.g., new web frameworks, system design patterns) and actively seeks efficient, structured learning paths over passive video consumption. As the platform scales, the audience expands to lifelong learners and professionals in any knowledge-worker industry requiring fast, structured upskilling.
