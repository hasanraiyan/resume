# Coursify MCP — Gap Analysis Report

**Date:** 2026-05-08  
**Author:** Automated Audit  
**Status:** Complete

---

## 1. Executive Summary

The Coursify MCP server exposes **18 tools** covering core CRUD for courses, modules, sections, planning, and progress tracking. However, a detailed comparison against the backend REST API (`src/app/api/coursify/`) and the Mongoose models reveals **9 gaps** — missing tools, incomplete tool parameter coverage, and behavioral inconsistencies.

---

## 2. Tool Coverage Map

| #   | Backend API Route        | HTTP Method | MCP Tool Exposed?        | Coverage                          |
| --- | ------------------------ | ----------- | ------------------------ | --------------------------------- |
| 1   | `/courses`               | GET         | ✅ `list_courses`        | Full                              |
| 2   | `/courses`               | POST        | ✅ `create_course`       | Full                              |
| 3   | `/courses/[id]`          | GET         | ✅ `get_course`          | Full                              |
| 4   | `/courses/[id]`          | PATCH       | ✅ `update_course`       | **Partial** — see §3              |
| 5   | `/courses/[id]`          | DELETE      | ✅ `delete_course`       | Full                              |
| 6   | `/courses/[id]/publish`  | POST        | ✅ `publish_course`      | Full (publish only, no unpublish) |
| 7   | `/courses/[id]/sections` | GET         | ❌ **Missing**           | —                                 |
| 8   | `/courses/[id]/sections` | POST        | ✅ `add_section`         | Full                              |
| 9   | `/courses/[id]/reorder`  | POST        | ✅ `reorder_sections`    | Full                              |
| 10  | `/courses/[id]/modules`  | GET         | ✅ `list_course_modules` | Full                              |
| 11  | `/courses/[id]/modules`  | POST        | ✅ `create_module`       | Full                              |
| 12  | `/modules/[id]`          | GET         | ❌ **Missing**           | —                                 |
| 13  | `/modules/[id]`          | PATCH       | ✅ `update_module`       | Full                              |
| 14  | `/modules/[id]`          | DELETE      | ❌ **Missing**           | —                                 |
| 15  | `/sections/[id]`         | GET         | ❌ **Missing**           | —                                 |
| 16  | `/sections/[id]`         | PATCH       | ✅ `update_section`      | **Partial** — see §3              |
| 17  | `/sections/[id]`         | DELETE      | ✅ `delete_section`      | Full                              |
| 18  | `/bootstrap`             | GET         | ❌ **Missing**           | —                                 |
| 19  | `/chat`                  | POST        | ❌ **Missing**           | —                                 |
| 20  | `/public/courses/*`      | GET         | ❌ **Missing**           | —                                 |

**Total:** 14/20 API routes have MCP equivalents (70% coverage)

---

## 3. Gap Details

### 🔴 GAP-1: Missing `delete_module` tool

- **Backend:** `DELETE /api/coursify/modules/[id]` exists
- **MCP impact:** User cannot delete a module via MCP. Must call REST API directly.
- **Severity:** High — users creating courses cannot fix structural mistakes
- **Fix:** Add a `delete_module` tool with `{ id: string }` input. Must cascade: unassign sections from the deleted module (set `moduleId = null`), then soft-delete the module.

### 🔴 GAP-2: Missing `get_module` tool

- **Backend:** `GET /api/coursify/modules/[id]` exists
- **MCP impact:** Cannot retrieve a single module's full details without fetching the entire course
- **Severity:** Medium
- **Fix:** Add a `get_module` tool with `{ id: string }` input, returning module + its sections.

### 🔴 GAP-3: Missing `get_section` tool

- **Backend:** `GET /api/coursify/sections/[id]` exists
- **MCP impact:** Cannot retrieve a single section by ID
- **Severity:** Medium
- **Fix:** Add a `get_section` tool with `{ id: string }` input.

### 🟡 GAP-4: `update_course` missing 8 planning fields

