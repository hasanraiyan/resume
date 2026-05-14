# Chart Block — YAML Schema Reference

## Basic Structure

```yaml
## [ChartBlock]
type: 'bar'
title: 'Chart Title'
description: 'A short description shown below the title.'
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

---

## `type` (string)

One of these chart types:

| Value       | Description                  |
| ----------- | ---------------------------- |
| `bar`       | Vertical bar chart (default) |
| `line`      | Line chart                   |
| `pie`       | Pie chart                    |
| `doughnut`  | Doughnut chart               |
| `polarArea` | Polar area chart             |
| `radar`     | Radar chart                  |
| `scatter`   | Scatter chart                |
| `bubble`    | Bubble chart                 |

---

## `title` (string, optional)

Plain text displayed above the chart in bold.

---

## `description` (string, optional)

Subtitle/summary text shown below the title in a smaller muted colour.

---

## `data`

### `data.labels` (array of strings)

```yaml
labels: ['Label 1', 'Label 2', 'Label 3']
```

X-axis / category labels. Used by: `bar`, `line`, `radar`, `polarArea`. For `pie` and `doughnut` these become segment labels. For `scatter` and `bubble` these are typically omitted.

### `data.datasets` (array of objects)

Each dataset object:

| Field   | Type             | Required | Description                                      |
| ------- | ---------------- | -------- | ------------------------------------------------ |
| `label` | string           | Yes      | Series name (shown in legend/tooltip)            |
| `data`  | array of numbers | Yes      | The numeric values                               |
| `color` | hex string       | No       | Override colour. Defaults to a rotating palette. |

```yaml
datasets:
  - label: 'Revenue'
    data: [100, 200, 150]
    color: '#1f644e'
  - label: 'Expenses'
    data: [80, 90, 70]
    # color omitted → uses default palette
```

Custom colours (hex with `#`):

```
#1f644e  Coursify Green
#4a90d9  Blue
#e67e22  Orange
#9b59b6  Purple
#e74c3c  Red
#1abc9c  Teal
#f1c40f  Yellow
#34495e  Navy
#7f8c8d  Gray
#27ae60  Emerald
```

---

## `options` (all optional)

### Boolean Options

| Option        | Default | Effect                                                     |
| ------------- | ------- | ---------------------------------------------------------- |
| `showLegend`  | `true`  | Show/hide the legend at the bottom                         |
| `showGrid`    | `true`  | Show/hide axis grid lines (bar, line, scatter, bubble)     |
| `beginAtZero` | `true`  | Force Y-axis to start at zero (bar, line, scatter, bubble) |
| `stacked`     | `false` | Stack datasets on top of each other (bar, line)            |

### String Options

| Option      | Default | Effect                                                 |
| ----------- | ------- | ------------------------------------------------------ |
| `indexAxis` | `"x"`   | Set to `"y"` for horizontal bar chart                  |
| `footer`    | —       | Small note displayed below the chart with an info icon |

### Number Options (parsed automatically)

Any unrecognised key with a numeric value is stored as a number. These are spread directly into Chart.js options (can override title font size, padding, etc.).

---

## Complete Examples

### Pie Chart

```yaml
## [ChartBlock]
type: 'pie'
title: 'Market Share'
data:
  labels: ['Product A', 'Product B', 'Product C']
  datasets:
    - label: 'Share'
      data: [45, 30, 25]
```

### Horizontal Bar Chart

```yaml
## [ChartBlock]
type: 'bar'
title: 'Satisfaction Scores'
data:
  labels: ['Support', 'Speed', 'UX', 'Value']
  datasets:
    - label: 'Score'
      data: [4.2, 3.8, 4.5, 4.0]
options:
  indexAxis: 'y'
  showGrid: false
  footer: 'Out of 5.0'
```

### Line Chart

```yaml
## [ChartBlock]
type: 'line'
title: 'Monthly Active Users'
data:
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May']
  datasets:
    - label: 'Users'
      data: [1200, 1350, 1100, 1500, 1700]
      color: '#4a90d9'
    - label: 'Forecast'
      data: [null, null, null, 1500, 1600]
      color: '#e67e22'
options:
  beginAtZero: true
```

### Stacked Bar Chart

```yaml
## [ChartBlock]
type: 'bar'
title: 'Revenue Breakdown'
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
  footer: 'All figures in INR'
```

### Radar Chart

```yaml
## [ChartBlock]
type: 'radar'
title: 'Skill Assessment'
data:
  labels: ['Python', 'SQL', 'React', 'DevOps', 'Design']
  datasets:
    - label: 'Current'
      data: [8, 7, 6, 4, 5]
      color: '#1f644e'
    - label: 'Target'
      data: [9, 8, 8, 7, 7]
      color: '#e67e22'
```

### Doughnut Chart

```yaml
## [ChartBlock]
type: 'doughnut'
title: 'Budget Allocation'
description: 'Department-wise budget distribution for FY 2025-26'
data:
  labels: ['Engineering', 'Marketing', 'Operations', 'R&D']
  datasets:
    - label: 'Budget'
      data: [40, 25, 20, 15]
options:
  showLegend: true
  footer: 'Percentage of total budget'
```
