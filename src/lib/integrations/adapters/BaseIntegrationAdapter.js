/**
 * Base Integration Adapter
 *
 * Abstract base class for all platform adapters (Telegram, WhatsApp, etc.).
 * Defines the contract that every channel integration must fulfill to allow
 * dynamic routing without coupling to specific platform logic.
 */
export class BaseIntegrationAdapter {
  constructor(credentials) {
    if (new.target === BaseIntegrationAdapter) {
      throw new Error('BaseIntegrationAdapter is an abstract class.');
    }
    this.credentials = credentials;
  }

  /**
   * Verify an incoming webhook request.
   * Useful for platforms that require signature validation (like WhatsApp).
   * @param {Request} request - The Next.js incoming request object
   * @returns {Promise<boolean>}
   */
  async verifyWebhook(request) {
    return true; // Default to true if platform doesn't need verification
  }

  /**
   * Parse an incoming webhook request to extract the standard payload.
   * @param {Object} rawBody - The parsed JSON body of the webhook
   * @returns {Promise<{chatId: string|number, userMessage: string, rawPayload: Object}|null>}
   */
  async parseMessage(rawBody) {
    throw new Error('parseMessage must be implemented by subclass');
  }

  /**
   * Send a typing action to the channel, if supported.
   * @param {string|number} chatId
   * @returns {Promise<void>}
   */
  async sendTypingAction(chatId) {
    // Optional implementation
  }

  /**
   * Send a message back to the channel.
   * @param {string|number} chatId
   * @param {string} text - The AI response
   * @returns {Promise<any>} Response from the platform API
   */
  async sendMessage(chatId, text) {
    throw new Error('sendMessage must be implemented by subclass');
  }
}
