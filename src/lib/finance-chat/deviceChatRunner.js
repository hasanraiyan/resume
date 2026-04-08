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
  const result = await runDeviceFinanceChat({
    userMessage,
    history,
    accounts,
    categories,
    transactions,
    analysis,
    pendingDraft,
    signal,
  });

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