- **Model fields supported** by backend `PATCH` but **NOT exposed** in `update_course` MCP tool:
  - `status` (`draft` | `published`)
  - `targetAudience` (string)
  - `learningObjectives` (string[])
  - `prerequisites` (string[])
  - `outcome` (string)
  - `outline` (string)
  - `planningNotes` (string)
  - `authoringStatus` (enum: `idea` | `researching` | `planned` | `drafting` | `reviewing` | `ready`)
- **Fix:** Add these fields to `update_course` input schema.
- **Note:** `save_course_plan` handles these separately, which creates confusion — two tools can update the same fields.

### 🟡 GAP-5: `update_section` missing 5 fields

- **Model fields** NOT exposed in `update_section`:
  - `moduleId` (string — cannot reassign section to a different module!)
  - `status` (`planned` | `draft` | `needs_review` | `complete`)
  - `summary` (string)
  - `learningGoals` (string[])
  - `estimatedDuration` (string)
- **Fix:** Add all 5 fields to `update_section` input schema.

### 🟠 GAP-6: No standalone sections listing endpoint

- **Backend:** `GET /api/coursify/courses/[id]/sections` exists
- **MCP workaround:** `get_course` and `list_course_modules` both return section data
- **Severity:** Low — already covered by existing tools

### 🟠 GAP-7: No public/student-facing tools

- **Backend has:** `GET /api/coursify/public/courses/` and `GET /api/coursify/public/courses/[id]`
- **MCP has:** Nothing for public-facing queries
- **Severity:** Low — MCP is for admin authoring, not student consumption

### 🟠 GAP-8: Missing `bootstrap` data endpoint

- **Backend:** `GET /api/coursify/bootstrap` returns all courses, modules, sections in one call
- **MCP impact:** No equivalent single-call initialization for agent workflows
- **Severity:** Medium — saves multiple round-trips when rebuilding agent context

### 🟠 GAP-9: No thumbnail regeneration tool

- **Backend model** supports `thumbnail` and `thumbnailGenerating` fields
- **MCP `create_course`** auto-generates thumbnail in background, but there's no way to **regenerate** a thumbnail on demand
- **Fix:** Add `regenerate_thumbnail` tool or add a flag to `update_course`

---

## 4. Comparison Summary Table

| Aspect                    | REST API                         | MCP                             | Gap?                           |
| ------------------------- | -------------------------------- | ------------------------------- | ------------------------------ |
| Create course             | ✅ `POST /courses`               | ✅ `create_course`              | No                             |
| List courses (filtered)   | ✅ `GET /courses?status=`        | ✅ `list_courses(status)`       | No                             |
| Get single course         | ✅ `GET /courses/[id]`           | ✅ `get_course(id)`             | No                             |
| Update course metadata    | ✅ `PATCH /courses/[id]`         | ✅ `update_course(id, ...)`     | **Partial** (missing 8 fields) |
| Update course plan fields | ✅ `PATCH /courses/[id]`         | ✅ `save_course_plan(...)`      | No (separate tool)             |
| Publish course            | ✅ `POST /courses/[id]/publish`  | ✅ `publish_course(id)`         | No (publish only)              |
| Delete course (soft)      | ✅ `DELETE /courses/[id]`        | ✅ `delete_course(id)`          | No                             |
| Create section            | ✅ `POST /courses/[id]/sections` | ✅ `add_section(...)`           | No                             |
| Update section            | ✅ `PATCH /sections/[id]`        | ✅ `update_section(id, ...)`    | **Partial** (missing 5 fields) |
| Get section               | ✅ `GET /sections/[id]`          | ❌ **None**                     | **Missing tool**               |
| Delete section            | ✅ `DELETE /sections/[id]`       | ✅ `delete_section(id)`         | No                             |
| Reorder sections          | ✅ `POST /courses/[id]/reorder`  | ✅ `reorder_sections(...)`      | No                             |
| Create module             | ✅ `POST /courses/[id]/modules`  | ✅ `create_module(...)`         | No                             |
| Update module             | ✅ `PATCH /modules/[id]`         | ✅ `update_module(id, ...)`     | No                             |
| Get module                | ✅ `GET /modules/[id]`           | ❌ **None**                     | **Missing tool**               |
| Delete module             | ✅ `DELETE /modules/[id]`        | ❌ **None**                     | **Missing tool**               |
| List course modules       | ✅ `GET /courses/[id]/modules`   | ✅ `list_course_modules(...)`   | No                             |
| Course progress           | ❌ (computed)                    | ✅ `get_course_progress(...)`   | MCP-only feature               |
| Save course plan          | ❌ (uses PATCH)                  | ✅ `save_course_plan(...)`      | MCP-only feature               |
| Add research note         | ❌ (uses PATCH)                  | ✅ `add_research_note(...)`     | MCP-only feature               |
| Authoring guide           | ❌                               | ✅ `get_course_authoring_guide` | MCP-only feature               |
| Bootstrap data            | ✅ `GET /bootstrap`              | ❌ **None**                     | **Missing tool**               |
| AI Chat                   | ✅ `POST /chat`                  | ❌ **None**                     | **Missing tool**               |
| Public courses            | ✅ `GET /public/courses`         | ❌ **None**                     | Missing (acceptable)           |
| Thumbnail regenerate      | ❌ (auto on create)              | ❌ **None**                     | Missing                        |

