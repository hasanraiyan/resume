# Coursify AI Agent Guidelines (SOP)

Welcome! If you are a new AI session reading this file, your primary directive is to architect, author, and validate highly professional university-level courses using the **Coursify Framework**.

## 1. Our Objective & Pedagogical Standard

We build deeply academic, highly engaging courses that target specific **Previous Year Questions (PYQs)** for exams.

- **Rule 1:** Content must be highly structured and visual. Never rely on giant walls of text.
- **Rule 2:** We seamlessly integrate PYQ concepts into the text, but **WE NEVER USE RAW EXAM TAGS** (e.g., never write `[2024 Q3b PYQ Target]`). Professional tone is mandatory.
- **Rule 3:** Heavy use of numerical traces and Mermaid diagrams is expected for complex topics (like algorithms or system design).

---

## 2. The Coursify Block Types

All course content must be placed in `data.md` files. These files are strictly parsed by the Coursify framework using specific `## [BlockName]` headers. We currently support 8 block types:

### A. `## [MdBlock]`

- **Usage:** Primary narrative text, introductory concepts, tables, and standard markdown.
- **Capabilities:** Fully supports LaTeX math bounds (e.g., $O(n \log n)$), tables, and bolded keywords.

### B. `## [StepByStepBlock]`

- **Usage:** Mandatory for all numerical walkthroughs, algorithm traces, or sequential logic.
- **Format:** (Must follow strict YAML spacing)

````yaml
title: "Trace: Dijkstra's Algorithm"
showNumbering: true

- step: "Initialization"
  content: "Set all distances to infinity."
- step: "Iteration 1"
  content: "You can even embed ```mermaid\ngraph LR\n A---B\n``` diagrams perfectly within this string!"
````

### C. `## [AccordionBlock]`

- **Usage:** For secondary narrative content, edge-cases, or "Frequently Asked Questions" at the end of a module to prevent bloating the main text.
- **Format:**

```yaml
title: "Common Questions"

- item: "Why do we drop constants in Big-O?"
  content: "Because as N approaches infinity, the constants become mathematically insignificant."
```

### D. `## [QuizBlock]`

- **Usage:** Placed near the end of a file to test the student. We usually put the PYQ Multiple Choice Questions here.
- **Note:** Every item MUST include `type: "multiple_choice"` — the Coursify parser requires this field.
- **Format:**

```yaml
- question: 'Which algorithm finds the shortest path?'
  type: 'multiple_choice'
  options:
    - 'BFS'
    - 'Dijkstra'
  correctAnswer: 'Dijkstra'
  explanation: 'Dijkstra handles weighted graphs perfectly.'
  points: 1
```

### E. `## [ResourceBlock]`

- **Usage:** Links to external visualizers or YouTube videos.
- **Format:**

```yaml
- title: 'Algorithm Visualizer'
  url: 'https://visualgo.net'
  type: 'web'
```

### F. `## [VideoBlock]`

- **Usage:** Embeds external video lectures or tutorials seamlessly into the course timeline.
- **Format:**

```yaml
title: 'Introduction to the Course'
video:
  url: 'https://youtube.com/watch?v=...'
  title: 'Welcome to React'
  platform: 'youtube'
```

### G. `## [TabsBlock]`

- **Usage:** Allows you to group alternative or related content into horizontal, clickable tabs. Use max of 5 tabs. If more views are needed, split into multiple TabsBlocks. Use for:
  - **Multi-Language Examples:** When showing the same algorithm or concept in different programming languages.
  - **Environment Setup:** When giving installation instructions for different operating systems.
  - **Alternative Approaches:** When comparing two different solutions to the same problem.
- **Note:** Content strings support \n```mermaid syntax for diagrams inside tabs.
- **Format:**

````yaml
- tab: 'JavaScript'
  content: "```javascript\nconsole.log('Hello');\n```"
- tab: 'Python'
  content: "```python\nprint('Hello')\n```"
````

### H. `## [CalloutBlock]`

- **Usage:** Renders a highlighted, colored alert box with an icon to draw the reader's attention to something specific.
  - `info` (Blue): General information, historical context, or trivia.
  - `tip` (Green): Best practices, exam strategies, clever shortcuts, or performance tips.
  - `warning` (Yellow): Common exam traps, "gotchas", interview traps.
  - `danger` (Red): Critical warnings, deprecations, or things that will break code.
