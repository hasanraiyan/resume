import { runDeviceFinanceChat } from '@/lib/finance-ai/deviceFinanceChat';
import { createCompletedToolStep, setAssistantDeviceResult } from './messageState';

export async function runDeviceFinanceChatMessage({
  userMessage,
  history,
  accounts,
  categories,
  transactions,
  analysis,
  pendingDraft,
  signal,
  assistantMsgId,
  setMessages,
}) {
  const result = await runDeviceFinanceChat(
    {
      userMessage,
      history,
      accounts,
      categories,
      transactions,
      analysis,
      pendingDraft,
      signal,
    },
    { allowDrafts: false }
  );
  // By default, disallow device-side drafts; device AI will be read-only unless explicitly enabled.
  // Pass { allowDrafts: true } here if you intentionally want to enable drafting on-device.

  const steps = (result.actions || []).map((action) =>
    createCompletedToolStep(action.toolName, action.label, action.guiRequested, action.guiRendered)
  );

  setMessages((prev) =>
    setAssistantDeviceResult(prev, assistantMsgId, {
      ...result,
      steps,
    })
  );
  return result;
}
