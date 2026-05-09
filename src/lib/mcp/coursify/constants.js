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
  idempotentHint: true,
};

export const DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  openWorldHint: false,
  destructiveHint: true,
};

export const COURSE_AUTHORING_GUIDE = {
  purpose: 'Help an AI assistant create complete, practical, high-quality courses in Coursify.',

  sessionResumeWorkflow: [
    'When the user asks to continue or resume a course in a NEW session (no courseId in context):',
    '  1. Call list_courses(status: "draft") — results are sorted by updatedAt descending. The first result is almost always the active course.',
    '  2. Confirm the course with the user if there are multiple plausible drafts.',
    '  3. Call get_course({ id: courseId, includeContent: true, includeResearch: true, includeProgress: true }) — single call that returns EVERYTHING.',
    '  4. Read agentNotes from the course — this is your scratchpad from the previous session. It tells you exactly what was in progress and what to do next.',
    '  5. Read the progress report to know which sections are complete vs. still needed.',
    '  6. Resume writing from where you left off. Save your current working state to agentNotes via upsert_course before finishing your turn.',
  ],

  agentNotesGuide: [
    'agentNotes is a free-text field on the course, returned inside get_course.',
    'Use it as your scratchpad to survive session interruptions. At the end of each turn, save your current working state:',
    '  • Which module you are currently writing',
    '  • Which sections are done and which are planned next',
    '  • Any decisions made about structure, scope, or content',
    '  • Outstanding tasks for the next session',
    'Example: "Completed sections: Intro, Core Concepts. Next: write Step-by-Step Walkthrough for moduleId abc123. Planned sections remaining: Examples, Practice, Recap."',
    'Call upsert_course({ id: courseId, agentNotes: "..." }) to persist this.',
  ],

  workflow: [
    '0. SESSION RESUME — If the user says "continue my course" and you do not have a courseId in context, follow the sessionResumeWorkflow above.',
    '1. DISCOVERY — Call list_courses first to avoid duplicate topics. Decide whether to create a new course or update an existing draft. If updating, call get_course with all include flags.',
    '2. PREP — Call get_authoring_guide (you already have it). Read the quality bar and section template before doing any work.',
    '3. RESEARCH — Gather information. Call manage_research to save all findings (up to 20 findings per call). Set authoringStatus to "researching" via upsert_course.',
    '4. PLAN — Call upsert_course to define targetAudience, learningObjectives, prerequisites, outcome, and a Markdown outline. Save planned sections to agentNotes. Set authoringStatus to "planned".',
    '5. STRUCTURE — Call upsert_module to create modules, then upsert_section(batch: []) to add planned sections under each module.',
    '6. WRITE — Use upsert_section(batch: []) to create or update sections in one call. Set authoringStatus to "drafting" when you begin. Save progress to agentNotes after each batch. For quiz sections, use the questions param.',
    '7. REVIEW — Call get_course(includeProgress: true) to identify gaps. Use get_section(id) to read single section bodies for revision.',
    '8. FINALIZE — When all sections are written, set authoringStatus to "reviewing" via upsert_course. Content is automatically marked reviewing when all sections are "complete".',
    '9. PUBLISH — Set status: "published" via upsert_course only after the user explicitly asks to publish.',
  ],

  toolQuickReference: {
    readWorkspace:
      'get_course(id, includeContent: true, includeResearch: true, includeProgress: true) — full context.',
    upsertCourse:
      'upsert_course({ id, ...fields }) — create/update metadata, plan, agentNotes, or status.',
    upsertModule: 'upsert_module({ id, ...fields }) — create/update module structure.',
    upsertSection:
      'upsert_section({ id, ...fields, batch, questions }) — create/update sections (single or batch) and quizzes.',
    manageResearch: 'manage_research({ courseId, findings[] }) — save research findings.',
    reorder: 'reorder_modules(...) or reorder_sections(...) — change display order.',
    bulkDelete: 'delete_courses([ids]), delete_modules([ids]), or delete_sections([ids]).',
  },

  courseShape: {
    recommendedSections: '6-10 sections for a practical course; 3-5 for a short primer.',
    recommendedModules: '2-4 modules that group sections into logical learning phases.',
    sectionContent:
      'Self-contained Markdown with explanations, examples, practice tasks, and a recap.',
    resources:
      'Include only useful, relevant resources. Use authoritative references when possible.',
  },

  instructionalDesignGuide: {
    quizPlacement: [
      'Standalone Quiz: Every module MUST end with a "Module Review" quiz.',
      'Embedded Quiz: Lessons SHOULD include 2-4 knowledge-check questions at the end.',
    ],
    sectionDepth: [
      'A standard lesson should be 500-1200 words of high-signal Markdown.',
      'Every lesson must include at least one practical Example and one Practice task.',
    ],
  },

  diagramGuide: {
    rule: 'Use Mermaid diagrams instead of ASCII art for all visuals.',
    renderer: 'The reader renders ```mermaid blocks automatically.',
    math: 'Use LaTeX syntax: $...$ for inline and $$...$$ for display math.',
  },

  markdownTemplate: `## Learning Goals
- What the learner will be able to do after this section

## Core Concepts
Explain the ideas clearly and concretely.
Use a \`\`\`mermaid diagram when a visual helps.

## Step-by-Step Walkthrough
Break the work into teachable steps.

## Example
Include a realistic example or scenario.

## Practice
Give the learner a small exercise or reflection task.

## Common Mistakes
Call out likely misunderstandings and how to avoid them.

## Recap
Summarize the section in a few crisp bullets.`,

  authoringStatusGuide: {
    idea: 'Initial spark — course not yet researched or planned.',
    researching: 'Actively gathering sources and understanding the topic.',
    planned: 'Plan saved: audience, objectives, modules, and outline are defined.',
    drafting: 'Sections are being written one by one.',
    reviewing: 'Draft complete — reviewing content quality.',
    ready: 'Content is complete and ready for publication.',
    published: 'Course is published and visible.',
  },

  qualityBar: [
    'Write for the requested audience and difficulty.',
    'Make the course actionable with projects or exercises.',
    'Prefer concrete examples over vague text.',
    'Use ```mermaid for ALL visuals. Never use ASCII art.',
    'Use LaTeX for all math formulas.',
  ],
};
