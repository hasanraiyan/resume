import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import OpenAI from 'openai';
import dynamicSettingsManager from '@/lib/DynamicSettingsManager';

const POLLINATIONS_BASE_URL = 'https://gen.pollinations.ai';

class CoursifyThumbnailAgent extends BaseAgent {
  constructor(config = {}) {
    super(AGENT_IDS.COURSIFY_THUMBNAIL_GENERATOR, config);
  }

  async _onInitialize() {
    this.logger.info('Coursify Thumbnail Agent initialized (Pollinations / gptimage-large)');
  }

  async _validateInput(input) {
    if (!input?.prompt || typeof input.prompt !== 'string' || !input.prompt.trim()) {
      throw new Error('prompt is required and must be a non-empty string');
    }
  }

  async _buildClient() {
    const provider = this.config.provider;
    let apiKey = provider?.apiKey || (await dynamicSettingsManager.get('POLLINATIONS_API_KEY'));
    let baseURL =
      provider?.baseUrl ||
      (await dynamicSettingsManager.get('POLLINATIONS_BASE_URL', POLLINATIONS_BASE_URL));

    // Fallback to process.env if still not found
    if (!apiKey) apiKey = process.env.POLLINATIONS_API_KEY;

    // Sync with Search Agent if primary config is missing or incomplete
    if (!apiKey || !baseURL || baseURL === POLLINATIONS_BASE_URL) {
      try {
        const { getPollinationsConfig } = await import('@/lib/pollinations-balance');
        const syncConfig = await getPollinationsConfig();
        if (syncConfig) {
          apiKey = syncConfig.apiKey || apiKey;
          baseURL = syncConfig.baseUrl || baseURL;
          this.logger.info('Synced configuration with Coursify Search Agent');
        }
      } catch (err) {
        this.logger.warn('Failed to sync config with Search Agent:', err.message);
      }
    }

    return {
      client: new OpenAI({
        baseURL: baseURL || 'https://gen.pollinations.ai/v1',
        apiKey: apiKey || 'placeholder',
      }),
      baseURL,
    };
  }

  async _onExecute(input) {
    const { prompt, size = '1792x1024' } = input;
    const model = input.model || this.config.model || this.config.defaultModel || 'gptimage-large';
    const { client, baseURL } = await this._buildClient();
    const t0 = Date.now();
    const elapsed = () => `+${Date.now() - t0}ms`;

    // Balance Check (Synchronized with Search Agent Config)
    try {
      const { getPollinationsBalance } = await import('@/lib/pollinations-balance');
      const balanceData = await getPollinationsBalance();
      if (balanceData.status === 'depleted') {
        throw new Error('Pollinations AI balance is 0. It will reset after 1 hour.');
      }
      this.logger.info(`Balance check passed: ${balanceData.balance} credits`);
    } catch (err) {
      if (err.message.includes('balance is 0')) throw err;
      this.logger.warn('Failed to check balance, proceeding anyway:', err.message);
    }

    this.logger.info(`Calling images.generate — model=${model} size=${size} baseURL=${baseURL}`);

    const response = await client.images.generate({
      model,
      prompt: prompt.trim(),
      n: 1,
      size,
      response_format: 'b64_json',
    });
    this.logger.info(`API responded (${elapsed()})`);

    const item = response.data[0];
    const keys = Object.keys(item ?? {}).join(', ');
    this.logger.info(`Response item keys: [${keys}]`);

    let buffer;

    if (item?.b64_json) {
      buffer = Buffer.from(item.b64_json, 'base64');
      this.logger.info(
        `Decoded b64_json → buffer ${(buffer.length / 1024).toFixed(1)}KB (${elapsed()})`
      );
    } else if (item?.url) {
      this.logger.info(`No b64_json — fetching from URL: ${item.url} (${elapsed()})`);
      const imgRes = await fetch(item.url);
      if (!imgRes.ok)
        throw new Error(`Image URL fetch failed: ${imgRes.status} ${imgRes.statusText}`);
      buffer = Buffer.from(await imgRes.arrayBuffer());
      this.logger.info(
        `Fetched image → buffer ${(buffer.length / 1024).toFixed(1)}KB (${elapsed()})`
      );
    } else {
      this.logger.error(`Unexpected response shape — full item: ${JSON.stringify(item)}`);
      throw new Error('No image data returned from image API');
    }

    this.logger.info(`Done — total=${elapsed()}`);
    return { buffer, mimeType: 'image/png', extension: 'png', url: item?.url ?? null };
  }
}

export default CoursifyThumbnailAgent;
