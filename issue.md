# Technical Debt: ChatbotWidget Refactoring Plan

The `ChatbotWidget.js` file has grown to over 1,500 lines, making it difficult to maintain and test. This plan outlines a strategy to decompose the monolithic component into smaller, focused sub-components and hooks.

## 1. Decompose UI into Sub-components

Break the main UI into logical pieces stored in `src/components/chatbot/`:

- `ChatHeader.js`: Displays AI name, status indicator, and close button.
- `MessageList.js`: Specialized component for rendering the message scroll area and different message types (AI vs User).
- `ChatInput.js`: The complex input area including:
  - `ToolSelector.js`: The "Available Tools" dropdown logic.
  - `ModelSelector.js`: The "AI Models" role-based selection logic.
  - `VoiceInputControl.js`: Microphone button and animation logic.
- `FloatingActionButton.js`: The initial FAB with status pulse.

## 2. Extract Logic into Custom Hooks

Move state and side-effect logic into `src/hooks/chatbot/`:

- `useChatStreaming.js`: Handles the `streamChatResponse` logic and message state management.
- `useVoiceRecognition.js`: Manages `SpeechRecognition` initialization, silence timeouts, and cleanup.
- `useChatbotSettings.js`: Handles fetching and initializing admin settings.
- `useSelectionAI.js`: Logic for detecting global text selection and showing the contextual AI button.

## 3. Benefits

- **Improved Readability**: Individual files will be < 200 lines.
- **Scalability**: New tools or model roles can be added without bloating the main widget.
- **Testability**: Logic can be unit tested in isolation (hooks) and UI components can be tested via Storybook or similar.
- **Reusability**: Components like the `ModelSelector` could potentially be reused in the Admin panel.

## 4. Implementation Phasing

1. **Phase 1**: Extract "Atomic" UI components like `ToolSelector` and `ModelSelector`.
2. **Phase 2**: Move voice logic into `useVoiceRecognition`.
3. **Phase 3**: Refactor the core message streaming into `useChatStreaming`.
