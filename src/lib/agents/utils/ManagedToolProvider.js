import { TavilySearch } from '@langchain/tavily';
import { youtubeSearch } from './youtube-tools';
import dynamicSettingsManager from '@/lib/DynamicSettingsManager';
import keyRotationManager from '@/lib/providers/KeyRotationManager';

/**
 * ManagedToolProvider
 *
 * Centralized provider for self-healing, load-balanced tools.
 * Handles API key rotation, Redis-backed rate limiting, and monthly credit discovery.
 */
class ManagedToolProvider {
  /**
   * Get a list of configured tools by their IDs
   * @param {string[]} toolIds - e.g., ['tavily_search', 'youtube_search']
   * @param {Object} logger - The agent's logger instance
   */
  async getTools(toolIds = [], logger = console) {
    const tools = [];

    for (const id of toolIds) {
      try {
        const tool = await this._initializeTool(id, logger);
        if (tool) tools.push(tool);
      } catch (err) {
        logger.error(`[ManagedToolProvider] Failed to initialize tool ${id}:`, err.message);
      }
    }

    return tools;
  }

  /**
   * Initialize a specific tool with rotation and self-healing
   * @private
   */
  async _initializeTool(id, logger) {
    switch (id) {
      case 'tavily_search':
        return await this._getTavilySearch(logger);
      case 'youtube_search':
        return await this._getYoutubeSearch(logger);
      default:
        return null;
    }
  }

  /**
   * Configure Tavily with Rotation and Monthly Credit Discovery
   * @private
   */
  async _getTavilySearch(logger) {
    const config = await dynamicSettingsManager.get('TAVILY_API_KEY');
    if (!config) {
      logger.warn('⚠️ TAVILY_API_KEY missing from database.');
      return null;
    }

    // 1. Extract Keys & Limits
    const isObject = typeof config === 'object' && !Array.isArray(config);
    const keys = isObject ? config.keys : config;
    const limits = isObject ? { rpm: config.rpm, rpd: config.rpd, rpmnt: config.rpmnt } : {};

    // 2. Register with Global Rotation Manager
    keyRotationManager.registerToolPool('TAVILY_SEARCH', keys, 'Tavily', limits);

    // 3. Pick Next Available Key Globally
    const pooled = await keyRotationManager.getNextProvider('TAVILY_SEARCH');
    if (!pooled?.apiKey) {
      logger.warn('⚠️ No available Tavily keys in pool (limits reached).');
      return null;
    }

    const tool = new TavilySearch({ maxResults: 5, tavilyApiKey: pooled.apiKey });

    // 4. Wrap with "Limit Discovery" Logic
    const originalInvoke = tool.invoke.bind(tool);
    tool.invoke = async (input, callConfig) => {
      try {
        return await originalInvoke(input, callConfig);
      } catch (err) {
        const msg = err.message?.toLowerCase() || '';
        // 429 = Rate Limit, other strings for credit exhaustion
        if (err.status === 429 || msg.includes('limit') || msg.includes('credit')) {
          logger.warn(`🛑 Tavily key ${pooled.internalId} hit a limit! Throttling globally.`);
          // Mark as throttled (Default cooldown to end of month in KeyRotationManager)
          await keyRotationManager.markThrottled('TAVILY_SEARCH', pooled.internalId);
        }
        throw err;
      }
    };

    logger.info(`✅ Tavily Tool ready (using ${pooled.internalId})`);
    return tool;
  }

  /**
   * Configure YouTube with Rotation and Monthly Credit Discovery
   * @private
   */
  async _getYoutubeSearch(logger) {
    const config = await dynamicSettingsManager.get('GOOGLE_API_KEY');
    if (!config) {
      logger.warn('⚠️ GOOGLE_API_KEY missing from database.');
      return null;
    }

    // 1. Extract Keys & Limits
    const isObject = typeof config === 'object' && !Array.isArray(config);
    const keys = isObject ? config.keys : config;
    const limits = isObject ? { rpm: config.rpm, rpd: config.rpd, rpmnt: config.rpmnt } : {};

    // 2. Register with Global Rotation Manager
    keyRotationManager.registerToolPool('YOUTUBE_SEARCH', keys, 'YouTube', limits);

    // 3. Pick Next Available Key Globally
    const pooled = await keyRotationManager.getNextProvider('YOUTUBE_SEARCH');
    if (!pooled?.apiKey) {
      logger.warn('⚠️ No available YouTube keys in pool (limits reached).');
      return null;
    }

    // 4. Injected key into configurable field of the tool
    const tool = youtubeSearch;

    // 5. Wrap with "Limit Discovery" Logic
    const originalInvoke = tool.invoke.bind(tool);
    tool.invoke = async (input, callConfig) => {
      // Inject the rotated key into the tool's execution context
      const configWithKey = {
        ...callConfig,
        configurable: { ...callConfig?.configurable, apiKey: pooled.apiKey },
      };

      try {
        return await originalInvoke(input, configWithKey);
      } catch (err) {
        const msg = err.message?.toLowerCase() || '';
        // YouTube usually returns 403 for quota errors
        if (
          err.status === 429 ||
          err.status === 403 ||
          msg.includes('quota') ||
          msg.includes('limit')
        ) {
          logger.warn(`🛑 YouTube key ${pooled.internalId} hit a limit! Throttling globally.`);
          await keyRotationManager.markThrottled('YOUTUBE_SEARCH', pooled.internalId);
        }
        throw err;
      }
    };

    logger.info(`✅ YouTube Tool ready (using ${pooled.internalId})`);
    return tool;
  }
}

const managedToolProvider = new ManagedToolProvider();
export default managedToolProvider;
