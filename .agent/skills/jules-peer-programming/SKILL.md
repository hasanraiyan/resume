---
description: How to use Jules as a peer programming assistant by creating detailed GitHub issues with the 'jules' label using the GitHub CLI.
---

# Jules Peer Programming Skill

This skill explains how to delegate programming tasks, bugs, or feature additions to **Jules** (our automated peer programming assistant) by creating and labeling GitHub issues using the GitHub CLI (`gh`).

---

## Overview

Jules monitors this repository for new or updated GitHub issues. When an issue is labeled with `jules`, Jules is triggered to process the issue, research the codebase, implement the requested changes, and submit a Pull Request.

To get the best results from Jules, you must provide clear, well-structured, and highly detailed issues.

---

## Step 1: Write a Detailed Issue Body

Before creating the issue, draft the body of the issue in markdown. The more context and precision you provide, the better Jules' output will be.

A high-quality issue body should include:

1. **Objective**: A clear, concise summary of what needs to be built or fixed.
2. **Context / Rationale**: Why this change is necessary and where the relevant files are located.
3. **Requirements / Specification**: A bulleted list of functional requirements.
4. **Architectural Guidelines**: Specific files to modify, design patterns to follow, or constraints to observe.
5. **Acceptance Criteria**: What constitutes a successful implementation.

### Example Issue Template (`issue_draft.md`)

```markdown
## Objective

Add a new utility function to compute average transaction value in the Pocketly finance app.

## Context

In `src/lib/money-account-summary.js`, we have functions for computing account balances and summaries. We need to expose a new metric for the user dashboard: average transaction size over the last 30 days.

## Requirements

- Create a function `computeAverageTransactionSize(transactions, days)` in `src/lib/money-account-summary.js`.
- It should filter transactions within the last `days` parameter (default 30).
- Exclude deleted transactions (`deletedAt` not null).
- Return a number rounded to 2 decimal places.

## Implementation Details

- Import or use existing date helper functions if needed.
- Export the new function.
- Integrate it into the `/api/money/analysis` route so the frontend can query it.

## Acceptance Criteria

- calling the API returns `{ averageTransactionSize: 123.45 }` inside the response payload.
- Zero division is handled gracefully (returns `0` if no transactions).
```

---

## Step 2: Use the GitHub CLI (`gh`) to Create the Issue

Use the GitHub CLI to create the issue and assign the `jules` label.

### 1. Verify gh CLI Authentication

Before running the command, ensure you are authenticated to the correct repository:

```bash
gh auth status
```

If not logged in, run:

```bash
gh auth login
```

### 2. Create the Issue Labeled 'jules'

To create the issue, use the `gh issue create` command. You can pass the body directly or use a temporary draft file.

#### Method A: Direct Command Line (For shorter descriptions)

```bash
gh issue create --title "Feature: Add average transaction size to Pocketly analysis" --body "Please implement a utility to calculate the average transaction size over the last 30 days in src/lib/money-account-summary.js and expose it in the API." --label "jules"
```

#### Method B: From a File (Recommended for detailed specs)

If you wrote your issue draft in `issue_draft.md`:

```bash
gh issue create --title "Feature: Add average transaction size to Pocketly analysis" --body-file issue_draft.md --label "jules"
```

---

## Step 3: Verify the Issue

Once created, the GitHub CLI will output the URL of the created issue (e.g., `https://github.com/hasanraiyan/resume/issues/123`).
Jules will automatically receive a webhook notification, analyze the issue description, check out the repository, write code, and propose a pull request or comment back with questions.
