# Generative UI Plan: Inline Chat Contact Form

## Goal

Use the existing chatbot widget as a **guided intake** that can pop up a full **inline contact form UI inside the chat panel on any page**, so the user can review/edit and send a contact request without going to the homepage `#contact` section.

The inline form:

- is initially **expanded (not collapsed)** with editable fields and two primary actions (“Send” / “Decline”),
- after sending, is replaced by a **collapsed summary block** in the chat history so the conversation stays clean.

## Why this approach

- **Works everywhere**: chat is global, so the contact flow works from any page.
- **Higher completion rate**: chat asks only for missing info, then shows an inline form instead of sending the user away.
- **Better message quality**: AI helps structure and prefill content, user still has full control before sending.
- **Clear separation**: the homepage `Contact` section stays as-is; the chat uses its own contact-form UI component.

## Current codebase facts (integration anchors)

- **Contact form (reference)**: `src/components/Contact.js`
  - Fields: `name`, `email`, `projectType`, `message`
  - Submission path: server action `createContactSubmission` from `src/app/actions/contactActions.js`
  - This is the **source of truth for fields/validation rules**, but we will not scroll to or prefill it from chat.
- **Chat widget** (global): `src/components/chatbot/ChatbotWidget.js` mounted from `src/app/layout.js`
- **Chat API + streaming**: `src/app/api/chat/route.js`
  - Supports streamed events including `type: "ui"` blocks
  - Tooling helper: `src/lib/chatbot-utils.js`
  - Optional UI-block helper: `src/lib/chatbot-generative-ui.js`
- **Generative UI renderer**: `src/components/chatbot/StaticGenUI.js`
  - Renders different `ui` blocks returned by the chat API.

## UX flow (what users experience)

1. User chats normally from **any page**.
2. When the assistant decides a contact is appropriate, it shows an **inline “Contact form” UI block** in the chat:
   - editable fields: `name`, `email`, `projectType`, `message`
   - fields may be **pre-filled from the conversation** where possible
   - two buttons: **“Send as contact request”** and **“Decline”**
3. While it’s pending:
   - the form is **fully visible (not inside a collapse)** so it feels like a normal form.
4. If user clicks **Decline**:
   - the card collapses into a tiny “Contact request discarded” row (or disappears) to avoid clutter.
5. If user clicks **Send**:
   - chat calls the backend to create a `Contact` using the existing server logic,
   - on success, the visible form is replaced by a **collapsed “Contact request sent” block**:
     - shows a short success line,
     - can be expanded to see the full `name/email/projectType/message` that was sent.
6. Conversation continues below as normal.

## Data contract

Standardize a payload shape for the inline contact form block:

```json
{
  "type": "contact_form_inline",
  "id": "string-uuid-or-timestamp",
  "initialValues": {
    "name": "string",
    "email": "string",
    "projectType": "one of Contact.js options (or 'other')",
    "message": "string"
  },
  "meta": {
    "source": "chat",
    "pagePath": "optional string (where chat is open)"
  }
}
```

On successful send, we render a summary block using:

```json
{
  "type": "contact_form_summary",
  "id": "same-as-form-id",
  "status": "sent",
  "values": {
    "name": "string",
    "email": "string",
    "projectType": "string",
    "message": "string"
  },
  "sentAt": "ISO timestamp"
}
```

## Implementation plan (incremental)

### Phase 1 — Inline contact form UI card (no AI prefill yet)

**Goal**: render a reusable contact-form card entirely inside the chat UI, with Send/Decline + collapsible summary, using the existing `Contact` model + `createContactSubmission` server logic.

- Add a **new UI block type** in `src/components/chatbot/StaticGenUI.js`:
  - `contact_form_inline` → renders:
    - form fields for `name`, `email`, `projectType`, `message`
    - two buttons: **Send** and **Decline**
    - initially **expanded** (not inside a collapsible container).
  - `contact_form_summary` → renders:
    - a one-line “Contact request sent” label + chevron
    - expandable area with the submitted values.
- Create a small client-side helper in the chat UI to handle:
  - local form state and validation (mirroring rules from `Contact.js`),
  - calling a **dedicated API route** (e.g. `POST /api/chat-contact`) that internally reuses `createContactSubmission` or shares a common helper,
  - updating the chat UI state from `contact_form_inline` → `contact_form_summary` on success,
  - handling Decline by collapsing/removing the block.
- Add a simple “Open contact form” UI entry point in the chat (e.g. a quick-action button) for testing, even before AI-driven insertion.

Acceptance criteria:

- From any page, user can open the inline contact form in the chat.
- The form is initially expanded, editable, and has **Send** / **Decline** buttons.
- On Send, a contact entry is created and the card becomes a collapsed summary.
- On Decline, the card is hidden or minimized.

### Phase 2 — AI creates and pre-fills the draft (tool + generative UI block)

**Goal**: let the assistant decide when to present the contact form and prefill it from the conversation.

- Add a new tool definition in `src/lib/chatbot-utils.js` (example: `draftContactLead`):
  - Inputs: conversation context + any known fields.
  - Output: the `contact_form_inline` payload:
    - `initialValues` filled as much as possible,
    - optional `meta.pagePath` taken from request context.
- In `src/app/api/chat/route.js`:
  - include the tool in the toolset.
  - when the tool completes, stream a `type:"ui"` block with `type: "contact_form_inline"` and the payload defined above (through `src/lib/chatbot-generative-ui.js` if you prefer a mapping layer).
- In `StaticGenUI`, wire the AI-produced block to the same `ContactFormInline` renderer from Phase 1.

Acceptance criteria:

- AI can insert an inline contact form into the chat at the right time.
- The form is often prefilled with data extracted from the conversation.
- User can still edit all fields before pressing Send.

### Phase 3 — Hardening (recommended)

- Add **rate limiting** to `POST /api/chat` and the new contact-submit API route (using `src/lib/rateLimit.js`).
- Add lightweight spam controls:
  - optional profanity/spam heuristics before accepting drafts,
  - consider CAPTCHA or hidden honeypot on the server-side contact creation if you see abuse.
- Analytics:
  - log inline-contact events: form shown, sent, declined.
  - track conversion: how many chats → contact sends.

## Guardrails

- **No auto-send**: user must explicitly click **Send** for the inline form.
- **Whitelist-only UI**: the assistant can only produce known UI block types (`contact_form_inline`, `contact_form_summary`).
- **Validate** on the server:
  - ensure `projectType` matches existing options; otherwise coerce to `other`,
  - apply the same or stricter validation as `Contact.js` before creating DB records.
- **Clear state transitions**: once a form is sent or declined, it should not be editable again (to avoid confusion about what was actually sent).

## Out of scope (for now)

- Auto-submitting the contact form without user confirmation.
- Attachments upload via chat.
- Direct CRM/ticket integrations (can be added after the inline chat contact flow is stable).
