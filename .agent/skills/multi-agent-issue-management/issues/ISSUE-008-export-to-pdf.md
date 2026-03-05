# Issue: Implement "Export to PDF" functionality

**ID**: ISSUE-008

## 🤖 Agent Assignment

**Primary Agent**: Codex
**Collaborators**: Antigravity

---

## 🎯 Objective

Add an "Export to PDF" button to the top-right header of the Presentation Generator that allows users to download the entire presentation deck as a single PDF document.

---

## 🛠️ Implementation Scope

### 📂 Allowed Directories/Files

- `src/components/tools/PresentationGenerator.js`
- `package.json` (If choosing to install a library like `jspdf` or `html2pdf.js`)

### ⚠️ Conflict Zones (DO NOT TOUCH)

- API routes

---

## 🚀 Requirements

1. **Add Export Button**: In `PresentationGenerator.js`, locate the top right header controls (around line 789 where the `Play` and `PlusCircle` buttons are). Add a new button with a `FileText` or `Download` icon labeled "Export PDF" (or simply an icon with a tooltip).
2. **Implement PDF Export Logic**:
   - Write a function `handleExportPDF` that triggers when the button is clicked.
   - The function should iterate over all generated slides (`slides` array) and compile their `imageUrl` data into a single PDF document.
   - You can use libraries like `jspdf` (e.g. `pnpm add jspdf`) to create a new PDF, loop through the images, calculate the aspect ratio to fit the page, and add new pages for each image.
3. **Handle States**:
   - The button should only be enabled when `isEditorView` is true and there are generated slides.
   - Provide visual feedback (e.g. a loading spinner on the button) while the PDF is rendering.

---

## 📝 Coordination Notes

- **Branch**: `agent/codex/feature-export-pdf`
- **Dependencies**: None
- **PR Strategy**: Implement the button and PDF generation logic, then draft a PR.

---

**Priority**: Medium
**Status**: 🆕 Pending