- **Format:**

```yaml
type: 'warning'
title: 'Common Gotcha'
content: 'Do not mutate state directly in React! Always use the setState function or your UI will not re-render.'
```

### I. `## [ChartBlock]`

- **Usage:** Renders interactive data visualizations (bar, line, pie, radar, etc.) to illustrate trends, comparisons, or distributions.
- **Supported Types:** `bar`, `line`, `pie`, `doughnut`, `polarArea`, `radar`, `scatter`, `bubble`
- **Basic Format:**

```yaml
type: 'bar'
title: 'Chart Title'
description: 'Optional subtitle'
data:
  labels: ['Q1', 'Q2', 'Q3', 'Q4']
  datasets:
    - label: 'Series 1'
      data: [12000, 15000, 13500, 18000]
      color: '#1f644e'
    - label: 'Series 2'
      data: [8000, 9000, 8500, 9500]
      color: '#e74c3c'
options:
  showLegend: true
  showGrid: true
  beginAtZero: true
  stacked: false
  footer: 'Optional source note'
```

- **All Available Options:**
  - `showLegend` (bool): Display legend (default: true)
  - `showGrid` (bool): Display grid lines (default: true)
  - `beginAtZero` (bool): Force Y-axis to start at zero (default: true)
  - `stacked` (bool): Stack datasets (default: false)
  - `fill` (bool): Fill area under line (default: false)
  - `indexAxis` (string): Set to `"y"` for horizontal bars (default: `"x"`)
  - `footer` (string): Small note displayed below chart

#### Complete Examples for All Chart Types

**Bar Chart (Vertical)**

```yaml
## [ChartBlock]
type: 'bar'
title: 'Quarterly Revenue'
description: 'Revenue and costs comparison across quarters'
data:
  labels: ['Q1', 'Q2', 'Q3', 'Q4']
  datasets:
    - label: 'Revenue'
      data: [12000, 15000, 13500, 18000]
      color: '#1f644e'
    - label: 'Costs'
      data: [8000, 9000, 8500, 9500]
      color: '#e74c3c'
options:
  showLegend: true
  showGrid: true
  beginAtZero: true
  stacked: false
  footer: 'Source: Internal data 2025'
```

**Bar Chart (Horizontal)**

```yaml
## [ChartBlock]
type: 'bar'
title: 'Satisfaction Scores'
description: 'Customer satisfaction by department'
data:
  labels: ['Support', 'Speed', 'UX', 'Value']
  datasets:
    - label: 'Score'
      data: [4.2, 3.8, 4.5, 4.0]
      color: '#4a90d9'
options:
  indexAxis: 'y'
  showGrid: false
  beginAtZero: true
  footer: 'Out of 5.0'
```

**Bar Chart (Stacked)**

```yaml
## [ChartBlock]
type: 'bar'
title: 'Revenue Breakdown'
description: 'Department-wise revenue composition'
data:
  labels: ['Q1', 'Q2', 'Q3', 'Q4']
  datasets:
    - label: 'Products'
      data: [30000, 35000, 32000, 40000]
      color: '#1f644e'
    - label: 'Services'
      data: [15000, 18000, 20000, 22000]
      color: '#4a90d9'
    - label: 'Licensing'
      data: [5000, 5000, 7000, 8000]
      color: '#e67e22'
options:
  stacked: true
  showLegend: true
  beginAtZero: true
  footer: 'All figures in INR'
```

**Line Chart**

```yaml
## [ChartBlock]
type: 'line'
title: 'Monthly Active Users'
description: 'User growth trend over time'
data:
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  datasets:
    - label: 'Users'
      data: [1200, 1350, 1100, 1500, 1700, 1900]
      color: '#4a90d9'
    - label: 'Forecast'
      data: [null, null, null, 1500, 1600, 1800]
      color: '#e67e22'
options:
  fill: false
  showGrid: true
  beginAtZero: true
  showLegend: true
```

**Line Chart (Filled)**

```yaml
## [ChartBlock]
type: 'line'
title: 'Temperature Trend'
description: 'Daily temperature variations'
data:
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  datasets:
    - label: 'Max Temp'
      data: [28, 30, 29, 32, 31, 33, 30]
      color: '#e74c3c'
    - label: 'Min Temp'
      data: [18, 19, 17, 20, 19, 21, 18]
      color: '#3498db'
options:
  fill: true
  stacked: false
  showGrid: true
  beginAtZero: false
```

