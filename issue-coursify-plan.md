## Problem

Coursify currently models only `Course` and flat `Section` records. That is too simple for AI-generated courses, because detailed course creation is a multi-step workflow: research the topic, think through learner goals, draft an outline, organize modules, then write sections one by one.

The new MCP authoring guide already tells AI to plan and research before writing, but there is nowhere in the app to persist that thinking. If the model disconnects, changes topic, or needs to resume, the plan/research context is lost.

## Current Files To Refactor

- `src/models/CoursifyCourse.js`: course metadata only; no target audience, learning objectives, prerequisites, outline, research notes, or planning state.
- `src/models/CoursifySection.js`: sections are flat under a course; no module/grouping layer and no section status.
- `src/lib/mcp/coursify/constants.js`: authoring guide now describes a research-first, plan-first workflow, but persistence does not support it.
- `src/lib/mcp/coursify/tools.js`: MCP can list/get/create courses and add sections, but cannot save a course plan, modules, research notes, or progress state.
- `src/app/apps/coursify/[id]/page.js`: UI renders a flat section list and has no workspace for course planning/research/module outline.
- `src/app/api/coursify/**`: API routes mirror the simple course/section model and need shared validation/schema support for the richer structure.

## Proposed Product Model

Move Coursify from a flat `Course -> Section` structure to a planning-friendly structure:

```txt
Course
  Planning Workspace
    targetAudience
    learningObjectives[]
    prerequisites[]
    outcome
    coursePlan / outline
    researchNotes[]
    sourceNotes[]
    authoringStatus
  Modules[]
    title
    summary
    learningGoals[]
    order
    status
    Sections[]
      title
      content
      order
      status
      resources[]
```

## Data Model Plan

1. Extend `CoursifyCourse` with planning fields:
   - `targetAudience: String`
   - `learningObjectives: [String]`
   - `prerequisites: [String]`
   - `outcome: String`
   - `outline: String` or structured `outlineItems`
   - `researchNotes: [{ title, summary, sourceUrl, sourceType, accessedAt, notes }]`
   - `authoringStatus: enum ['idea', 'researching', 'planned', 'drafting', 'reviewing', 'ready', 'published']`
   - `planningNotes: String`
2. Add a `CoursifyModule` model:
   - `courseId`
   - `title`
   - `summary`
   - `learningGoals: [String]`
   - `order`
   - `status: enum ['planned', 'drafting', 'complete', 'needs_review']`
   - soft-delete fields and `syncVersion`
3. Update `CoursifySection`:
   - add `moduleId`
   - add `status: enum ['planned', 'draft', 'needs_review', 'complete']`
   - optionally add `summary`, `learningGoals`, `estimatedDuration`
   - keep backward compatibility for existing sections without `moduleId`

## MCP Tool Plan

Add/adjust tools so the AI can work in a real multi-step loop:

1. `save_course_plan`
   - Use after research and before section writing.
   - Stores target audience, objectives, prerequisites, outcome, outline, and planned modules.
2. `add_research_note`
   - Stores topic research, source notes, links, assumptions, and key takeaways.
3. `list_course_modules`
   - Shows modules and section progress.
4. `create_module`
   - Creates a module under a course.
5. `update_module`
   - Revises title, summary, order, goals, or status.
6. Update `add_section`
   - Accept optional `moduleId`.
   - Encourage one section at a time after research and module planning.
7. `get_course_progress`
   - Returns course plan completeness, modules, section statuses, missing content, and next recommended action.

## API/UI Plan

1. Add API routes for modules:
   - `GET/POST /api/coursify/courses/[id]/modules`
   - `PATCH/DELETE /api/coursify/modules/[id]`
   - `POST /api/coursify/courses/[id]/modules/reorder`
2. Add course planning endpoints:
   - `PATCH /api/coursify/courses/[id]/plan`
   - `POST /api/coursify/courses/[id]/research-notes`
3. Update bootstrap/detail routes to include modules, plan fields, and grouped sections.
4. Update `src/app/apps/coursify/[id]/page.js`:
   - Add a Planning tab/workspace.
   - Show target audience, objectives, prerequisites, research notes, and outline.
   - Replace flat sidebar with `Module -> Section` grouping.
   - Show progress/status badges for modules and sections.
5. Update create/edit modals to support richer metadata where useful.

## Migration/Backward Compatibility

- Existing courses keep working.
- Existing sections without `moduleId` should appear under an automatic `Uncategorized` or `Legacy sections` group until assigned.
- Keep `Course.status` for public visibility, but use `authoringStatus` for creation workflow state.

## Acceptance Criteria

- AI can save a course plan before creating sections.
- AI can save research/source notes and retrieve them later.
- Courses can contain modules, and modules can contain ordered sections.
- Existing Coursify courses/sections still render after migration.
- MCP tools support the intended loop: research -> save plan -> create modules -> add sections sequentially -> review progress -> publish.
- UI shows a useful planning workspace and module-based course outline.
- Publish flow can later validate readiness using module/section status.

## Notes

This should be implemented before deeper publish-quality checks, because quality gates need structured plan/module/section state to inspect.
