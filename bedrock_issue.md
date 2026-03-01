# Bug: Bedrock Compatibility - "Conversation must start with a user message"

The chatbot fails with a 500 error when using models hosted on AWS Bedrock (or via proxies that use Bedrock backend). This is because the chatbot currently sends the `system` message as the first element in the `messages` array.

## Error Details

- **Message**: `bedrock error: A conversation must start with a user message.`
- **Location**: `src/app/api/chat/route.js` at the OpenAI completion call.
- **Cause**: Bedrock expects the conversation history in the `messages` array to begin with a `user` role. System instructions are usually expected in a separate parameter or integrated into the first user message.

## Steps to Reproduce

1. Configure the chatbot to use a Bedrock-based model (e.g., Anthropic Claude on Amazon Bedrock).
2. Start a new chat.
3. The API will return a 400/500 error because the first message sent to the provider is `role: system`.

## Proposed Fix

In `src/app/api/chat/route.js`, before calling `openai.chat.completions.create`, we should "sanitize" the messages for Bedrock/Strict providers:

1. Identify if the first message is `role: 'system'`.
2. Find the first message with `role: 'user'`.
3. Prepend the `system` message content to that `user` message (e.g., using a `<system_instructions>` tag or simply as a prefix).
4. Remove the standalone `system` message from the array.

This ensures the first message is always `user`, satisfying Bedrock's requirements while retaining the system instructions for the AI.

## Technical Notes

- Pruning logic in `pruneContext` should also respect this "user-first" requirement.
- This fix is particularly relevant as we move towards **Multi-Provider Support**, as different providers have varying levels of strictness regarding message ordering.
