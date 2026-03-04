/**
 * Image Embedder Agent
 *
 * Generates vector embeddings for text prompts using Google and OpenAI models.
 * Extends BaseAgent.
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

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
    const provider = await this.resolveProvider(
      this.config.providerId || this.config.defaultProvider
    );
    if (!provider) throw new Error('No provider found for ImageEmbedderAgent');

    const { apiKey, baseUrl } = provider;
    const isGoogle = baseUrl?.includes('googleapis');

    const defaultGoogleEmb = 'gemini-embedding-001';
    const defaultOpenAIEmb = 'text-embedding-3-small';

    const rawModel = this.config.model || (isGoogle ? defaultGoogleEmb : defaultOpenAIEmb);
    const modelName = rawModel.replace(/^models\//, '');

    if (isGoogle) {
      return this.embedWithGoogle(apiKey, modelName, text);
    } else {
      return this.embedWithOpenAI(apiKey, baseUrl, modelName, text);
    }
  }

  async embedWithGoogle(apiKey, modelName, text) {
    const genAI = new GoogleGenAI({ apiKey });
    this.logger.info(`Generating Google embedding with model: ${modelName}`);

    const result = await genAI.models.embedContent({
      model: modelName,
      contents: text,
      config: {
        outputDimensionality: 768,
      },
    });

    // Standardize result parsing for @google/genai
    const values = result.embedding?.values || result.embeddings?.[0]?.values || result.embedding;
    return { embedding: values };
  }

  async embedWithOpenAI(apiKey, baseUrl, modelName, text) {
    const openai = new OpenAI({ apiKey, baseURL: baseUrl });

    this.logger.info(`Generating OpenAI embedding with model: ${modelName}`);

    const response = await openai.embeddings.create({
      model: modelName,
      input: text,
      dimensions: 768,
    });

    return { embedding: response.data[0].embedding };
  }
}

export default ImageEmbedderAgent;