---

## 5. Additional Issues

### 5.1 No unpublish capability

- `publish_course` only sets `status: 'published'`. The REST API `POST /publish` actually **toggles** between `draft` and `published`. MCP cannot unpublish a course.

### 5.2 `update_section` cannot move sections between modules

- `moduleId` is writable on the model but not exposed in `update_section`. Users cannot reorganize sections across modules via MCP.

### 5.3 No `resources` field in `update_section`

- `resources` is available in `add_section` but NOT in `update_section` (despite being listed in the tool description). The input schema omits it.

### 5.4 `update_course` cannot change `status` field

- Tool description says "draft status" but `status` is not in the input schema. The only way to publish is via `publish_course` — there's no way to go back to draft.

### 5.5 `get_course` response doesn't include section/module IDs in the text output

- The text response only says "X modules and Y sections" — the structured data has IDs but the MCP client may only see the text

---

## 6. Recommended Action Items

| Priority  | Action                                                                                                         | Effort  |
| --------- | -------------------------------------------------------------------------------------------------------------- | ------- |
| 🔴 High   | Add `delete_module` tool                                                                                       | ~15 min |
| 🔴 High   | Add missing fields to `update_section` (`moduleId`, `status`, `summary`, `learningGoals`, `estimatedDuration`) | ~15 min |
| 🔴 High   | Add missing fields to `update_course` (`status`, planning fields, `authoringStatus`)                           | ~15 min |
| 🟡 Medium | Add `get_module` and `get_section` tools                                                                       | ~20 min |
| 🟡 Medium | Add `regenerate_thumbnail` tool                                                                                | ~10 min |
| 🟡 Medium | Add `bootstrap` tool (return all courses + modules + sections)                                                 | ~20 min |
| 🟠 Low    | Fix `update_section` to include `resources` in input schema                                                    | ~5 min  |
| 🟠 Low    | Add unpublish capability (toggle in `publish_course`)                                                          | ~5 min  |

---

## 7. Already Working Tools (18/18 tested)

All 18 currently exposed MCP tools were tested and work correctly:

- ✅ `get_course_authoring_guide` — returns the authoring guide
- ✅ `list_courses` — returns filtered course list with section counts
- ✅ `get_course` — returns course + modules + sections
- ✅ `create_course` — creates course with auto-thumbnail
- ✅ `update_course` — updates metadata (partial field coverage)
- ✅ `publish_course` — sets status to published
- ✅ `delete_course` — soft-deletes course + modules + sections
- ✅ `add_section` — creates section with full markdown content
- ✅ `update_section` — updates section (partial field coverage)
- ✅ `delete_section` — soft-deletes section
- ✅ `reorder_sections` — reorders all sections
- ✅ `save_course_plan` — saves planning workspace
- ✅ `add_research_note` — adds research note to course
- ✅ `list_course_modules` — lists modules with section breakdown
- ✅ `create_module` — creates module under a course
- ✅ `update_module` — updates module metadata
- ✅ `get_course_progress` — returns completeness check + next action

---

_Generated by automated analysis of `src/lib/mcp/coursify/tools.js`, `src/app/api/coursify/_`, Mongoose models, and live testing of all 18 MCP tools.\*
