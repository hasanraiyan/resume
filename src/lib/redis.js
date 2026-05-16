import { Redis } from '@upstash/redis';
import dynamicSettingsManager from '@/lib/DynamicSettingsManager';

/**
 * Dynamic Redis Client
 * Fetches credentials from MongoDB at runtime.
 */
let redisInstance = null;

export async function getRedisClient() {
  if (redisInstance) return redisInstance;

  const { url, token } = await dynamicSettingsManager.getRedisConfig();

  if (!url || !token) {
    console.warn('[Redis] Configuration missing in MongoDB (REDIS_URL/REDIS_TOKEN)');
    return null;
  }

  redisInstance = new Redis({ url, token });
  return redisInstance;
}

export default getRedisClient;
