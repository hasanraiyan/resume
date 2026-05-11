---
name: coursify-studio
description: Specialized instructional design and course authoring for the Coursify platform. Use when creating, updating, or planning courses, modules, and sections locally using the Coursify CLI.
---

# Coursify Studio

This skill transforms the agent into a specialized **Instructional Design Agent** for the Coursify platform, emphasizing a **Local-First Authoring Workflow** using the `@coursify/cli` tool.

## Local-First Workflow (Recommended)

Authoring courses locally in an IDE provides the best experience for technical content, version control, and rapid iteration.

### 1. Project Initialization

Start by scaffolding a new course directory:

```bash
node packages/coursify-cli/bin/coursify.js init "My Awesome Course"
cd "my-awesome-course"
```

### 2. Building Structure

Add modules and sections using the scaffolding commands:

```bash
# Add a module
node ../packages/coursify-cli/bin/coursify.js init-module "Getting Started" --order 1

# Add a section to that module
node ../packages/coursify-cli/bin/coursify.js init-section "Introduction" --module m1-getting-started --order 1 --type standard

# Add a lab/procedural section
node ../packages/coursify-cli/bin/coursify.js init-section "Setup Lab" --module m1-getting-started --order 2 --type lab
```

### 3. Authoring Content (Magic Blocks)

Edit the `data.md` files in each section. Follow the **Standardized Section Flow**:

- **MdBlock**: Technical theory, technical concepts, 500-1200 words. Use `##` and `###` headers.
- **StepByStepBlock**: Mandatory for labs and workflows.
- **QuizBlock**: 3-5 questions to verify learning.
- **MermaidBlock**: Visualize architectures using Mermaid syntax.

### 4. Validation & Linting

Always validate your content before syncing to ensure TOC compatibility and block integrity:

```bash
node ../packages/coursify-cli/bin/coursify.js validate .
```

### 5. Deployment (Syncing to Server)

Authenticate and then publish your course.

**Authentication:**

```bash
# Production (hasanraiyan.me)
node packages/coursify-cli/bin/coursify.js auth login

# Development (localhost:3000)
node packages/coursify-cli/bin/coursify.js auth login --dev
```

**Syncing:**

```bash
# Preview changes (Dry Run)
node packages/coursify-cli/bin/coursify.js publish . --dry-run

# Sync to production
node packages/coursify-cli/bin/coursify.js publish .

# Sync to development
node packages/coursify-cli/bin/coursify.js publish . --dev

# Sync and immediately mark as published on the UI
node packages/coursify-cli/bin/coursify.js publish . --publish
```

## Core Procedures for Agents

### ID & Slug Management

- **Slug-based Updates**: Use a unique `slug` in your `info.yaml`. The CLI will automatically find and update the existing course on the server if the slug matches, preventing duplicate courses.
- **ID Overrides**: If you have a specific Database ID, you can provide it in `info.yaml` as `id: "your-id"`.

### Observability & Debugging

If a sync fails or you see "Resource not found" errors, use the `--verbose` flag to see the raw communication:

```bash
node packages/coursify-cli/bin/coursify.js publish . --verbose
```

### Pedagogy Standards

- **Depth**: Lessons must be thorough and technical.
- **TOC Compatibility**: **NEVER** use Level 1 headers (`#`) inside a section's Markdown. Always start with `##`.
- **Interactivity**: Every section should ideally end with a `QuizBlock`.

## Troubleshooting

- **Unauthorized**: Run `coursify auth login` again. Tokens expire every 60 minutes but should refresh automatically if you have a refresh token.
- **Validation Errors**: Check for Level 1 headers or missing `correctAnswer` in Quizzes.
