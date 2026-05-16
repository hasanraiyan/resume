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
    const expirySeconds = Math.round((customCooldownMs || this.cooldownMs) / 1000);
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

      // Execute increments
      await Promise.all([p1, p2]);

      // Ensure TTLs are set (only if fresh keys)
      const [ttlRpm, ttlRpd] = await Promise.all([
        redis.ttl(`usage:${poolId}:${p.internalId}:rpm`),
        redis.ttl(`usage:${poolId}:${p.internalId}:rpd`),
      ]);

      if (ttlRpm < 0) await redis.expire(`usage:${poolId}:${p.internalId}:rpm`, 60);
      if (ttlRpd < 0) await redis.expire(`usage:${poolId}:${p.internalId}:rpd`, 86400); // 24h
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
