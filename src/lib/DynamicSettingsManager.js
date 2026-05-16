import dbConnect from '@/lib/dbConnect';
import DynamicSettings from '@/models/DynamicSettings';
import { decrypt, encrypt } from '@/lib/crypto';

/**
 * DynamicSettingsManager
 *
 * Securely manages application configuration stored in MongoDB.
 * Uses memory caching with TTL to avoid excessive DB/Decryption overhead.
 */
class DynamicSettingsManager {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes cache
    this.lastFetch = 0;
  }

  /**
   * Get a decrypted setting value by key
   */
  async get(key, defaultValue = null) {
    await this._refreshCacheIfNeeded();
    const entry = this.cache.get(key);
    return entry !== undefined ? entry : defaultValue;
  }

  /**
   * Set or update an encrypted setting
   */
  async set(key, value, description = '', isEncrypted = true) {
    await dbConnect();
    const finalValue = isEncrypted ? encrypt(value) : value;

    await DynamicSettings.findOneAndUpdate(
      { key },
      { $set: { value: finalValue, description, isEncrypted } },
      { upsert: true, new: true }
    );

    // Update local cache
    this.cache.set(key, value);
    return true;
  }

  /**
   * Specialized helper to get Redis configuration
   */
  async getRedisConfig() {
    const url = await this.get('REDIS_URL');
    const token = await this.get('REDIS_TOKEN');
    return { url, token };
  }

  /**
   * Internal: Fetch all settings from DB and populate cache
   * @private
   */
  async _refreshCacheIfNeeded(force = false) {
    const now = Date.now();
    if (!force && this.cache.size > 0 && now - this.lastFetch < this.cacheTTL) {
      return;
    }

    try {
      await dbConnect();
      const settings = await DynamicSettings.find({}).lean();

      this.cache.clear();
      for (const s of settings) {
        try {
          // Explicitly check the flag from the database document
          const decryptedValue = s.isEncrypted ? decrypt(s.value) : s.value;
          this.cache.set(s.key, decryptedValue);
        } catch (e) {
          console.error(
            `[DynamicSettings] Failed to decrypt key: ${s.key}. Defaulting to raw value.`
          );
          this.cache.set(s.key, s.value); // Fallback to raw value if decryption fails but flag was set
        }
      }

      this.lastFetch = now;
      console.log(`[DynamicSettings] Cache refreshed. Loaded ${this.cache.size} settings.`);
    } catch (error) {
      console.error('[DynamicSettings] Cache refresh failed:', error);
    }
  }
}

// Global singleton
const dynamicSettingsManager = new DynamicSettingsManager();
export default dynamicSettingsManager;
