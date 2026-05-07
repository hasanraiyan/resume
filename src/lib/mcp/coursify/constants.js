export const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  openWorldHint: false,
  destructiveHint: false,
  idempotentHint: true,
};

export const MUTATION_ANNOTATIONS = {
  readOnlyHint: false,
  openWorldHint: false,
  destructiveHint: false,
};

export const DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  openWorldHint: false,
  destructiveHint: true,
};

export const COURSE_AUTHORING_GUIDE = {
  purpose: 'Help an AI assistant create complete, practical, high-quality courses in Coursify.',
  workflow: [
    'Call list_courses first to avoid duplicate courses with the same topic.',
    'Call get_course_authoring_guide before planning, drafting, or rewriting a course.',
    'Research the topic before writing. Use any available search or browsing tool outside Coursify when the topic needs current, technical, or source-backed information.',
    'Think through the learner profile, prerequisites, final outcome, difficulty, and scope before creating anything.',
    'Create a compact course plan in the conversation first: course title, audience, outcome, section list, and section goals.',
    'Call create_course only after the plan is clear. This creates the course shell as a draft.',
    'Call add_section once per section. Write and save sections sequentially so each one can use the research, prior sections, and course plan.',
    'Use update_section when revising a section after review or after finding better research.',
    'Keep new courses as drafts unless the user explicitly asks you to publish.',
  ],
  courseShape: {
    recommendedSections: '6-10 sections for a practical course; 3-5 for a short primer.',
    sectionContent:
      'Each section should be self-contained Markdown with clear explanations, examples, practice tasks, and a recap.',
    resources:
      'Include only useful, relevant resources. Use docs and authoritative references when possible.',
  },
  markdownTemplate: `## Learning Goals
- What the learner will be able to do after this section

## Core Concepts
Explain the ideas clearly and concretely.

## Step-by-Step Walkthrough
Break the work into teachable steps.

## Example
Include a realistic example, code sample, prompt, checklist, or scenario when useful.

## Practice
Give the learner a small exercise or reflection task.

## Common Mistakes
Call out likely misunderstandings and how to avoid them.

## Recap
Summarize the section in a few crisp bullets.`,
  qualityBar: [
    'Write for the requested audience and difficulty, not a generic reader.',
    'Make the course actionable: include projects, checkpoints, or exercises.',
    'Prefer concrete examples over vague motivational text.',
    'Build sections in a coherent progression: foundation, guided practice, applied project, review.',
    'Avoid filler introductions. Every section should teach something useful.',
    'Use consistent terminology and build concepts in a sensible order.',
    'Do not invent fake citations or resource URLs.',
  ],
};
