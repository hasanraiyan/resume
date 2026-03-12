import { BaseIntegrationAdapter } from './BaseIntegrationAdapter.js';

/**
 * Telegram Adapter
 * Standardizes communication with the Telegram Bot API.
 */
export class TelegramAdapter extends BaseIntegrationAdapter {
  constructor(credentials) {
    super(credentials);
    const botToken = credentials?.get ? credentials.get('botToken') : credentials?.botToken;
    if (!botToken) {
      throw new Error('Telegram botToken is missing from credentials.');
    }
    this.botToken = botToken;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async parseMessage(rawBody) {
    if (!rawBody || !rawBody.message) {
      return null;
    }

    const message = rawBody.message;
    const chatId = message.chat?.id;
    const chatType = message.chat?.type;
    const userId = message.from?.id;
    const username = message.from?.username;
    const userMessage = message.text;

    if (!chatId || !userMessage) {
      return null; // Ignore non-text messages or malformed payloads for now
    }

    return {
      chatId,
      chatType,
      userId,
      username,
      userMessage,
      rawPayload: rawBody,
    };
  }

  async sendTypingAction(chatId) {
    try {
      await fetch(`${this.apiUrl}/sendChatAction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          action: 'typing',
        }),
      });
    } catch (e) {
      if (e.code === 'ECONNRESET' || e.code === 'UND_ERR_CONNECT_TIMEOUT') {
        console.warn(
          `[TelegramAdapter] Typing action failed due to network timeout or reset (${e.code}). Ignored.`
        );
      } else {
        console.warn(`[TelegramAdapter] Failed to send typing action: ${e.message}`);
      }
    }
  }

  async sendMessage(chatId, text, isFallback = false) {
    try {
      const payload = {
        chat_id: chatId,
        text: text,
      };

      if (!isFallback) {
        // Use markdown parsing so AI responses look nice
        payload.parse_mode = 'Markdown';
      }

      const resp = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errorText = await resp.text();

        // If Markdown parsing fails, try again without parse_mode
        if (!isFallback && errorText.includes("can't parse entities")) {
          console.warn(`[TelegramAdapter] Failed to parse Markdown, falling back to plain text.`);
          return await this.sendMessage(chatId, text, true);
        }

        throw new Error(`Telegram API responded with ${resp.status}: ${errorText}`);
      }

      return await resp.json();
    } catch (e) {
      console.error('Error sending Telegram message:', e);
      throw e;
    }
  }
}
