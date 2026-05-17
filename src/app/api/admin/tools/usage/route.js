import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getToolUsage } from '@/lib/agents/utils/tool-usage';
import dynamicSettingsManager from '@/lib/DynamicSettingsManager';
import { getRedisClient } from '@/lib/redis';
import crypto from 'crypto';

/**
 * API Route: GET /api/admin/tools/usage
 * Fetches real-time usage for a specific tool with Redis caching.
 */
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const toolId = searchParams.get('toolId');
  const keyName = searchParams.get('keyName');

  if (!toolId || !keyName) {
    return NextResponse.json({ error: 'toolId and keyName are required' }, { status: 400 });
  }

  try {
    const config = await dynamicSettingsManager.get(keyName);
    if (!config) {
      return NextResponse.json({ error: 'Tool not configured' }, { status: 404 });
    }

    const redis = await getRedisClient();

    // Map toolId to internal Pool IDs used by agents
    const poolIdMap = {
      tavily: 'TAVILY_SEARCH',
      youtube: 'YOUTUBE_SEARCH',
      firecrawl: 'FIRECRAWL_SCRAPE',
    };
    const poolId = poolIdMap[toolId] || toolId.toUpperCase();

    // Extract all keys
    let keysToProcess = [];
    if (typeof config === 'object' && !Array.isArray(config)) {
      const keysString = config.keys || '';
      keysToProcess = keysString
        .split(/[\n,]/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    } else if (Array.isArray(config)) {
      keysToProcess = config;
    } else {
      keysToProcess = String(config)
        .split(/[\n,]/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }

    if (keysToProcess.length === 0) {
      return NextResponse.json({ error: 'No keys found' }, { status: 404 });
    }

    const results = [];
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // Helper to get seconds until the end of the current month (matching KeyRotationManager)
    const getSecondsToNextMonth = () => {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return Math.floor((nextMonth - now) / 1000);
    };

    for (let i = 0; i < keysToProcess.length; i++) {
      const key = keysToProcess[i];
      const keyHash = crypto.createHash('md5').update(key).digest('hex');
      const cacheKey = `usage_cache:${toolId}:${keyHash}`;
      const maskedId = `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;

      try {
        // 1. Try to get from Redis Cache first (15 minute cache)
        if (redis) {
          const cached = await redis.get(cacheKey);
          if (cached) {
            const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
            results.push({
              keyIndex: i,
              keyId: maskedId,
              ...parsed,
              fromCache: true,
            });
            continue;
          }
        }

        // 2. Not in cache, fetch from Provider
        if (i > 0) await sleep(400);
        const stats = await getToolUsage(toolId, key);

        // 3. Store in Redis Usage Cache (for UI speed)
        if (redis && stats && !stats.error) {
          await redis.set(cacheKey, JSON.stringify(stats), { ex: 900 }); // 15 mins

          // 4. CRITICAL SYNC: Update the actual Rotation Manager counter with real provider data
          const internalId = `${poolId}-key-${i}`;
          const rotationCounterKey = `usage:${poolId}:${internalId}:rpmnt`;
          await redis.set(rotationCounterKey, stats.used, { ex: getSecondsToNextMonth() });

          // 5. SYNC RESET DATE: Store the actual refresh date for this specific key
          if (stats.resetDate) {
            const resetDateKey = `reset_date:${poolId}:${internalId}`;
            const secondsToReset = Math.floor((new Date(stats.resetDate) - new Date()) / 1000);
            if (secondsToReset > 0) {
              await redis.set(resetDateKey, stats.resetDate, { ex: secondsToReset });
            }
          }
        }

        results.push({
          keyIndex: i,
          keyId: maskedId,
          ...stats,
        });
      } catch (err) {
        results.push({
          keyIndex: i,
          keyId: maskedId,
          error: err.message,
        });

        // If we hit a 429, stop sequential fetching for this specific request
        if (err.message.includes('429')) break;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[ToolUsage API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