**Pie Chart**

```yaml
## [ChartBlock]
type: 'pie'
title: 'Market Share'
description: 'Product distribution in market'
data:
  labels: ['Product A', 'Product B', 'Product C', 'Product D']
  datasets:
    - label: 'Share'
      data: [45, 30, 15, 10]
      color: '#1f644e'
options:
  showLegend: true
  footer: 'Total market: 100%'
```

**Doughnut Chart**

```yaml
## [ChartBlock]
type: 'doughnut'
title: 'Budget Allocation'
description: 'Department-wise budget distribution for FY 2025-26'
data:
  labels: ['Engineering', 'Marketing', 'Operations', 'R&D', 'Admin']
  datasets:
    - label: 'Budget'
      data: [40, 25, 20, 10, 5]
options:
  showLegend: true
  footer: 'Percentage of total budget'
```

**Radar Chart**

```yaml
## [ChartBlock]
type: 'radar'
title: 'Skill Assessment'
description: 'Current vs target skill levels'
data:
  labels: ['Python', 'SQL', 'React', 'DevOps', 'Design', 'Communication']
  datasets:
    - label: 'Current'
      data: [8, 7, 6, 4, 5, 7]
      color: '#1f644e'
    - label: 'Target'
      data: [9, 8, 8, 7, 7, 8]
      color: '#e67e22'
options:
  showLegend: true
  fill: true
  footer: 'Scale: 1-10'
```

**Polar Area Chart**

```yaml
## [ChartBlock]
type: 'polarArea'
title: 'Performance Metrics'
description: 'Multi-dimensional performance analysis'
data:
  labels: ['Speed', 'Reliability', 'Security', 'Scalability', 'Cost']
  datasets:
    - label: 'Current'
      data: [85, 90, 75, 80, 70]
      color: '#4a90d9'
    - label: 'Industry Avg'
      data: [75, 80, 85, 75, 80]
      color: '#e67e22'
options:
  showLegend: true
  fill: true
```

**Scatter Chart**

```yaml
## [ChartBlock]
type: 'scatter'
title: 'Student Performance'
description: 'Study hours vs exam scores'
data:
  labels: []
  datasets:
    - label: 'Students'
      data:
        [
          { x: 2, y: 45 },
          { x: 3, y: 55 },
          { x: 4, y: 65 },
          { x: 5, y: 75 },
          { x: 6, y: 85 },
          { x: 7, y: 90 },
        ]
      color: '#1f644e'
options:
  showGrid: true
  showLegend: true
  footer: 'X: Study Hours, Y: Score'
```

**Bubble Chart**

```yaml
## [ChartBlock]
type: 'bubble'
title: 'Company Analysis'
description: 'Revenue vs growth vs market cap'
data:
  labels: []
  datasets:
    - label: 'Companies'
      data:
        [
          { x: 100, y: 50, r: 20 },
          { x: 150, y: 75, r: 30 },
          { x: 200, y: 100, r: 40 },
          { x: 250, y: 120, r: 50 },
        ]
      color: '#4a90d9'
options:
  showGrid: true
  showLegend: true
  footer: 'Bubble size represents market cap'
```

---

## 3. Mermaid Diagram Standards

We heavily rely on `mermaid` to draw State-Space Trees, Directed Graphs, and Flowcharts.

- **Important:** When injecting a Mermaid graph inside a `[StepByStepBlock]`, it must be written _inside_ the `content:` string.
- Example string injection: `"Here is the graph: \n```mermaid\ngraph TD\n    A --> B\n```"`

---

## 4. The Coursify CLI Workflow

Whenever you author or modify a module, you must interact with the CLI to ensure the rigid YAML structure isn't broken.

1. **Validation:** Run `coursify validate .` in the terminal. If it fails, fix the YAML indentation or block headers immediately.
2. **Packaging:** Run `coursify package .` to generate the `course-bundle.json` for database deployment.
3. **Database Slug Errors:** If packaging triggers an `E11000 duplicate key error` regarding the `slug`, open the root `info.yaml` and slightly modify the `title` (e.g., adding an acronym) so the framework generates a unique URL slug!
