/**
 * KeyRotationManager
 *
 * Manages pools of API keys for different providers.
 * Tracks health, rate limits (429s), and rotations.
 */

class KeyRotationManager {
  constructor() {
    // Structure: { [poolId]: [{ providerId, lastUsed, throttledUntil, errorCount }] }
    this.pools = new Map();
    this.cooldownMs = 60 * 1000; // 1 minute default cooldown for 429s
  }

  /**
   * Register or update a provider in a pool
   */
  registerProvider(poolId, provider) {
    if (!this.pools.has(poolId)) {
      this.pools.set(poolId, []);
    }

    const pool = this.pools.get(poolId);

    // If apiKey is an array, register each key as a separate rotation target
    const keys = Array.isArray(provider.apiKey) ? provider.apiKey : [provider.apiKey];

    keys.forEach((key, index) => {
      const internalId = `${provider.providerId}-key-${index}`;
      const existing = pool.find((p) => p.internalId === internalId);

      const keyData = {
        providerId: provider.providerId, // Original DB ID
        internalId, // Unique ID for this specific key
        apiKey: key,
        name: `${provider.name} (Key ${index + 1})`,
        baseUrl: provider.baseUrl,
        lastUsed: 0,
        throttledUntil: 0,
        errorCount: 0,
        enableLimits: provider.enableLimits ?? false,
        // Capacity Limits
        rpm: provider.defaultRPM || 4,
        tpm: provider.defaultTPM || 250000,
        rpd: provider.defaultRPD || 2000,
        // Counters
        counters: {
          minuteRequests: 0,
          minuteTokens: 0,
          dailyRequests: 0,
          lastMinuteReset: Date.now(),
          lastDailyReset: Date.now(),
        },
      };

      if (existing) {
        // Update key and limits, keep counters
        existing.apiKey = keyData.apiKey;
        existing.rpm = keyData.rpm;
        existing.tpm = keyData.tpm;
        existing.rpd = keyData.rpd;
      } else {
        pool.push(keyData);
      }
    });
  }

  /**
   * Get the next available provider from a pool
   */
  getNextProvider(poolId) {
    const pool = this.pools.get(poolId);
    if (!pool || pool.length === 0) return null;

    const now = Date.now();

    // 1. Filter out throttled keys and those at capacity
    const available = pool.filter((p) => {
      // Check hard throttles (429s) - ALWAYS check this regardless of enableLimits
      if (p.throttledUntil > now) return false;

      // Only check precise capacity if enabled for this provider
      if (p.enableLimits) {
        // Reset counters if time window passed
        this._resetCountersIfNeeded(p, now);

        // Check RPM (Requests Per Minute)
        if (p.counters.minuteRequests >= p.rpm) return false;

        // Check TPM (Tokens Per Minute) - we use a buffer of 90%
        if (p.counters.minuteTokens >= p.tpm * 0.9) return false;

        // Check RPD (Requests Per Day)
        if (p.counters.dailyRequests >= p.rpd) return false;
      }

      return true;
    });

    if (available.length === 0) {
      // If all are throttled/at capacity, return the one used longest ago
      // but mark it as "over capacity" so the agent knows to wait
      const best = pool.sort((a, b) => a.lastUsed - b.lastUsed)[0];
      return best;
    }

    // 2. Pick the one used longest ago (Least Recently Used) among available
    const next = available.sort((a, b) => a.lastUsed - b.lastUsed)[0];

    next.lastUsed = now;
    // Pre-increment request counters
    next.counters.minuteRequests++;
    next.counters.dailyRequests++;

    return next;
  }

  /**
   * Report actual usage (tokens) back to the manager
   */
  reportUsage(poolId, internalId, tokens) {
    const pool = this.pools.get(poolId);
    if (!pool) return;

    const key = pool.find((p) => p.internalId === internalId);
    if (key) {
      this._resetCountersIfNeeded(key, Date.now());
      key.counters.minuteTokens += tokens;
    }
  }

  /**
   * Reset minute/daily counters if time has passed
   * @private
   */
  _resetCountersIfNeeded(key, now) {
    // Reset Minute (60s)
    if (now - key.counters.lastMinuteReset > 60000) {
      key.counters.minuteRequests = 0;
      key.counters.minuteTokens = 0;
      key.counters.lastMinuteReset = now;
    }

    // Reset Daily (24h)
    if (now - key.counters.lastDailyReset > 24 * 60 * 60 * 1000) {
      key.counters.dailyRequests = 0;
      key.counters.lastDailyReset = now;
    }
  }

  /**
   * Mark a provider key as throttled (429)
   */
  markThrottled(poolId, internalId, customCooldownMs) {
    const pool = this.pools.get(poolId);
    if (!pool) return;

    const provider = pool.find((p) => p.internalId === internalId);
    if (provider) {
      const cooldown = customCooldownMs || this.cooldownMs;
      provider.throttledUntil = Date.now() + cooldown;
      console.log(
        `[KeyRotationManager] Key ${internalId} in pool ${poolId} throttled for ${Math.round(cooldown / 1000)}s`
      );
    }
  }

  /**
   * Mark a provider key as successful (clear errors)
   */
  markSuccess(poolId, internalId) {
    const pool = this.pools.get(poolId);
    if (!pool) return;

    const provider = pool.find((p) => p.internalId === internalId);
    if (provider) {
      provider.errorCount = 0;
      provider.throttledUntil = 0;
    }
  }

  getPoolStatus(poolId) {
    return this.pools.get(poolId) || [];
  }
}

// Global singleton
const keyRotationManager = new KeyRotationManager();
export default keyRotationManager;
