import { TelegramAdapter } from './adapters/TelegramAdapter.js';
import { WhatsAppAdapter } from './adapters/WhatsAppAdapter.js';
import { TwilioAdapter } from './adapters/TwilioAdapter.js';

/**
 * Integration Factory
 *
 * Instantiates the correct platform adapter based on the platform string.
 * This is the core of the Strategy Pattern for routing webhook messages.
 */
export class IntegrationFactory {
  /**
   * Get the appropriate integration adapter for a platform
   * @param {string} platform - e.g., 'telegram', 'whatsapp'
   * @param {Object|Map} credentials - The decrypted credentials for the platform
   * @returns {import('./adapters/BaseIntegrationAdapter').BaseIntegrationAdapter|null}
   */
  static getAdapter(platform, credentials) {
    if (!platform || !credentials) {
      return null;
    }

    switch (platform.toLowerCase()) {
      case 'telegram':
        return new TelegramAdapter(credentials);
      case 'whatsapp':
        return new WhatsAppAdapter(credentials);
      case 'twilio':
        return new TwilioAdapter(credentials);
      default:
        console.warn(`No integration adapter found for platform: ${platform}`);
        return null;
    }
  }
}
