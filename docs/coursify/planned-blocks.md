# Planned / Proposed Coursify Magic Blocks

This document tracks ideas for new interactive "Magic Blocks" to implement in the Coursify platform to enhance e-learning capabilities. These can be implemented by following the workflow in `adding-new-blocks.md`.

## 💡 Interactivity & Assessment

### 1. `FlashcardBlock`

- **What it does:** Displays a grid of flashcards for active recall. The user clicks a card, and it performs a 3D flip animation (using Framer Motion) to reveal the answer on the back.
- **Best for:** Memorizing definitions, time complexities in algorithms, or API methods.
- **Data Structure Idea:**
  ```yaml
  cards:
    - front: 'What is the time complexity of binary search?'
      back: 'O(log n)'
  ```

### 2. `FillInTheBlankBlock`

- **What it does:** Renders a paragraph of text with missing words replaced by text inputs. The user types the answer and hits "Check".
- **Best for:** Code syntax memorization or completing definitions.

### 3. `InteractiveImageBlock` (Hotspots)

- **What it does:** Displays an image or architecture diagram with clickable "hotspot" dots on it. Clicking a dot opens a small tooltip or popover explaining that specific part of the diagram.
- **Best for:** Explaining complex UI dashboards, hardware diagrams, or system architectures.

---

## 💻 Developer & Technical Focus

### 4. `LiveCodeBlock` or `SandboxBlock`

- **What it does:** Embeds an interactive code editor right in the lesson. Using something like `react-live` for frontend code or embedding CodeSandbox/StackBlitz.
- **Best for:** Letting students tweak React components or JavaScript logic without leaving the browser.

### 5. `TerminalBlock`

- **What it does:** A stylized, macOS/Linux looking terminal window. Instead of just a generic markdown code block, it has a built-in "Copy to Clipboard" button, and can visually separate the "Command" from the simulated "Output".
- **Best for:** CLI tutorials, setup instructions, or showing Git workflows.

---

## 🗂️ Content Organization & Layout

### 6. `TabsBlock`

- **What it does:** Allows authors to group content into clickable horizontal tabs.
- **Best for:** Showing the same solution in multiple languages (e.g., `Python` | `Java` | `C++`), or showing setup instructions for different OS (`Windows` | `macOS` | `Linux`) without cluttering vertical reading space.

### 7. `CalloutBlock` (Alerts)

- **What it does:** Renders a highlighted box with an icon. It could have variations like `info`, `warning`, `tip`, and `danger`.
- **Best for:** "Gotchas", common interview traps, or important pro-tips that need to stand out from regular text.

### 8. `TimelineBlock`

- **What it does:** Draws a vertical line down the left side with nodes/dots mapping out a sequence of events.
- **Best for:** Explaining the lifecycle of a request, the history of a technology, or roadmap-style overviews.

### 9. `ComparisonBlock` (Pros/Cons Table)

- **What it does:** A specialized two-column layout showing "Pros" (with green checkmarks) and "Cons" (with red X's) or comparing two technologies head-to-head.
- **Best for:** System design trade-offs (e.g., SQL vs NoSQL, Polling vs WebSockets).
