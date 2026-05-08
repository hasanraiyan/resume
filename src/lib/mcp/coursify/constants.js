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
    '1. DISCOVERY — Call list_courses first to avoid duplicate topics. Decide whether to create a new course or update an existing draft. If updating, call get_course to review current state.',
    '2. PREP — Call get_course_authoring_guide (you already have it). Read the quality bar and section template before doing any work.',
    '3. RESEARCH — Gather information about the topic using whatever tools you have available:\n   • If you have web search MCP tools: search for current docs, version numbers, real-world examples, and best practices. Call research_findings to batch-save all findings at once, or add_research_note for individual sources.\n   • If you do NOT have web search tools: use your built-in knowledge to research the topic. Still call research_findings to persist key findings — they survive context resets.\n   • Set authoringStatus to "researching" via save_course_plan while this is ongoing.',
    '4. PLAN — Call save_course_plan to define the course structure: targetAudience, learningObjectives, prerequisites, outcome, and a free-form Markdown outline of planned modules and sections. The tool returns a completeness score and suggestions — address critical gaps. Set authoringStatus to "planned".',
    '5. STRUCTURE — Call suggest_modules_from_outline to get a recommended module grouping from your saved outline. Review the suggestions, then call create_module once per module you want to keep, in order.',
    '6. WRITE — Call add_section once per section, specifying the moduleId so it is grouped correctly. Write full Markdown content following the section template below. Set authoringStatus to "drafting" when you begin writing.',
    "7. REVIEW — Call get_course to see the full structure (modules + section metadata). Call get_section_content to read any section's full Markdown body when revising. Call get_course_progress to identify gaps.",
    '8. FINALIZE — When all sections are written, set authoringStatus to "reviewing" via save_course_plan. Read each section with get_section_content, fix quality issues, then set to "ready" when satisfied.',
    '9. PUBLISH — Call publish_course only after the user explicitly asks to publish or confirms the content is complete.',
  ],
  courseShape: {
    recommendedSections: '6-10 sections for a practical course; 3-5 for a short primer.',
    recommendedModules: '2-4 modules that group sections into logical learning phases.',
    sectionContent:
      'Each section should be self-contained Markdown with clear explanations, examples, practice tasks, and a recap.',
    resources:
      'Include only useful, relevant resources. Use docs and authoritative references when possible.',
    researchNotes:
      'Use research_findings to batch-save multiple sources at once, or add_research_note for single findings. Notes are stored per-course and visible in the planning workspace. They survive context resets and let you resume research in a future session.',
  },
  planningChecklist: [
    'save_course_plan returned at least 4/5 completeness score',
    'suggest_modules_from_outline returned 2-4 logical module groupings',
    'Each module has a clear title and 1-3 learning goals',
    'Total planned sections: 6-10 for a full course, 3-5 for a primer',
    'At least 3 research findings saved via research_findings or add_research_note',
  ],
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
