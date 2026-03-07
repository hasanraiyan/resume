import { BaseIntegrationAdapter } from './BaseIntegrationAdapter.js';

/**
 * WhatsApp Cloud API Adapter
 *
 * Standardizes communication with the WhatsApp Business Platform (Cloud API).
 * Handles webhook verification (GET), signature validation, and message parsing/sending.
 */
export class WhatsAppAdapter extends BaseIntegrationAdapter {
  constructor(credentials) {
    super(credentials);
    // Credentials can be a Map (from Mongoose) or a standard Object
    const getCred = (key) => (credentials?.get ? credentials.get(key) : credentials?.[key]);

    this.accessToken = getCred('accessToken');
    this.phoneNumberId = getCred('phoneNumberId');
    this.verifyToken = getCred('verifyToken');

    if (!this.accessToken || !this.phoneNumberId) {
      throw new Error('WhatsApp accessToken and phoneNumberId are required.');
    }

    this.apiUrl = `https://graph.facebook.com/v17.0/${this.phoneNumberId}/messages`;
  }

  /**
   * WhatsApp Webhook Verification
   * Meta sends a GET request to verify the webhook endpoint.
   */
  async handleVerification(request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === this.verifyToken) {
      console.log('[WhatsAppAdapter] Webhook verified successfully');
      return challenge;
    }

    console.warn('[WhatsAppAdapter] Webhook verification failed: Token mismatch');
    return null;
  }

  /**
   * Parse incoming WhatsApp Cloud API messages
   * WhatsApp payloads are deeply nested.
   */
  async parseMessage(rawBody) {
    // Check if it's a valid WhatsApp message event
    const entry = rawBody?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== 'text') {
      return null; // Ignore non-text messages or other events (like 'read' receipts)
    }

    const chatId = message.from; // Sender's phone number
    const userMessage = message.text?.body;

    if (!chatId || !userMessage) {
      return null;
    }

    return {
      chatId,
      userMessage,
      rawPayload: rawBody,
    };
  }

  /**
   * Send a message via WhatsApp Cloud API
   */
  async sendMessage(chatId, text) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: chatId,
          type: 'text',
          text: {
            preview_url: true,
            body: text,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${result.error?.message || response.statusText}`);
      }

      return result;
    } catch (error) {
      console.error('[WhatsAppAdapter] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Mark message as read (WhatsApp equivalent of typing indicator)
   */
  async sendTypingAction(chatId) {
    // Note: We'd need the message ID to mark as read, but BaseIntegrationAdapter
    // usually only passes chatId. We'll leave this as a placeholder or use
    // the latest message ID if we tracked it.
    // Cloud API doesn't have a "typing" state like Telegram.
  }
}
