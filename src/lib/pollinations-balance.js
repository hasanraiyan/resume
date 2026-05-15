import dbConnect from '@/lib/dbConnect';
import AgentConfig from '@/models/AgentConfig';
import ProviderSettings from '@/models/ProviderSettings';
import { decrypt } from '@/lib/crypto';
import { AGENT_IDS } from '@/lib/constants/agents';

/**
 * Pollinations Balance Utility
 *
 * Fetches the current balance from Pollinations AI using the same configuration
 * as the Coursify Search Agent.
 */

const BALANCE_URL = 'https://gen.pollinations.ai/account/balance';

/**
 * Resolve the Pollinations configuration from the Search Agent
 * @returns {Promise<{apiKey: string, baseUrl: string}>}
 */
export async function getPollinationsConfig() {
  await dbConnect();

  // 1. Get the configuration for Coursify Search Agent
  const config = await AgentConfig.findOne({ agentId: AGENT_IDS.COURSIFY_SEARCH }).lean();

  // 2. Resolve the provider ID (from DB or default)
  const providerId = config?.providerId || 'openai';

  // 3. Fetch and decrypt the provider settings
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

export async function getPollinationsBalance() {
  try {
    const config = await getPollinationsConfig();

    if (!config || !config.apiKey) {
      return {
        balance: 0,
        status: 'no_api_key',
        message: 'Pollinations configuration (from Search Agent) is missing',
      };
    }

    const { apiKey } = config;

    // 4. Fetch the balance
    const response = await fetch(BALANCE_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { balance: 0, status: 'invalid_api_key', message: 'Invalid API Key' };
      }
      throw new Error(`Pollinations API error: ${response.status}`);
    }

    const data = await response.json();
    const balance = data.balance ?? 0;

    if (balance <= 0) {
      return {
        balance: 0,
        status: 'depleted',
        message: 'Balance depleted. It will reset after 1 hour.',
        resetIn: '1h',
      };
    }

    return {
      balance,
      status: 'active',
      message: `Balance: ${balance} credits`,
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
