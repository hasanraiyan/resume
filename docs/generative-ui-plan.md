# Generative UI in Our Chatbot — Analysis & Plan

## How the Article Maps to Our Chatbot

### Application surface

We use **Chat (threaded interaction)**:

- Turn-based, message-driven flow.
- Our app mediates all agent communication (stream, tools, status).
- Generative UI today: inline **status cards** (tool_action) and **markdown** in assistant bubbles.

We are **not** doing Chat+ (side canvas) or Chatless (no chat). Staying with Chat is the right fit for support/Q&A and guiding visitors to contact.

### Attributes

| Attribute   | Our current state                                                                                                                  | After plan (target)                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Freedom** | Mostly **open-ended text** (markdown). Tool status is fixed (ToolCard).                                                            | **Static** for tool results: predefined ProjectCard, ArticleCard, etc. Optional **declarative** later (small JSON spec). |
| **Control** | **Programmer**: we define tools and when to show “Loading…” cards. **Agent**: only chooses which tool and what to say in markdown. | Same: programmer defines components and when they’re sent; agent still only picks tools and writes text.                 |

### Three types from the article

| Type            | Article meaning                                                      | Our use                                                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Static**      | Hand-built components; agent (or backend) picks which to show.       | **Target**: when a tool returns projects/articles/search results, we emit a **UI block** (e.g. `ProjectCard`, `ArticleList`) and the frontend renders it. No new components from the LLM. |
| **Declarative** | Agent returns a structured spec (cards, lists); frontend interprets. | **Optional later**: e.g. a small “card spec” (title, description, link, type) so we can add new card types without new stream event types.                                                |
| **Open-ended**  | Full HTML/iframes from agent.                                        | **Not planned**: security, styling, and maintainability concerns; our use case doesn’t need it.                                                                                           |

---

## What we already have (partial Generative UI)

- **Tool status as UI**: When the backend runs a tool, we send `{ type: 'status', message }` and the frontend shows a **ToolCard** (pending/done). That is **static generative UI**: programmer-defined component, backend decides when it appears.
- **StepHistory**: Collapsible “Performed N actions” with icons — again programmer-defined, driven by tool execution.

What we’re **missing**:

- **Rich result UI**: After a tool returns (e.g. list of projects, one project, search results), we only use that data inside the **model** (as tool result text). The frontend never gets structured data to render as **cards/lists**; it only shows the AI’s markdown summary. So we don’t yet have “generative UI” for **tool results**.

---

## Plan: Add static generative UI for tool results

Goal: keep the same chat surface and control model (programmer-defined components), and add **inline rich blocks** for projects, articles, and search results so the thread feels more like the article’s “Chat (threaded)” examples (cards/blocks inline).

### Phase 1 — Stream UI blocks (static, programmer-controlled)

**Idea:** When a tool returns data, the backend emits a **UI event** in the same stream alongside (or instead of) relying only on the model’s markdown. The frontend renders a fixed set of components.

1. **New stream event type**
   - Add events like:  
     `{ type: 'ui', component: string, payload: object }`
   - `component` is one of: `project_card` | `project_list` | `article_card` | `article_list` | `search_results`.
   - `payload` is a fixed shape per component (e.g. for `project_card`: title, slug, description, tagline, links, category).

2. **Backend (chat route)**
   - After `executeToolCall(toolCall)`:
     - Keep sending the **text** tool result to the model (so the AI can still reason and summarize).
     - In addition, if the result is “renderable” (e.g. list of projects, one project, articles, search hits), call a small helper `getUIBlockForToolResult(toolName, toolResult)` that returns `{ component, payload }` or `null`.
     - If non-null, `controller.enqueue(encodeEvent({ type: 'ui', ... }))` so the client gets the block in order with the rest of the stream.

3. **Frontend (ChatbotWidget)**
   - In the NDJSON loop, handle `data.type === 'ui'`:
     - Push a message (or append to a “current” assistant block) with `role: 'assistant'` and something like `uiBlocks: [{ id, component, payload }]`.
   - Message bubble rendering:
     - If a message has `uiBlocks`, render **StaticGenUI** (see below) above or below the markdown content.
   - **StaticGenUI** component:
     - Switch on `component`: render `<ProjectCard payload={...} />`, `<ProjectList items={...} />`, `<ArticleCard />`, `<ArticleList />`, `<SearchResults />`.
   - All components are hand-crafted in our codebase; no HTML from the LLM.

4. **Tool result shapes**
   - `listAllProjects` → array of `{ title, slug, description }` → `component: 'project_list'`, payload `{ items }`.
   - `getProjectDetails` → single project → `component: 'project_card'`, payload project fields.
   - `listAllArticles` → `article_list`.
   - `getArticleDetails` → `article_card`.
   - `searchPortfolio` → mixed list with type + slug → `search_results` (list of { type, title, slug, description/excerpt }).

5. **Backward compatibility**
   - If the client doesn’t handle `type: 'ui'`, it can ignore it; the conversation still works via markdown.
   - Keep existing `content` and `status` events unchanged.

Deliverables:

- `src/lib/chatbot-utils.js`: add `getUIBlockForToolResult(toolName, toolResult)` (or in a small `src/lib/ai/gen-ui.js`).
- `src/app/api/chat/route.js`: after each tool execution, optionally enqueue one (or more) `ui` events.
- `src/components/chatbot/`: `StaticGenUI.js` (or inline in ChatbotWidget) + `ProjectCard.js`, `ArticleCard.js`, `ProjectList.js`, `ArticleList.js`, `SearchResults.js` (can be minimal at first).
- `ChatbotWidget.js`: handle `type: 'ui'`, attach `uiBlocks` to the current assistant message, render StaticGenUI in the bubble.

### Phase 2 — Optional: declarative spec (small schema)

If we want to add new card types without new event types:

- Define a tiny **card spec** (e.g. `{ type: 'card', title, description, href, meta?, image? }`).
- Backend can emit `{ type: 'ui', component: 'card', payload: spec }` or a small list of specs.
- Frontend has a single **Card** (or **DeclarativeCard**) that renders from the spec. Later we can add more spec fields (e.g. badges, CTA) without new components.

This stays “declarative” in the article’s sense: structured spec, one renderer; we do **not** move to open-ended HTML.

### Phase 3 — Optional: Chat+ style “canvas”

Only if we later want a “co-creator” experience:

- Add a second pane (e.g. right side or below chat) that shows a **canvas** of generated items (e.g. “Projects you’ve looked at this session”).
- Same UI blocks can be sent to both the thread and the canvas (e.g. `target: 'thread' | 'canvas'` in the event).
- No change to the agent or tools; only layout and where we render the same static/declarative blocks.

---

## Summary

- **Article:** Surfaces (Chat / Chat+ / Chatless), attributes (freedom vs control), and three types (Static, Declarative, Open-ended).
- **Us:** We’re Chat + programmer-controlled. We already have static UI for **tool status**. We’re missing static UI for **tool results**.
- **Plan:** Add stream events `type: 'ui'` with fixed `component` + `payload`, render them with hand-built components (Phase 1). Optionally add a small declarative card spec (Phase 2) and/or a canvas (Phase 3) later.

This keeps our stack (Next.js, streaming, existing tools) and aligns our chatbot with the “Generative UI” idea in a way that’s maintainable and consistent with the article’s **Static** (and later **Declarative**) approaches.
