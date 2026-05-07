import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import OpenAI from 'openai';

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

  _buildClient() {
    const provider = this.config.provider;
    const apiKey = provider?.apiKey || process.env.POLLINATIONS_API_KEY || 'placeholder';
    const baseURL = provider?.baseUrl || POLLINATIONS_BASE_URL;
    return { client: new OpenAI({ baseURL, apiKey }), baseURL };
  }

  async _onExecute(input) {
    const { prompt, size = '1792x1024' } = input;
    const provider = this.config.provider;
    const model = input.model || this.config.model || this.config.defaultModel || 'gptimage-large';

    const { client } = this._buildClient();
    this.logger.info(`Generating thumbnail with model: ${model}`);

    const response = await client.images.generate({
      model,
      prompt: prompt.trim(),
      n: 1,
      size,
      response_format: 'b64_json',
    });

    const item = response.data[0];
    this.logger.info(`Response keys: ${Object.keys(item ?? {}).join(', ')}`);

    let buffer;

    if (item?.b64_json) {
      buffer = Buffer.from(item.b64_json, 'base64');
    } else if (item?.url) {
      this.logger.info('Falling back to URL fetch...');
      const imgRes = await fetch(item.url);
      if (!imgRes.ok) throw new Error(`Failed to fetch generated image: ${imgRes.status}`);
      buffer = Buffer.from(await imgRes.arrayBuffer());
    } else {
      this.logger.error('Unexpected response shape:', JSON.stringify(item));
      throw new Error('No image data returned from Pollinations');
    }

    return { buffer, mimeType: 'image/png', extension: 'png', url: item?.url ?? null };
  }
}

export default CoursifyThumbnailAgent;
