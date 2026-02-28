# Chatbot Codebase Analysis — Progress Report

Focused analysis of the **chatbot-only** code and progress made (especially toward the Generative UI plan).

---

## 1. Current Architecture (unchanged)

| Layer       | File(s)                                   | Role                                                                 |
| ----------- | ----------------------------------------- | -------------------------------------------------------------------- |
| **API**     | `src/app/api/chat/route.js`               | POST handler: context, streaming, tool loop, analytics, ChatLog      |
| **Context** | `src/lib/ai/context-builder.js`           | Cached identity, about, projects/articles overview, chatbot settings |
| **Tools**   | `src/lib/chatbot-utils.js`                | Tool definitions, execution, status messages, context pruning        |
| **UI**      | `src/components/chatbot/ChatbotWidget.js` | Chat UI, stream consumer, tool cards, StepHistory, message bubbles   |
| **Admin**   | `src/app/api/admin/chatbot/route.js`      | GET/POST chatbot settings (POST admin-only)                          |
| **Models**  | `ChatbotSettings`, `ChatLog`              | Config singleton, per-turn logs                                      |

---

## 2. Progress Made (Generative UI — Phase 1)

Phase 1 from `docs/generative-ui-plan.md` is **largely done**. Summary:

### 2.1 Backend

- **`src/app/api/chat/route.js`**
  - Imports `getUIBlockForToolResult` from `@/lib/chatbot-generative-ui`.
  - After each `executeToolCall()`:
    1. Calls `getUIBlockForToolResult(toolName, toolResult)` and, if non-null, enqueues `{ type: 'ui', ...uiBlock }`.
    2. Uses `toolResult.text` (or string fallback) for the LLM and for `messages.push({ role: 'tool', content: stringResultForLLM })`.
  - Tool results are now expected to be `{ text, data }` (or error shape); string extraction is consistent.

- **`src/lib/chatbot-generative-ui.js`** (new)
  - `getUIBlockForToolResult(toolName, rawResult)` maps:
    - `listAllProjects` → `{ component: 'project_list', payload: { items } }`
    - `getProjectDetails` → `{ component: 'project_card', payload: project }`
    - `listAllArticles` → `{ component: 'article_list', payload: { items } }`
    - `getArticleDetails` → `{ component: 'article_card', payload: article }`
    - `searchPortfolio` → `{ component: 'search_results', payload: { items } }`
  - Returns `null` for errors, strings, or missing `data`.

- **`src/lib/chatbot-utils.js`**
  - All tool functions now return **dual shape** `{ text, data }` (or `{ error, text }` on failure):
    - `listAllProjects`: `{ text: markdown, data: projects }`, with `.select('... thumbnail tagline category')`.
    - `getProjectDetails`: `{ text: markdown, data: project }`.
    - `listAllArticles`: `{ text: markdown, data: articles }`, with `coverImage`, `publishedAt`.
    - `getArticleDetails`: `{ text: markdown, data: article }`.
    - `searchPortfolio`: `{ text: markdown, data: results }` when results exist.
  - LLM still receives only the `text` (markdown); `data` is used for UI blocks.

### 2.2 Frontend

- **`src/components/chatbot/ChatbotWidget.js`**
  - Imports `StaticGenUI`.
  - `assistantMessage` initial state includes `uiBlocks: []`.
  - On **`data.type === 'ui'`**: appends to `assistantMessage.uiBlocks` (with duplicate check), then updates messages so the assistant message includes `uiBlocks`.
  - When starting a new bubble (e.g. after tool status), resets `assistantMessage.uiBlocks = []`.
  - On **`data.type === 'content'`**: keeps existing `uiBlocks` (via `...m`) when updating content.
  - Renders **above the bubble**: `message.uiBlocks?.length > 0` → `message.uiBlocks.map(block => <StaticGenUI key=... block={block} />)`.

- **`src/components/chatbot/StaticGenUI.js`** (new)
  - Single entry: `StaticGenUI({ block })` → switch on `block.component` and render:
    - **ProjectList**: horizontal scroll, thumbnails, title, tagline/category, link to `/projects/[slug]`.
    - **ProjectCard**: thumbnail, title, category/tagline, description, “View Full Case Study”, optional live/github links.
    - **ArticleList**: horizontal scroll, coverImage, title, excerpt, link to `/blog/[slug]`.
    - **ArticleCard**: “Article” badge, optional date, title, excerpt, “Read Full Article”.
    - **SearchResults**: mixed list with type badge, thumbnail/icon, title, excerpt/description, link via `item.url`.

