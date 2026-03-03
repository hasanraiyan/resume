# Issue: Chatbot Image Input Per Mode

**ID**: ISSUE-004

## 🤖 Agent Assignment

**Primary Agent**: [Codex | Jules | Antigravity - CHOOSE ONE]
**Collaborators**: [e.g., None - single agent implementation]

---

## 🎯 Objective

Implement image input support for the chatbot with the following requirements:

1. **Per-Mode Configuration**: Each of the 3 chatbot modes (Fast, Thinking, Pro) should have its own "Enable Image Input" toggle in the admin panel
2. **Frontend UI**: When a user selects a mode that has image input enabled, they should see an image upload button in the chat input
3. **Backend Processing**: Images should be sent to the AI model in the proper vision-compatible format
4. **Persistence**: The image enable/disable setting must persist in the database after saving

---

## 🛠️ Implementation Scope

### 📂 Allowed Directories/Files

**Database/Model:**

- `src/models/ChatbotSettings.js` - Add `supportsImages: Boolean` to fastModel, thinkingModel, proModel schemas

**Admin Panel:**

- `src/app/(admin)/admin/chatbot/page.js` - Add image toggle switch UI for each model slot in the "General" tab
- `src/app/api/admin/chatbot/route.js` - Accept and save `supportsImages` field in POST handler

**Frontend Widget:**

- `src/components/chatbot/ChatbotWidget.js` - Add state for attached images, compute supportsImages based on selected model
- `src/components/chatbot/ChatInput.js` - Add image upload button (show only when current model supports images), add image preview thumbnails with remove button
- `src/components/chatbot/ModelSelector.js` - Show visual indicator (📷 icon) for models that support images

**Chat API:**

- `src/hooks/chatbot/useChatStreaming.js` - Pass attachedImages to streamChatResponse
- `src/app/api/chat/route.js` - Accept attachedImages array, create proper LangChain HumanMessage with vision content format

### ⚠️ Conflict Zones (DO NOT TOUCH)

- None - this is a self-contained feature affecting only chatbot files
- Do not modify other admin pages or unrelated components

---

## 🚀 Requirements

### Phase 1: Database Schema

1. Add `supportsImages: { type: Boolean, default: false }` to each model field (fastModel, thinkingModel, proModel) in `src/models/ChatbotSettings.js`

### Phase 2: Admin UI

1. In the `renderModelSlot` function in `src/app/(admin)/admin/chatbot/page.js`, add a Switch component below the Model dropdown for each mode
2. The switch should toggle `supportsImages` boolean in the formData for that model slot
3. Add the `supportsImages` field to the default values in `src/app/api/admin/chatbot/route.js` POST handler

### Phase 3: Frontend Widget

1. Add `attachedImages` state array in ChatbotWidget
2. Compute `supportsImages` based on whether `selectedModel?.supportsImages` is true
3. Pass `attachedImages`, `onAttachImages`, and `supportsImages` props to ChatInput
4. In ChatInput:
   - Show 📷 upload button only when `supportsImages` is true
   - Handle file input to convert images to base64 data URLs
   - Show thumbnail previews above the text input
   - Allow removing individual images
5. Pass `attachedImages` to the `send` function

### Phase 4: Chat Streaming Hook

1. Update `streamChatResponse` to accept `attachedImages` parameter
2. Pass `attachedImages` in the fetch body to `/api/chat`

### Phase 5: Chat API Route

1. Extract `attachedImages` from request body (default to empty array)
2. Accept user message OR images (not required to have both)
3. Create HumanMessage with vision content format:
   ```javascript
   const content = [
     { type: 'text', text: userMessage },
     ...attachedImages.map((img) => ({ type: 'image_url', image_url: { url: img } })),
   ];
   ```

### Phase 6: Model Selector UI

1. Show 📷 icon next to model names in the dropdown that have `supportsImages: true`
2. Show 📷 icon in the selected model button when image support is enabled

---

## 📝 Coordination Notes

- **Branch**: `feature/chatbot-image-input-per-mode`
- **Dependencies**: None - this is a new feature
- **PR Strategy**: Single PR with all changes, close issue after merge

---

## 🔍 Detailed Implementation Notes

### Model Selector - How to detect image support

```javascript
// In ModelSelector.js, add helper function:
const supportsImages = (model) => model?.supportsImages === true;

// Use in the dropdown items:
<span className="flex items-center gap-1">
  Fast Engine
  {supportsImages(chatbotSettings.fastModel) && <Image className="w-3 h-3" />}
</span>;
```

### ChatInput - Image Upload Flow

```javascript
// Convert file to base64:
const reader = new FileReader();
reader.onload = (e) => resolve(e.target.result);
reader.readAsDataURL(file);
```

### API Route - Vision Message Format

LangChain's ChatOpenAI supports vision via the `content` array format:

```javascript
new HumanMessage({
  content: [
    { type: 'text', text: 'What do you see?' },
    { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...' } },
  ],
});
```

---

**Priority**: High
**Status**: 🆕 Pending
