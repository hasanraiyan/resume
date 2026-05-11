---
name: coursify-studio
description: Specialized instructional design and course authoring for the Coursify platform. Use when creating, updating, or planning courses, modules, and sections locally using the Coursify CLI.
---

# Coursify Studio

This skill transforms the agent into a specialized **Instructional Design Agent** for the Coursify platform, emphasizing a **Local-First Authoring Workflow** using the `@coursify/cli` npm package.

## Setup & Configuration

Before you begin authoring, ensure the CLI is installed and configured.

```bash
# Install the CLI globally
npm install -g @coursify/cli

# Initialize the configuration
coursify setup init

# Set the base URL for the server
coursify setup set-base-url https://hasanraiyan.me

# Authenticate
coursify auth login
```

## Local-First Workflow (Recommended)

Authoring courses locally in an IDE provides the best experience for technical content, version control, and rapid iteration.

### 1. Project Initialization

Start by scaffolding a new course directory:

```bash
coursify init "My Awesome Course"
cd "my-awesome-course"
```

### 2. Building Structure

Add modules and sections using the scaffolding commands:

```bash
# Add a module
coursify init-module "Getting Started" --order 1

# Add a section to that module
coursify init-section "Introduction" --module m1-getting-started --order 1 --type standard

# Add a lab/procedural section
coursify init-section "Setup Lab" --module m1-getting-started --order 2 --type lab
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
coursify validate .
```

### 5. Deployment (Syncing to Server)

Authenticate and then publish your course.

**Authentication Check:**

```bash
coursify auth status
```

**Syncing:**

```bash
# Preview changes (Dry Run)
coursify publish . --dry-run

# Sync to production
coursify publish .

# Sync and immediately mark as published on the UI
coursify publish . --publish

# Verbose mode for debugging
coursify publish . --verbose
```

## Core Procedures for Agents

### ID & Slug Management

- **Slug-based Updates**: Use a unique `slug` in your `info.yaml`. The CLI will automatically find and update the existing course on the server if the slug matches, preventing duplicate courses.
- **ID Overrides**: If you have a specific Database ID, you can provide it in `info.yaml` as `id: "your-id"`.

### Pedagogy Standards

- **Depth**: Lessons must be thorough and technical (500-1200 words).
- **TOC Compatibility**: **NEVER** use Level 1 headers (`#`) inside a section's Markdown. Always start with `##`.
- **Interactivity**: Every section should ideally end with a `QuizBlock`.

## Troubleshooting

- **Unauthorized**: Run `coursify auth login` again.
- **Validation Errors**: Check for Level 1 headers or missing `correctAnswer` in Quizzes.
- **Configuration issues**: Run `coursify setup show` to see current settings.

## Skill Resources

For detailed guidance, refer to the following files in the `references/` directory:

- `pedagogy.md`: Standards for high-fidelity technical content.
- `schemas.md`: Data models and Magic Block syntax.
- `workflows.md`: Detailed authoring and publishing workflows.
