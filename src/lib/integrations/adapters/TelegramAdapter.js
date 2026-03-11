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
    const username = message.from?.username;
    const userMessage = message.text;

    if (!chatId || !userMessage) {
      return null; // Ignore non-text messages or malformed payloads for now
    }

    return {
      chatId,
      chatType,
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
      console.error('Failed to send Telegram typing action:', e);
    }
  }

  async sendMessage(chatId, text) {
    try {
      const resp = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          // Use markdown parsing so AI responses look nice
          parse_mode: 'Markdown',
        }),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Telegram API responded with ${resp.status}: ${errorText}`);
      }

      return await resp.json();
    } catch (e) {
      console.error('Error sending Telegram message:', e);
      throw e;
    }
  }
}
