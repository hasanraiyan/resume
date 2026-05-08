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
    '1. Call list_courses first to avoid duplicate topics. Decide whether to create a new course or update a draft.',
    '2. Call get_course_authoring_guide before planning, drafting, or rewriting any course.',
    '3. Research the topic thoroughly using any external search or browsing tool available. For each meaningful source or insight found, call add_research_note to persist it — title, key takeaway, source URL, and type. Set authoringStatus to "researching" while this is ongoing.',
    '4. Call save_course_plan once research is done: fill in targetAudience, learningObjectives, prerequisites, outcome, and a free-form Markdown outline of planned modules and sections. Set authoringStatus to "planned".',
    '5. Call create_module once for each planned module in the outline, in order. Provide clear titles and learning goals.',
    '6. Call add_section once per section, specifying the moduleId so it is grouped correctly. Write full Markdown content following the section template. Set authoringStatus to "drafting" when you begin.',
    '7. Call get_course_progress at any time to check completeness — see which sections are still planned, which modules are incomplete, and what the recommended next action is.',
    '8. When all sections are written, set authoringStatus to "reviewing" via save_course_plan, review quality, then "ready" when satisfied.',
    '9. Call publish_course only after the user explicitly asks to publish or confirms the content is complete.',
  ],
  courseShape: {
    recommendedSections: '6-10 sections for a practical course; 3-5 for a short primer.',
    recommendedModules: '2-4 modules that group sections into logical learning phases.',
    sectionContent:
      'Each section should be self-contained Markdown with clear explanations, examples, practice tasks, and a recap.',
    resources:
      'Include only useful, relevant resources. Use docs and authoritative references when possible.',
    researchNotes:
      'Use add_research_note liberally during research. Notes are stored per-course and visible in the planning workspace. They survive context resets and let you resume research in a future session.',
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
  authoringStatusGuide: {
    idea: 'Initial spark — course not yet researched or planned.',
    researching: 'Actively gathering sources and understanding the topic.',
    planned: 'Course plan saved: audience, objectives, modules, and outline are defined.',
    drafting: 'Sections are being written one by one.',
    reviewing: 'Draft complete — reviewing content quality and completeness.',
    ready: 'Content is complete and ready for publication.',
    published: 'Course is published and visible.',
  },
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
