import TelegramSettings from '@/models/TelegramSettings';
import { decrypt } from '@/lib/crypto';

const MARKDOWN_V2_SPECIAL_CHARS = /([_*\[\]()~`>#+\-=|{}.!])/g;

export function escapeTelegramMarkdownV2(value) {
  return String(value || '').replace(MARKDOWN_V2_SPECIAL_CHARS, '\\$1');
}

export async function sendTelegramMessage({ botToken, chatId, text, parseMode = 'MarkdownV2' }) {
  if (!botToken || !chatId || !text) {
    return {
      ok: false,
      description: 'Missing bot token, chat ID, or message text.',
    };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.ok === false) {
      return {
        ok: false,
        description: payload.description || `Telegram request failed with ${response.status}`,
        payload,
      };
    }

    return { ok: true, payload };
  } catch (error) {
    console.error('[Telegram] Failed to send message:', error);
    return { ok: false, description: error.message || 'Failed to send Telegram message.' };
  }
}

export async function sendTelegramMessageFromSettings(text) {
  const settings = await TelegramSettings.findOne({ isEnabled: true }).lean();
  if (!settings?.botToken || !settings?.chatId) {
    return {
      ok: false,
      skipped: true,
      description: 'Telegram notifications are disabled or incomplete.',
    };
  }

  const botToken = decrypt(settings.botToken);
  if (!botToken) {
    return {
      ok: false,
      description: 'Failed to decrypt Telegram bot token.',
    };
  }

  return sendTelegramMessage({
    botToken,
    chatId: settings.chatId,
    text,
  });
}
