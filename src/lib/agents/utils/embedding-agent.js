import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';

/**
 * Embedding Agent
 *
 * Specialized utility agent for generating vector embeddings.
 * This agent is used as a sub-agent by other agents (like Memoscribe)
 * to handle specialized vectorization tasks independently of the main chat model.
 */
export class EmbeddingAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.MEMO_EMBEDDER, config = {}) {
    super(agentId, config);
  }

  /**
   * Main execution: generates an embedding for the provided text
   * @param {Object} input - { text: string }
   */
  async _onExecute(input) {
    if (!input || !input.text) {
      throw new Error('Text is required for embedding generation');
    }

    const embeddings = await this.createEmbeddings();
    const vector = await embeddings.embedQuery(input.text);

    return { vector };
  }

  /**
   * Helper method to embed multiple strings
   * @param {string[]} texts
   */
  async embedDocuments(texts) {
    if (!this.isInitialized) await this.initialize();
    const embeddings = await this.createEmbeddings();
    return await embeddings.embedDocuments(texts);
  }

  /**
   * Helper method to embed a single query
   * @param {string} text
   */
  async embedQuery(text) {
    if (!this.isInitialized) await this.initialize();
    const embeddings = await this.createEmbeddings();
    return await embeddings.embedQuery(text);
  }
}

export const memoEmbedder = new EmbeddingAgent();
