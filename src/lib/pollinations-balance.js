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

export async function getPollinationsBalance() {
  try {
    const config = await getPollinationsConfig();

    if (!config || !config.apiKey) {
      return {
        balance: 0,
        balanceINR: 0,
        status: 'no_api_key',
        message: 'Pollinations configuration (from Search Agent) is missing',
      };
    }

    const { apiKey } = config;

    // Fetch balance and exchange rate in parallel
    const [balanceRes, exchangeRate] = await Promise.all([
      fetch(BALANCE_URL, { headers: { Authorization: `Bearer ${apiKey}` } }),
      getExchangeRate(),
    ]);

    if (!balanceRes.ok) {
      if (balanceRes.status === 401) {
        return { balance: 0, balanceINR: 0, status: 'invalid_api_key', message: 'Invalid API Key' };
      }
      throw new Error(`Pollinations API error: ${balanceRes.status}`);
    }

    const data = await balanceRes.json();
    const balance = data.balance ?? 0;
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

    const dailyStats = dailyLogs.reduce(
      (acc, log) => {
        const tokens = log.usage?.totalTokens || 0;
        acc.totalTokens += tokens;
        acc.totalCostINR += (tokens / 1000) * 0.002 * exchangeRate;
        acc.count += 1;
        return acc;
      },
      { totalTokens: 0, totalCostINR: 0, count: 0 }
    );

    if (balance <= 0) {
      return {
        balance: 0,
        balanceINR: 0,
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
      balanceINR: 0,
      status: 'error',
      message: error.message || 'Failed to fetch balance',
    };
  }
}
