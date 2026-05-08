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

  sessionResumeWorkflow: [
    'When the user asks to continue or resume a course in a NEW session (no courseId in context):',
    '  1. Call list_courses(status: "draft") — results are sorted by updatedAt descending. The first result is almost always the active course.',
    '  2. Confirm the course with the user if there are multiple plausible drafts.',
    '  3. Call get_course_workspace(courseId) — single call that returns EVERYTHING: course metadata, planning fields, agentNotes, research notes, and all modules with full section content.',
    '  4. Read agentNotes from the workspace — this is your scratchpad from the previous session. It tells you exactly what was in progress and what to do next.',
    '  5. Read the progress summary to know which sections are complete vs. still needed.',
    '  6. Resume writing from where you left off. Save your current working state to agentNotes via save_course_plan before finishing your turn.',
  ],

  agentNotesGuide: [
    'agentNotes is a free-text field on the course plan, returned inside get_course_workspace.',
    'Use it as your scratchpad to survive session interruptions. At the end of each turn, save your current working state:',
    '  • Which module you are currently writing',
    '  • Which sections are done and which are planned next',
    '  • Any decisions made about structure, scope, or content',
    '  • Outstanding tasks for the next session',
    'Example: "Completed sections: Intro, Core Concepts. Next: write Step-by-Step Walkthrough for moduleId abc123. Planned sections remaining: Examples, Practice, Recap."',
    'Call save_course_plan({ courseId, agentNotes: "..." }) to persist this. It does not overwrite other plan fields unless you include them.',
  ],

  workflow: [
    '0. SESSION RESUME — If the user says "continue my course" and you do not have a courseId in context, follow the sessionResumeWorkflow above before doing anything else.',
    '1. DISCOVERY — Call list_courses first to avoid duplicate topics. Decide whether to create a new course or update an existing draft. If updating, call get_course_workspace to fully restore context in one call.',
    '2. PREP — Call get_course_authoring_guide (you already have it). Read the quality bar and section template before doing any work.',
    '3. RESEARCH — Gather information about the topic:\n   • If you have web search tools: search for current docs, version numbers, real-world examples, and best practices. Call research_findings to batch-save all findings at once (up to 20 per call), or add_research_note for a single source.\n   • If you do NOT have web search tools: use your built-in knowledge. Still call research_findings to persist key findings — they survive context resets and are returned by get_course_workspace.\n   • To re-read saved findings from a previous session, call get_research_notes(courseId).\n   • Set authoringStatus to "researching" via save_course_plan while this is ongoing.',
    '4. PLAN — Call save_course_plan to define the course structure: targetAudience, learningObjectives, prerequisites, outcome, and a free-form Markdown outline. Save your planned section list to agentNotes so you can resume if interrupted. Set authoringStatus to "planned".',
    '5. STRUCTURE — Call suggest_modules_from_outline to get a recommended module grouping. Review the suggestions. Then call apply_suggested_modules(courseId) to create ALL suggested modules in one call — do NOT call create_module individually unless you want custom overrides.',
    '6. WRITE — Use add_sections(courseId, sections[]) to create multiple sections in one call, each with moduleId, title, content, and optional questions. This is preferred over calling add_section individually. Set authoringStatus to "drafting" when you begin. Save your progress to agentNotes after each batch. For quiz sections, see the quizGuide below.',
    '7. REVIEW — Call get_module(moduleId) to inspect a specific module and its sections without fetching the whole course. Call get_section_content(sectionId) to read a single section body when revising. Call get_course_progress(courseId) to identify gaps and get a recommended next action.',
    '8. FINALIZE — When all sections are written, set authoringStatus to "reviewing" via save_course_plan. Read each section with get_section_content, fix quality issues, then set to "ready".',
    '9. PUBLISH — Call publish_course only after the user explicitly asks to publish or confirms content is complete.',
  ],

  toolQuickReference: {
    readWorkspace:
      'get_course_workspace(courseId) — full context in one call. Use at session start.',
    readResearch: 'get_research_notes(courseId) — re-read all saved research findings.',
    saveProgress: 'save_course_plan({ courseId, agentNotes }) — persist working state.',
    createModules: 'apply_suggested_modules(courseId) — create all suggested modules in one call.',
    createSections: 'add_sections(courseId, sections[]) — batch-create multiple sections at once.',
    readModule:
      'get_module(moduleId) — read one module and its sections without fetching the full course.',
    readSection: 'get_section_content(sectionId) — read a single section body.',
    reorderWithinModule:
      'reorder_sections(courseId, sectionIds[], moduleId) — reorder sections inside one module.',
    addResource:
      'add_section_resource(sectionId, resource) — append a resource without touching content.',
    bulkDelete:
      'delete_sections(ids[]) or delete_modules(ids[]) — clean up multiple items at once.',
    searchCourses: 'search_courses(query) — find courses by title, description, or tags.',
    checkProgress:
      'get_course_progress(courseId) — completeness summary and recommended next action.',
    setQuiz:
      'set_quiz_questions(sectionId, questions[]) — canonical tool for all quiz question management.',
  },

  courseShape: {
    recommendedSections: '6-10 sections for a practical course; 3-5 for a short primer.',
    recommendedModules: '2-4 modules that group sections into logical learning phases.',
    sectionContent:
      'Each section should be self-contained Markdown with clear explanations, examples, practice tasks, and a recap.',
    resources:
      'Include only useful, relevant resources. Use docs and authoritative references when possible.',
    researchNotes:
      'Use research_findings to batch-save multiple sources at once (max 20 per call), or add_research_note for a single finding. Notes are stored per-course. To re-read them in a new session, call get_research_notes(courseId). They are also included in get_course_workspace.',
  },

  planningChecklist: [
    'save_course_plan returned at least 4/5 completeness score',
    'suggest_modules_from_outline returned 2-4 logical module groupings',
    'apply_suggested_modules was called to create all modules in one shot',
    'Each module has a clear title and 1-3 learning goals',
    'Total planned sections: 6-10 for a full course, 3-5 for a primer',
    'Every module ends with a standalone quiz (sectionType: quiz)',
    'At least 3 research findings saved via research_findings or add_research_note',
    'agentNotes saved with the planned section list so the session can be resumed',
  ],
  instructionalDesignGuide: {
    quizPlacement: [
      'Standalone Quiz: Every module MUST end with a "Module Review" or "Knowledge Check" quiz. This covers all concepts in that module.',
      'Embedded Quiz: Lessons with complex technical concepts or many "Core Concepts" SHOULD include 2-4 knowledge-check questions at the end of the lesson.',
      'Frequency: Aim for 1 standalone quiz per module and 1-2 embedded quizzes per module.',
    ],
    sectionDepth: [
      'A standard lesson should be 500-1200 words of high-signal Markdown.',
      'Every lesson must include at least one practical Example and one Practice task.',
      'Complexity: Start with "Concept" sections and move toward "Application" or "Step-by-Step" sections within a module.',
    ],
  },
  sectionWritingTips: {
    learningGoals: 'Use action verbs (Create, Build, Explain, Analyze). Avoid "Understand".',
    coreConcepts:
      'Explain "Why" before "How". Use Mermaid diagrams for all architecture, flows, or hierarchies.',
    stepByStep:
      'Keep each step focused. Use code blocks for all terminal commands or code snippets.',
    examples: 'Use realistic, production-ready scenarios. Avoid "foo/bar" examples.',
    practice:
      'Provide a challenge that requires applying the core concept. Include a "Success Criteria" list.',
    commonMistakes:
      'Address specific errors identified during research or common developer pitfalls.',
    recap: 'Summarize the key takeaways in 3-5 punchy bullet points.',
  },
  diagramGuide: {
    rule: 'Use Mermaid diagrams instead of ASCII art for all visual diagrams.',
    renderer:
      'The course reader renders ```mermaid fenced code blocks as interactive SVG diagrams automatically.',
    when: 'Use a diagram whenever a concept benefits from a visual: flows, state machines, hierarchies, timelines, comparisons, architecture overviews.',
    syntax: [
      'Flowchart:   graph TD or graph LR',
      'Sequence:    sequenceDiagram',
      'State:       stateDiagram-v2',
      'Class:       classDiagram',
      'Timeline:    timeline',
      'Mindmap:     mindmap',
      'Git graph:   gitGraph',
    ],
    example:
      '```mermaid\ngraph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Do X]\n  B -->|No| D[Do Y]\n```',
    forbidden:
      'Never use ASCII art (pipes, dashes, plus signs, box-drawing characters) to represent diagrams. Always use a Mermaid block instead.',
    math: 'For mathematical formulas and equations, use LaTeX math syntax: $...$ for inline math and $$...$$ for display/block math. Never put formulas in code blocks.',
  },
  markdownTemplate: `## Learning Goals
- What the learner will be able to do after this section

## Core Concepts
Explain the ideas clearly and concretely.
Use a \`\`\`mermaid diagram when a visual helps (architecture, flow, state, hierarchy).

## Step-by-Step Walkthrough
Break the work into teachable steps.

## Example
Include a realistic example, code sample, prompt, checklist, or scenario when useful.
Prefer \`\`\`mermaid over ASCII art for any diagram.

## Practice
Give the learner a small exercise or reflection task.

## Common Mistakes
Call out likely misunderstandings and how to avoid them.

## Recap
Summarize the section in a few crisp bullets.`,
  quizGuide: {
    overview:
      'Sections support two quiz modes: (1) sectionType "quiz" — standalone quiz with no Markdown body; (2) sectionType "lesson" with questions — Markdown content followed by an embedded knowledge-check quiz.',
    whenToUseStandalone:
      'Use sectionType "quiz" for dedicated assessments at the end of a module (e.g. "Module 1 Knowledge Check"). The reader shows only the quiz UI, no lesson content.',
    whenToEmbed:
      'Use an embedded quiz (sectionType "lesson" + questions) for quick comprehension checks right after an explanation. The learner reads the lesson, then immediately answers 2-4 questions.',
    questionTypes: {
      multiple_choice:
        'One correct answer from 2-4 options. correctAnswer: option index as a number (0-based). Example: correctAnswer: 1 means the second option is correct.',
      true_false:
        'Binary question. Do not provide options (auto True/False). correctAnswer: "true" or "false" (string).',
      multi_select:
        'Multiple correct answers from a list. correctAnswer: array of correct option indices, e.g. [0, 2].',
      short_answer:
        'Free-text answer. No auto-grading — learner self-checks against the reference. correctAnswer: reference answer string shown after submission.',
    },
    bestPractices: [
      'Include 3-7 questions per quiz. More than 7 feels like a test; fewer than 3 feels trivial.',
      'Always provide an explanation for each question — it reinforces learning after the answer is revealed.',
      'Mix question types to test different cognitive levels: recall (MC/TF), application (short_answer), analysis (multi_select).',
      'Make distractors (wrong options) plausible — avoid obviously wrong answers.',
      'For lesson-embedded quizzes, keep it to 2-4 questions focused on the section just read.',
      'For standalone quiz sections, cover the whole module with 5-7 varied questions.',
    ],
    toolFlow:
      'CANONICAL TOOL: Always use set_quiz_questions(sectionId, questions[]) to set or replace quiz questions — this is the single source of truth. Do NOT use the questions param on add_section or update_section; those are deprecated and may be removed. Workflow: create the section first with add_section (no questions), then immediately call set_quiz_questions with the full questions array.',
    correctAnswerFormats: {
      multiple_choice: 'number (0-based index of correct option)',
      true_false: '"true" or "false" (string)',
      multi_select: 'array of numbers, e.g. [0, 2]',
      short_answer: 'string (reference answer shown after submit)',
    },
  },
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
    'DIAGRAMS: Always use ```mermaid fenced blocks for any diagram or visual. Never use ASCII art (pipes, dashes, box-drawing chars). The reader renders Mermaid as interactive SVG automatically.',
    'MATH: Use LaTeX syntax for all formulas — $...$ for inline, $$...$$ for display math. Never put equations in code blocks.',
  ],
};
