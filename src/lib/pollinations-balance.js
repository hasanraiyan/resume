import dbConnect from '@/lib/dbConnect';
import AgentConfig from '@/models/AgentConfig';
import ProviderSettings from '@/models/ProviderSettings';
import { decrypt } from '@/lib/crypto';
import { AGENT_IDS } from '@/lib/constants/agents';

/**
 * Pollinations Balance Utility
 *
 * Fetches the current balance from Pollinations AI using the same configuration
 * as the Coursify Search Agent and converts it to INR.
 */

const BALANCE_URL = 'https://gen.pollinations.ai/account/balance';
const EXCHANGE_RATE_URL = 'https://api.frankfurter.app/latest?from=USD&to=INR';

/**
 * Fetch the latest USD to INR exchange rate with in-memory caching (1 hour)
 * @returns {Promise<number>}
 */
let cachedRate = null;
let lastFetchTime = 0;
const CACHE_DURATION = 3600000; // 1 hour

async function getExchangeRate() {
  const now = Date.now();
  if (cachedRate && now - lastFetchTime < CACHE_DURATION) {
    return cachedRate;
  }

  try {
    const res = await fetch(EXCHANGE_RATE_URL);
    if (!res.ok) throw new Error('Failed to fetch exchange rate');
    const data = await res.json();
    cachedRate = data.rates.INR || 83.5;
    lastFetchTime = now;
    return cachedRate;
  } catch (error) {
    console.warn(
      '[PollinationsBalance] Exchange rate fetch failed, using fallback:',
      error.message
    );
    return cachedRate || 83.5; // Return cached rate even if expired, or fallback
  }
}

/**
 * Resolve the Pollinations configuration from the Search Agent
 * @returns {Promise<{apiKey: string, baseUrl: string}>}
 */
export async function getPollinationsConfig() {
  await dbConnect();

  const config = await AgentConfig.findOne({ agentId: AGENT_IDS.COURSIFY_SEARCH }).lean();
  const providerId = config?.providerId || 'openai';

  let provider = await ProviderSettings.findOne({ providerId }).lean();
  if (!provider && providerId === 'openai') {
    provider = await ProviderSettings.findOne({
      $or: [{ providerId: 'openai' }, { name: /openai/i }],
    }).lean();
  }

  if (!provider) return null;

  // ONLY return config if it's actually a Pollinations provider
  const isPollinations =
    provider.baseUrl?.includes('pollinations.ai') ||
    provider.name?.toLowerCase().includes('pollinations');

  if (!isPollinations) {
    return null;
  }

  let apiKey = provider.apiKey;
  if (apiKey) {
    try {
      apiKey = decrypt(apiKey);
    } catch (e) {
      console.error('[PollinationsBalance] Decryption failed:', e);
    }
  }

  return {
    apiKey,
    baseUrl: provider.baseUrl || 'https://gen.pollinations.ai/v1',
  };
}

export async function getPollinationsBalance() {
  try {
    const config = await getPollinationsConfig();

    if (!config || !config.apiKey) {
      return {
        balance: 0,
        status: 'not_supported',
        message: 'Balance tracking not supported for this provider',
      };
    }

    const { apiKey } = config;
    const keys = Array.isArray(apiKey) ? apiKey : [apiKey];

    // Fetch exchange rate first
    const exchangeRate = await getExchangeRate();

    // Fetch all balances concurrently
    const balancePromises = keys.map(async (key) => {
      try {
        const res = await fetch(BALANCE_URL, {
          headers: { Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(5000), // 5s timeout per request
        });
        if (!res.ok) return 0;
        const data = await res.json();
        return data.balance ?? 0;
      } catch (err) {
        console.warn('[PollinationsBalance] Failed to fetch balance for one key:', err.message);
        return 0;
      }
    });

    const balances = await Promise.all(balancePromises);
    const balance = balances.reduce((sum, b) => sum + b, 0);
    const balanceINR = balance * exchangeRate;

    // ─── Fetch Today's Consumption ───
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const AgentExecutionLog = (await import('@/models/AgentExecutionLog')).default;
    const dailyLogs = await AgentExecutionLog.find({
      agentId: AGENT_IDS.COURSIFY_SEARCH,
      status: 'success',
      createdAt: { $gte: startOfDay },
    }).lean();

    const { calculateEstimatedCostUSD } = await import('@/lib/agents/utils/pricing');
    const dailyStats = dailyLogs.reduce(
      (acc, log) => {
        const usage = log.usage || {};
        const tokens = usage.totalTokens || 0;
        acc.totalTokens += tokens;
        acc.totalCostUSD += calculateEstimatedCostUSD(
          usage.promptTokens || 0,
          usage.completionTokens || 0
        );
        acc.count += 1;
        return acc;
      },
      { totalTokens: 0, totalCostUSD: 0, count: 0 }
    );
    dailyStats.totalCostINR = dailyStats.totalCostUSD * exchangeRate;

    if (balance <= 0) {
      return {
        balance: 0,
        status: 'depleted',
        message: 'Balance depleted. It will reset after 1 hour.',
        resetIn: '1h',
        dailyStats,
      };
    }

    return {
      balance,
      balanceINR,
      status: 'active',
      message: `Balance: $${balance.toFixed(4)} (₹${balanceINR.toFixed(2)})`,
      dailyStats,
    };
  } catch (error) {
    console.error('[PollinationsBalance] Error fetching balance:', error);
    return {
      balance: 0,
      status: 'error',
      message: error.message || 'Failed to fetch balance',
    };
  }
}
