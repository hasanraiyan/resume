import { BaseIntegrationAdapter } from './BaseIntegrationAdapter.js';

/**
 * Twilio WhatsApp Adapter
 * Standardizes communication with the Twilio Messaging API for WhatsApp.
 * Handles incoming POST webhooks (x-www-form-urlencoded) and message sending.
 */
export class TwilioAdapter extends BaseIntegrationAdapter {
  constructor(credentials) {
    super(credentials);
    const getCred = (key) => (credentials?.get ? credentials.get(key) : credentials?.[key]);

    this.accountSid = getCred('accountSid');
    this.authToken = getCred('authToken');
    this.fromNumber = getCred('fromNumber'); // Format: whatsapp:+1234567890

    // Selective Automation Settings
    this.responseMode = getCred('responseMode') || 'all'; // 'all' or 'whitelisted'
    const allowedRaw = getCred('allowedNumbers') || '';
    this.allowedNumbers = allowedRaw
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (!this.accountSid || !this.authToken) {
      throw new Error('Twilio accountSid and authToken are required.');
    }

    this.apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
  }

  /**
   * Twilio uses POST webhooks for messages.
   * No special GET verification like Meta is required,
   * but you can validate signatures for security.
   */
  async handleVerification(request) {
    // Twilio doesn't require a GET challenge response.
    return null;
  }

  /**
   * Parse incoming Twilio message
   * Twilio sends data as x-www-form-urlencoded (translated to JSON by Next.js if enabled, or manually parsed).
   */
  async parseMessage(rawBody) {
    // Twilio payload fields: From (whatsapp:+123...), Body, To, etc.
    const from = rawBody?.From;
    const body = rawBody?.Body;

    if (!from || !body) {
      return null;
    }

    // Strip "whatsapp:" prefix for internal processing
    const chatId = from.replace('whatsapp:', '');
    const userMessage = body;

    // --- Selective Automation Filter ---
    if (this.responseMode === 'whitelisted') {
      const isAllowed = this.allowedNumbers.includes(chatId.replace('+', ''));
      const isAllowedWithPlus = this.allowedNumbers.includes(chatId);

      if (!isAllowed && !isAllowedWithPlus) {
        console.log(`[TwilioAdapter] Ignoring message from unauthorized number: ${chatId}`);
        return null;
      }
    }

    return {
      chatId, // Keeping the "+" if present, e.g. +919876543210
      userMessage,
      rawPayload: rawBody,
    };
  }

  /**
   * Send a message via Twilio REST API
   */
  async sendMessage(chatId, text) {
    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      // Ensure chatId is in whatsapp:+NNN format
      const to = chatId.startsWith('whatsapp:')
        ? chatId
        : chatId.startsWith('+')
          ? `whatsapp:${chatId}`
          : `whatsapp:+${chatId}`;

      let from = this.fromNumber.startsWith('whatsapp:')
        ? this.fromNumber
        : `whatsapp:${this.fromNumber}`;
      if (!from.includes(':+')) {
        from = from.replace(':', ':+');
      }

      console.log(`[TwilioAdapter] Sending message - To: ${to}, From: ${from}`);

      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', from);
      params.append('Body', text);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMsg = result.message || response.statusText;
        if (errorMsg.includes('Channel with the specified From address')) {
          errorMsg += ` (Tip: If using Twilio Sandbox, the "From" number MUST be exactly as shown in your Twilio Console, usually ending in 8886. If using a personal Twilio number, ensure the WhatsApp Sender is approved in Twilio Console.)`;
        }
        throw new Error(`Twilio API error: ${errorMsg}`);
      }

      return result;
    } catch (error) {
      console.error('[TwilioAdapter] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Marking as read / Typing indicators
   * Twilio doesn't support a simple "typing" indicator for WhatsApp via the standard REST API
   * in the same way Telegram does.
   */
  async sendTypingAction(chatId) {
    // Placeholder
  }
}
