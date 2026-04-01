import { BaseIntegrationAdapter } from './BaseIntegrationAdapter.js';

/**
 * Twilio SMS Adapter
 * Standardizes communication with the Twilio Messaging API for SMS.
 * Handles incoming POST webhooks (x-www-form-urlencoded) and message sending.
 */
export class TwilioSmsAdapter extends BaseIntegrationAdapter {
  constructor(credentials) {
    super(credentials);
    const getCred = (key) => (credentials?.get ? credentials.get(key) : credentials?.[key]);

    this.accountSid = getCred('accountSid');
    this.authToken = getCred('authToken');
    this.fromNumber = getCred('fromNumber'); // Format: +1234567890

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
    return null;
  }

  /**
   * Parse incoming Twilio message
   */
  async parseMessage(rawBody) {
    // Twilio payload fields: From (+123...), Body, To, etc.
    const from = rawBody?.From;
    const body = rawBody?.Body;

    if (!from || !body) {
      return null;
    }

    const chatId = from;
    const userMessage = body;

    // --- Selective Automation Filter ---
    if (this.responseMode === 'whitelisted') {
      const isAllowed = this.allowedNumbers.includes(chatId.replace('+', ''));
      const isAllowedWithPlus = this.allowedNumbers.includes(chatId);

      if (!isAllowed && !isAllowedWithPlus) {
        console.log(`[TwilioSmsAdapter] Ignoring message from unauthorized number: ${chatId}`);
        return null;
      }
    }

    return {
      chatId,
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

      const to = chatId.startsWith('+') ? chatId : `+${chatId}`;
      const from = this.fromNumber.startsWith('+') ? this.fromNumber : `+${this.fromNumber}`;

      // Split into chunks if message exceeds Twilio's 1600 character limit for a single message
      // Note: SMS concatenated messages generally support longer lengths automatically, but Twilio imposes a hard limit on the payload size.
      const MAX_LENGTH = 1600;
      const chunks = [];
      if (text.length <= MAX_LENGTH) {
        chunks.push(text);
      } else {
        let remaining = text;
        while (remaining.length > 0) {
          if (remaining.length <= MAX_LENGTH) {
            chunks.push(remaining);
            break;
          }
          let splitIdx = remaining.lastIndexOf('\n', MAX_LENGTH);
          if (splitIdx <= 0) splitIdx = remaining.lastIndexOf(' ', MAX_LENGTH);
          if (splitIdx <= 0) splitIdx = MAX_LENGTH;
          chunks.push(remaining.slice(0, splitIdx));
          remaining = remaining.slice(splitIdx).trimStart();
        }
      }

      console.log(
        `[TwilioSmsAdapter] Sending message - To: ${to}, From: ${from}, Chunks: ${chunks.length}`
      );

      let lastResult;
      for (const chunk of chunks) {
        const params = new URLSearchParams();
        params.append('To', to);
        params.append('From', from);
        params.append('Body', chunk);

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        lastResult = await response.json();

        if (!response.ok) {
          throw new Error(`Twilio API error: ${lastResult.message || response.statusText}`);
        }
      }

      return lastResult;
    } catch (error) {
      console.error('[TwilioSmsAdapter] Error sending message:', error);
      throw error;
    }
  }

  async sendTypingAction(chatId) {
    // SMS doesn't support typing indicators
  }
}
