import { getRedisClient } from '@/lib/redis';

/**
 * KeyRotationManager (Redis Edition)
 *
 * Manages pools of API keys globally using Redis.
 * Tracks RPM, TPM, RPD, and Throttling across all Vercel instances.
 */
class KeyRotationManager {
  constructor() {
    this.pools = new Map();
    this.cooldownMs = 60 * 1000; // 1 minute default cooldown
  }

  /**
   * Register or update a provider in a pool
   */
  registerProvider(poolId, provider) {
    if (!this.pools.has(poolId)) {
      this.pools.set(poolId, []);
    }

    const pool = this.pools.get(poolId);
    const keys = Array.isArray(provider.apiKey) ? provider.apiKey : [provider.apiKey];

    keys.forEach((key, index) => {
      const internalId = `${provider.providerId}-key-${index}`;
      const existing = pool.find((p) => p.internalId === internalId);

      const keyData = {
        providerId: provider.providerId,
        internalId,
        apiKey: key,
        name: `${provider.name} (Key ${index + 1})`,
        baseUrl: provider.baseUrl,
        enableLimits: provider.enableLimits ?? false,
        rpm: provider.defaultRPM || 4,
        tpm: provider.defaultTPM || 250000,
        rpd: provider.defaultRPD || 2000,
      };

      if (existing) {
        Object.assign(existing, keyData);
      } else {
        pool.push(keyData);
      }
    });
  }

  /**
   * Register a simple pool of keys for tools (Tavily, Google, etc)
   */
  registerToolPool(poolId, keys, name = 'Tool', config = {}) {
    if (!keys || keys.length === 0) return;
    if (!this.pools.has(poolId)) this.pools.set(poolId, []);

    const pool = this.pools.get(poolId);
    const keyArray = Array.isArray(keys) ? keys : [keys];

    keyArray.forEach((key, index) => {
      const internalId = `${poolId}-key-${index}`;
      const existing = pool.find((p) => p.internalId === internalId);

      const keyData = {
        providerId: poolId,
        internalId,
        apiKey: key,
        name: `${name} (Key ${index + 1})`,
        enableLimits: true,
        rpm: config.rpm || 4, // Requests per minute
        rpd: config.rpd || 1000, // Requests per day
        rpmnt: config.rpmnt || 1000, // Requests per month
      };

      if (existing) {
        Object.assign(existing, keyData);
      } else {
        pool.push(keyData);
      }
    });
  }

  /**
   * Get the next available provider from a pool
   */
  async getNextProvider(poolId) {
    const pool = this.pools.get(poolId);
    if (!pool || pool.length === 0) return null;

    // 1. Shuffle to spread load
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    for (const p of shuffled) {
      // 2. Check Global Throttling and Capacity in Redis
      const isAvailable = await this._isKeyAvailable(poolId, p);
      if (isAvailable) {
        // Increment global counters
        await this._incrementGlobalCounters(poolId, p);
        return { ...p, isPooled: true, poolId };
      }
    }

    // 3. Emergency: If all are busy, pick the one used longest ago locally
    return pool[0];
  }

  /**
   * Report actual usage (tokens) back to the manager
   */
  async reportUsage(poolId, internalId, tokens) {
    const redis = await getRedisClient();
    if (!redis) return;

    const key = `usage:${poolId}:${internalId}:tpm`;
    try {
      await redis.incrby(key, tokens);
      // Ensure TTL exists
      const ttl = await redis.ttl(key);
      if (ttl < 0) await redis.expire(key, 60);
    } catch (e) {
      console.warn('[KeyRotationManager] Redis reportUsage failed:', e.message);
    }
  }

  /**
   * Mark a provider key as throttled (429) globally
   */
  async markThrottled(poolId, internalId, customCooldownMs) {
    const redis = await getRedisClient();
    if (!redis) return;

    const key = `throttled:${poolId}:${internalId}`;
    // If credit related, default to end of month
    const expirySeconds = customCooldownMs
      ? Math.round(customCooldownMs / 1000)
      : this._getSecondsToNextMonth();

    try {
      await redis.set(key, 'true', { ex: expirySeconds });
      console.log(
        `[KeyRotationManager] Key ${internalId} throttled globally for ${expirySeconds}s`
      );
    } catch (e) {
      console.warn('[KeyRotationManager] Redis markThrottled failed:', e.message);
    }
  }

  /**
   * Helper to get seconds until the end of the current month
   * @private
   */
  _getSecondsToNextMonth() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return Math.floor((nextMonth - now) / 1000);
  }

  /**
   * Check Redis if a key is globally available
   * @private
   */
  async _isKeyAvailable(poolId, p) {
    try {
      const redis = await getRedisClient();
      if (!redis) return true; // Fallback to local if no redis

      // 1. Check Hard Throttle
      const isThrottled = await redis.get(`throttled:${poolId}:${p.internalId}`);
      if (isThrottled) return false;

      if (!p.enableLimits) return true;

      // 2. Check RPM (Requests Per Minute)
      const rpmCount = (await redis.get(`usage:${poolId}:${p.internalId}:rpm`)) || 0;
      if (parseInt(rpmCount) >= p.rpm) return false;

      // 3. Check TPM (Tokens Per Minute)
      const tpmCount = (await redis.get(`usage:${poolId}:${p.internalId}:tpm`)) || 0;
      if (parseInt(tpmCount) >= p.tpm * 0.9) return false;

      // 4. Check RPD (Requests Per Day)
      const rpdCount = (await redis.get(`usage:${poolId}:${p.internalId}:rpd`)) || 0;
      if (parseInt(rpdCount) >= p.rpd) return false;

      // 5. Check RPMnt (Requests Per Month)
      const monthCount = (await redis.get(`usage:${poolId}:${p.internalId}:rpmnt`)) || 0;
      if (parseInt(monthCount) >= p.rpmnt) return false;

      return true;
    } catch (e) {
      console.warn('[KeyRotationManager] Redis check failed, falling back to local:', e.message);
      return true; // Fallback to local if Redis is down
    }
  }

  /**
   * Increment global usage counters in Redis
   * @private
   */
  async _incrementGlobalCounters(poolId, p) {
    try {
      const redis = await getRedisClient();
      if (!redis) return;

      const p1 = redis.incr(`usage:${poolId}:${p.internalId}:rpm`);
      const p2 = redis.incr(`usage:${poolId}:${p.internalId}:rpd`);
      const p3 = redis.incr(`usage:${poolId}:${p.internalId}:rpmnt`);

      // Execute increments
      await Promise.all([p1, p2, p3]);

      // Ensure TTLs are set (only if fresh keys)
      const [ttlRpm, ttlRpd, ttlRpMnt] = await Promise.all([
        redis.ttl(`usage:${poolId}:${p.internalId}:rpm`),
        redis.ttl(`usage:${poolId}:${p.internalId}:rpd`),
        redis.ttl(`usage:${poolId}:${p.internalId}:rpmnt`),
      ]);

      if (ttlRpm < 0) await redis.expire(`usage:${poolId}:${p.internalId}:rpm`, 60);
      if (ttlRpd < 0) await redis.expire(`usage:${poolId}:${p.internalId}:rpd`, 86400); // 24h
      if (ttlRpMnt < 0)
        await redis.expire(`usage:${poolId}:${p.internalId}:rpmnt`, this._getSecondsToNextMonth());
    } catch (e) {
      console.warn('[KeyRotationManager] Redis increment failed:', e.message);
    }
  }

  getPoolStatus(poolId) {
    return this.pools.get(poolId) || [];
  }
}

const keyRotationManager = new KeyRotationManager();
export default keyRotationManager;
