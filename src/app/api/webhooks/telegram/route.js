import { NextResponse } from 'next/server';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';

export async function POST(request) {
  try {
    const update = await request.json();

    // Fast return if this is not a valid message update
    if (!update || !update.message || !update.message.text) {
      return NextResponse.json({ success: true, message: 'Ignored non-text message update' });
    }

    const { message } = update;
    const chatId = message.chat.id;
    const text = message.text;

    // Get the Telegram Agent
    const telegramAgent = agentRegistry.get(AGENT_IDS.TELEGRAM_BOT);

    if (!telegramAgent) {
      console.error('[Telegram Webhook] Telegram Agent not found in registry.');
      return NextResponse.json({ success: false, error: 'Agent not available' }, { status: 503 });
    }

    if (!telegramAgent.isActive) {
      console.warn('[Telegram Webhook] Telegram Agent is currently disabled.');
      return NextResponse.json({ success: false, error: 'Agent is disabled' }, { status: 403 });
    }

    // We execute asynchronously to avoid blocking the webhook response.
    // Telegram expects a quick 200 OK response to webhooks.
    telegramAgent.execute({ message: text, chatId }).catch((err) => {
      console.error('[Telegram Webhook] Agent execution failed asynchronously:', err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Telegram Webhook] Error processing request:', error);
    // Even on error, we usually want to return 200 to Telegram so it stops retrying the bad request,
    // unless we actually want them to retry.
    return NextResponse.json({ success: true, error: error.message });
  }
}
