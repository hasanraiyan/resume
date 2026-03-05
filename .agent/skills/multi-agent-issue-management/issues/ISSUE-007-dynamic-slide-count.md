# Issue: Implement Dynamic Slide Count Selection

**ID**: ISSUE-007

## 🤖 Agent Assignment

**Primary Agent**: Codex
**Collaborators**: Antigravity

---

## 🎯 Objective

Allow the user to specify the exact number of slides they want generated in the Presentation Generator. Currently, the agent hardcodes "6-8" slides in its prompt. This feature adds a dropdown in the frontend and passes the selection down to the AI agent.

---

## 🛠️ Implementation Scope

### 📂 Allowed Directories/Files

- `src/components/tools/PresentationGenerator.js`
- `src/app/api/tools/presentation/outline/route.js`
- `src/lib/agents/ai/presentation-agent.js`

### ⚠️ Conflict Zones (DO NOT TOUCH)

- None

---

## 🚀 Requirements

1. **Frontend Dropdown (`PresentationGenerator.js`)**:
   - Add a new state variable: `const [slideCount, setSlideCount] = useState(7);`
   - In the `renderModal()` UI (or wherever the initial topic setup happens), add a clean `<select>` dropdown to let the user choose the number of slides. Example options: `5`, `7`, `10`, `12`.
   - Update the `handleDraftOutline` function to include `slideCount` in the JSON body when calling the `/outline` API route.

2. **API Route (`outline/route.js`)**:
   - Destructure `slideCount` from the incoming `req.json()` body (default to 7 if undefined).
   - Pass `slideCount` inside the configuration object when executing the `presentationAgent`: `await presentationAgent.execute({ action: 'draft_outline', topic, instructions, isAdmin, slideCount });`.

3. **Backend Agent (`presentation-agent.js`)**:
   - In `_onExecute(input)`, extract `slideCount` from `input` and pass it into the `this.draftOutline` method call.
   - Update the signature of `draftOutline(topic, extraInstructions = '', isAdmin = false, slideCount = 7)`.
   - Inside `draftOutline`, modify the system prompt. Change the hardcoded line from `Generate 6-8 slides with a clear arc: Title → Context → Deep Dives (with diagrams) → Key Insights → Conclusion/CTA.` to `Generate exactly ${slideCount} slides with a clear arc...`.

---

## 📝 Coordination Notes

- **Branch**: `agent/codex/feature-dynamic-slide-count`
- **Dependencies**: None
- **PR Strategy**: Implement the full vertical slice (Frontend -> API -> Agent prompt) and draft a PR.

---

**Priority**: Medium
**Status**: 🆕 Pending
