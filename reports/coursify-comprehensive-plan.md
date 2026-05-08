# Coursify — Comprehensive Plan & Next-Year Roadmap

> **Date**: May 8, 2026
> **Context**: Full codebase exploration complete. This document summarizes what exists, what's missing, and the roadmap ahead.

---

## ✅ What Already Exists (Implemented)

### Data Models (`src/models/`)

| Model             | Status      | Fields                                                                                                                                                                                                                                                                                                                |
| ----------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CoursifyCourse`  | ✅ Complete | Planning workspace: targetAudience, learningObjectives[], prerequisites[], outcome, outline, planningNotes, researchNotes[], authoringStatus (idea→researching→planned→drafting→reviewing→ready→published). Existing fields: title, slug, description, thumbnail, status, difficulty, tags, soft-delete, syncVersion. |
| `CoursifyModule`  | ✅ Complete | courseId, title, summary, learningGoals[], order, status (planned→drafting→complete→needs_review), soft-delete, syncVersion.                                                                                                                                                                                          |
| `CoursifySection` | ✅ Complete | courseId, moduleId (nullable, backward-compat), title, sectionType, content, quiz (questions[]), summary, learningGoals[], estimatedDuration, order, status (planned→draft→needs_review→complete), resources[], soft-delete, syncVersion.                                                                             |

### API Routes (`src/app/api/coursify/`)

| Route                              | Methods            | Purpose                 |
| ---------------------------------- | ------------------ | ----------------------- |
| `/courses`                         | GET, POST          | List all, create course |
| `/courses/[id]`                    | GET, PATCH, DELETE | Single course CRUD      |
| `/courses/[id]/modules`            | GET, POST          | Module list/create      |
| `/courses/[id]/modules/reorder`    | POST               | Reorder modules         |
| `/modules/[id]`                    | PATCH, DELETE      | Module update/delete    |
| `/courses/[id]/plan`               | PATCH              | Save course plan        |
| `/courses/[id]/research-notes`     | POST               | Add research notes      |
| `/courses/[id]/publish`            | POST               | Publish course          |
| `/courses/[id]/sections`           | GET, POST          | Section CRUD            |
| `/sections/[id]`                   | PATCH, DELETE      | Single section CRUD     |
| `/courses/[id]/reorder`            | POST               | Reorder sections        |
| `/courses/[id]/thumbnail`          | POST               | Generate thumbnail      |
| `/bootstrap`                       | GET                | Single-call data load   |
| `/chat`                            | POST               | AI course chat agent    |
| `/studio`                          | POST               | AI studio agent         |
| `/public/courses`                  | GET                | Public course listing   |
| `/public/courses/[id]`             | GET                | Public course detail    |
| `/maintenance/backfill-thumbnails` | POST               | Maintenance             |

### MCP Tools (`src/lib/mcp/coursify/tools.js`)

18 tools registered:

- **Read-only**: `get_course_authoring_guide`, `list_courses`, `get_course`, `suggest_modules_from_outline`, `list_course_modules`, `get_section_content`, `get_course_progress`
- **Planning**: `save_course_plan`, `add_research_note`, `research_findings` (batch)
- **Modules**: `create_module`, `update_module`, `delete_module`, `reorder_modules`
- **Sections**: `add_section`, `update_section`, `delete_section`, `reorder_sections`, `set_quiz_questions`
- **Courses**: `create_course`, `update_course`, `publish_course`, `delete_course`

### AI Agents

- `coursify-chat-agent.js` — Course Q&A chatbot
- `coursify-thumbnail-agent.js` — AI thumbnail generation agent
- `coursify-studio` agent (via studio API route)

### Public Pages

- `/coursify` — Course listing page
- `/coursify/[slug]` — Course reader with:
  - Header component
  - Sidebar (module navigation)
  - Mermaid diagram rendering
  - Quiz support
  - Offline-ready

---

## ❌ What's Missing / Needs Work

### 1. 🖥️ **Dedicated Coursify Admin Dashboard** (HIGH PRIORITY)

There is **no dedicated admin UI** for Coursify. The current admin has:

- Generic "App Builder" for creating mini-apps
- No Coursify course management dashboard
- No way to visually create/edit courses, modules, sections

**Needed**: A full admin dashboard at `/admin/coursify/` with:

- **Course List**: Grid/table of all courses with search, filter, status badges
- **Course Editor** with tabs:
  - **Planning tab**: Target audience, objectives, prerequisites, outcome, outline, research notes viewer, authoring status workflow
  - **Structure tab**: Module → Section tree (drag-to-reorder), create/edit/delete modules and sections
  - **Content tab**: Rich text editor for section Markdown content, quiz builder
  - **Publish tab**: Readiness checklist, publish/unpublish
  - **Settings tab**: Metadata, difficulty, tags, thumbnail

### 2. 📚 **Reader UI — Module→Section Grouping** (MEDIUM PRIORITY)

The reader sidebar needs to show the Module → Section hierarchy properly (already supported by data model). Current sidebar may be flat.

### 3. 🎯 **Publishing Pipeline — Quality Gates** (MEDIUM PRIORITY)

The publish route exists but could be enhanced with:

- Minimum sections per module check
- Learning objectives coverage validation
- Content length minimums
- All sections must be "complete" status
- Review workflow approval step

### 4. 🧪 **Course Marketplace / Discovery** (LOW PRIORITY)

- `/coursify` page needs: search, category/tag filtering, sorting
- Course enrollment tracking
- Ratings and reviews

### 5. 📈 **Analytics & Progress** (LOW PRIORITY)

- View tracking for courses
- Completion tracking
- Admin dashboard with Coursify metrics

### 6. 🎓 **Certificate System** (FUTURE)

- Generate certificates on course completion
- Public verification links

---

## 🗺️ Q2–Q4 2026 Roadmap

### Phase 1 (May–June 2026) — Admin UI Overhaul

- [ ] Create `/admin/coursify/` dashboard page with course listing
- [ ] Build course editor with tabs (planning, structure, content, publish)
- [ ] Add Planning tab workspace (target audience, objectives, outline, research notes)
- [ ] Add Structure tab with Module → Section tree
- [ ] Add Content editor with Markdown editor + quiz builder
- [ ] Add Publish flow with readiness validation
- [ ] Wire up existing API routes to the UI

### Phase 2 (July–August 2026) — Reader & Quality

- [ ] Enhance reader sidebar with Module→Section hierarchy
- [ ] Add progress tracking (continue where you left off)
- [ ] Bookmarking / note-taking within courses
- [ ] Code playground component for technical courses
- [ ] Module-level quizzes
- [ ] Quality gates in publish pipeline
- [ ] Auto-save for long authoring sessions

### Phase 3 (September–November 2026) — AI Authoring Copilot

- [ ] Dedicated Coursify Studio agent in the admin UI
- [ ] Auto-generate module structure from outline
- [ ] Content improvement suggestions
- [ ] Auto-generate quiz questions from section content
- [ ] Research assistant integration (fetch and summarize sources)
- [ ] Multi-section batch operations (reorder, restatus)

### Phase 4 (December 2026–February 2027) — Platform Growth

- [ ] Course categories / tags / search
- [ ] User accounts and course enrollment
- [ ] Ratings and reviews
- [ ] Course completion tracking
- [ ] Public course marketplace page
- [ ] Analytics dashboard

### Phase 5 (March–May 2027) — Monetization & Scale

- [ ] Stripe/PayPal for paid courses
- [ ] Coupon/discount system
- [ ] Subscription model
- [ ] Revenue dashboard
- [ ] PWA enhancements (better offline, push notifications)
- [ ] Community features (comments, discussions)

---

## 🎯 Immediate Next Steps (Right Now)

1. **Build the Coursify Admin Dashboard** — This is the biggest gap. Use the existing API routes and create dedicated admin pages.
2. **Wire up the Planning Workspace UI** — Make the `save_course_plan` MCP flow visual.
3. **Create the Module Editor** — Visual tree structure for modules → sections.
4. **Enhance the Reader Sidebar** — Show module grouping properly.

---

## Technical Architecture Notes

- All API routes use `requireAdminAuth` from `src/lib/money-auth.js`
- Models use the soft-delete pattern (`deletedAt`, `syncVersion`)
- MongoDB connection via `src/lib/dbConnect.js`
- Shared DB operations in `src/lib/coursify/db-ops.js` (used by both API routes and MCP tools)
- Admin layout is at `src/app/(admin)/admin/layout.js` with sidebar navigation
- Adding a "Coursify" nav item to the admin sidebar will be needed
- Components should be placed in `src/components/coursify/admin/` for admin-specific UI