---

## 3. What’s Working Well

- **Stream contract**: `status` → `ui` (zero or more) → `content` is consistent; UI blocks appear before or with the assistant text.
- **Duplicate UI blocks**: Deduplication by `component` + `payload` avoids double cards when the same tool result is used.
- **Backward compatibility**: Clients that ignore `type: 'ui'` still get full behavior via markdown.
- **Separation**: Gen UI mapping lives in `chatbot-generative-ui.js`; tools stay in `chatbot-utils.js`; rendering in `StaticGenUI.js`.

---

## 4. Small Fixes / Inconsistencies

| Issue                          | Location                             | Recommendation                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project links in card**      | `StaticGenUI.js` `ProjectCard`       | Card uses `project.liveUrl` / `project.githubUrl`, but DB/API use `project.links.live` and `project.links.github`. Either normalize in `getUIBlockForToolResult` (e.g. `liveUrl: data.links?.live`, `githubUrl: data.links?.github`) or use `project.links?.live` and `project.links?.github` in the component.                                       |
| **Article date field**         | `StaticGenUI.js` `ArticleCard`       | Component uses `article.publishedDate`; model and list use `publishedAt`. Use `article.publishedAt` (or pass `publishedDate: article.publishedAt` in the payload) so the date shows.                                                                                                                                                                  |
| **searchPortfolio no-results** | `chatbot-utils.js` `searchPortfolio` | When `results.length === 0` it returns `{ message: "..." }` with no `text`. Chat route then sends `JSON.stringify(toolResult)` to the LLM. Prefer `return { text: \`No results found for "${query}". Try different keywords.\`, data: [] };`so the LLM gets plain text and you can still emit a`search_results` UI block with empty items if desired. |

---

## 5. Optional Improvements

- **Image sizing**: `ProjectCard` / `ProjectList` use Next.js `Image` with `fill`; ensure parent has explicit dimensions (e.g. `relative w-full h-32` or `aspect-video`) to avoid layout shift; you already have some of this.
- **Error UI**: When a tool returns `{ error, text }`, no UI block is emitted (correct). You could optionally emit a small “Something went wrong” block for consistency, but not required.
- **Content update and uiBlocks**: When updating the assistant message on `content` events, the code uses `{ ...m, content, completedTools }`. Because `m` already has `uiBlocks` from the earlier `ui` event, they are preserved. No change needed.

---

## 6. Progress vs Plan

| Plan (Phase 1)                                                                  | Status |
| ------------------------------------------------------------------------------- | ------ |
| New stream event `type: 'ui'` with `component` + `payload`                      | Done   |
| Backend: `getUIBlockForToolResult`, enqueue after tool run                      | Done   |
| Tools return `{ text, data }` and route uses `text` for LLM                     | Done   |
| Frontend: handle `type: 'ui'`, attach `uiBlocks` to assistant message           | Done   |
| StaticGenUI + ProjectCard, ProjectList, ArticleCard, ArticleList, SearchResults | Done   |
| Backward compatibility (ignore `ui` if unknown)                                 | Done   |

Phase 1 is **complete**. The only follow-ups are the small data-shape fixes above (links, publishedAt, search no-results).

---

## 7. File Checklist (chatbot-related)

| File                                      | Purpose                                                                |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `src/app/api/chat/route.js`               | Chat API, streaming, UI block emission                                 |
| `src/lib/ai/context-builder.js`           | Dynamic context (unchanged for Gen UI)                                 |
| `src/lib/chatbot-utils.js`                | Tools, execution, `{ text, data }` returns                             |
| `src/lib/chatbot-generative-ui.js`        | Map tool result → UI block                                             |
| `src/components/chatbot/ChatbotWidget.js` | Chat UI, stream handling, `uiBlocks`, StaticGenUI                      |
| `src/components/chatbot/StaticGenUI.js`   | project_list, project_card, article_list, article_card, search_results |
| `src/app/api/admin/chatbot/route.js`      | Settings GET/POST                                                      |
| `src/models/ChatbotSettings.js`           | Singleton config                                                       |
| `src/models/ChatLog.js`                   | Per-turn logs                                                          |

---

**Summary:** The chatbot now implements **Static Generative UI** for tool results: backend emits `type: 'ui'` with fixed components and payloads, and the frontend renders hand-built cards/lists inline. Addressing the three small data-shape issues (project links, article date, search no-results) will align behavior with the data model and improve robustness.
