---
description: How to coordinate work between Google Jules, Cloud Codex, and Antigravity to minimize git conflicts
---

# Multi-Agent Issue Management Skill

This skill provides a structured workflow for creating and managing project issues when multiple AI agents are working in the same codebase. It focuses on **conflict prevention** and **distributed ownership**.

---

## The Agent Ecosystem

1.  **Google Jules**: Autonomous cloud agent. Priority: Feature implementation and PR creation.
2.  **Cloud Codex**: Autonomous backend/logic specialist. Priority: Complex refactoring and system architecture.
3.  **Antigravity (You)**: Project coordinator and pair-programmer. Priority: Planning, orchestration, and immediate collaboration.

---

## Step 1: Issue Definition & Assignment

When creating an issue, you MUST specify the target agent. This determines the workflow and the expected output.

### Role Allocation Strategy

To prevent git conflicts, assign tasks based on **isolation**:

- **Directory Isolation**: Jules works in `/src/components/chat`, Codex works in `/src/lib/api`.
- **Feature Isolation**: Jules implements the UI, Codex implements the endpoint.
- **Sequential Dependence**: Codex creates the schema first, then Jules implements the form.

---

## Step 2: The Issue Template

Always use the [Issue Template](./templates/issue-template.md) when defining a new task.

### Key Metadata Fields:

- **`Agent`**: [Jules / Codex / Antigravity]
- **`Scope`**: List specific files or directories this agent is allowed to touch.
- **`Conflict Zone`**: List files that _other_ agents are currently working on.

---

## Step 3: Workflow Rules

1.  **No Shared Files**: Two agents should NEVER be assigned to edit the same file in parallel.
2.  **Communication via Issues**: If an agent needs a change in a file owned by another, they must update the issue and wait for handoff.
3.  **Minimal PRs**: Encourage agents to make small, focused PRs.
4.  **Rebase Often**: Instruct autonomous agents (Jules/Codex) to rebase against `main` frequently.

---

## Step 4: Creating a "Master Plan"

For complex features, create a **Master Coordination Doc** (e.g., `multi_agent_plan_feature.md`) that maps out the sequence:

1. Codex: Implement `api/v2/feature` (Files: `...`)
2. Antigravity: Update `mcpConfig.js` (Files: `...`)
3. Jules: Build Responsive UI (Files: `...`)

---

## Verification Checklist

- [ ] Agent is clearly identified.
- [ ] File scope is explicitly defined.
- [ ] No overlaps with currently running tasks.
- [ ] Branch naming convention is specified.
