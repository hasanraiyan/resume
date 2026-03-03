---
description: How to research, explore, and generate a high-quality technical report on any topic by exploring the codebase.
---

# Code Reporting Skill

This skill teaches you how to generate professional, deep-dive technical reports on any subject requested by the user. A "good" report must be accurate, visually structured, and provide functional links to all referenced files.

---

## Step 1: Request Analysis & Initial Search

When a user asks for a report (e.g., "Give me a report on the auth flow"), you must first understand the scope:

1.  **Identify Core Keywords**: Extract the primary components or features mentioned (e.g., `auth`, `login`, `session`, `middleware`).
2.  **Breadth Search**: Use `grep_search` to find mentions of these keywords across the codebase.
3.  **Structure Search**: Use `list_dir` on directories like `src/`, `lib/`, `app/`, `components/`, and `api/` to identify relevant modules.
4.  **File Discovery**: Use `find_by_name` if you're looking for specific file types (e.g., `.ts`, `.js`, `.py`).

---

## Step 2: Deep Codebase Exploration

Don't just mention files; understand them.

1.  **Read Key Files**: Use `view_file` on the most relevant files found in Step 1. Focus on the entry points, controllers, and core logic.
2.  **Trace the Flow**: Follow imports and function calls to understand how different files interact.
3.  **Analyze Logic**: Look for patterns, error handling, security measures, and performance optimizations.
4.  **Document Findings**: Keep internal notes of the connections you find between components.

---

## Step 3: Report Structure

Every report MUST follow this professional structure:

### 1. Title & Executive Summary

- **Title**: Clear and descriptive (e.g., "Technical Analysis: Chatbot Architecture").
- **Summary**: A 1-2 paragraph high-level overview of the findings, suitable for a non-technical stakeholder to understand the "what" and "why."

### 2. Architectural Overview

- **Diagrams**: Use **Mermaid diagrams** (sequence, flowchart, or class diagrams) to visualize the flow or structure.
- **Components**: List the main modules involved and their responsibilities.

### 3. Deep Dive Analysis

- **Detailed Findings**: Break down the topic into sub-sections.
- **Code Patterns**: Explain how the code works, why certain decisions were made, and any notable patterns (e.g., "The system uses a singleton pattern for the database connection").
- **Security/Performance**: Mention any relevant security audits or performance considerations.

### 4. File References (CRITICAL)

- Every time you mention a file, you **MUST** provide a functional markdown link to it.
- **Format**: `[filename](file:///absolute/path/to/file)`
- **Line Ranges**: If referring to a specific part of a file, use `[filename:L10-20](file:///absolute/path/to/file#L10-L20)`.

### 5. Recommendations & Conclusion

- **Insights**: Provide actionable recommendations if applicable (e.g., "The middleware could be optimized by caching session data").
- **Final Summary**: Reiterate the key takeaways.

---

## Step 4: Formatting Rules

1.  **Functional Links**: Never just write the filename. ALWAYS link it using the `file:///` URI scheme with the absolute path.
2.  **No Fluff**: Keep the report technical and direct. Avoid excessive conversational filler.
3.  **Visual Structure**: Use `##` and `###` headers, bullet points, and tables to make the report scannable.
4.  **Absolute Paths**: Always use absolute paths for file links to ensure they work in the user's environment.

---

## Step 5: Verification & Quality Check

Before presenting the report, verify:

- [ ] All file references are clickable links with `file:///` URIs.
- [ ] At least one **Mermaid diagram** is included for structural or flow visualization.
- [ ] The report covers all technical aspects requested by the user.
- [ ] The summary is concise and accurate.
- [ ] Recommendations (if any) are based on the actual code found.

---

## Example File Link

Correct: `[ChatbotWidget.js](file:///d:/resume/src/components/chatbot/ChatbotWidget.js)`
Incorrect: `src/components/chatbot/ChatbotWidget.js`
