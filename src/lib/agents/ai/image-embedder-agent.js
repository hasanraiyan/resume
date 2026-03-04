/**
 * Image Embedder Agent
 *
 * Generates vector embeddings for text prompts using Google and OpenAI models.
 * Extends BaseAgent.
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';

class ImageEmbedderAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.IMAGE_EMBEDDER, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Image Embedder Initialized');
  }

  async _validateInput(input) {
    if (!input || (!input.text && !input.prompt)) {
      throw new Error('text or prompt is required for embedding');
    }
  }

  async _onExecute(input) {
    const text = input.text || input.prompt;
    const embeddings = await this.createEmbeddings();

    this.logger.info(`Generating embedding for text: ${text.substring(0, 50)}...`);
    const embedding = await embeddings.embedQuery(text);

    return { embedding };
  }
}

export default ImageEmbedderAgent;
