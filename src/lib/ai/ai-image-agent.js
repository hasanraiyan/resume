/**
 * AI Image Agent
 *
 * Handles image analysis, embedding generation, and visual processing.
 * Extends BaseAgent for consistent agent behavior.
 */

import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import BaseAgent from '../agents/BaseAgent';
import { AGENT_IDS, AGENT_TOOLS } from '@/lib/constants/agents';
import dbConnect from '@/lib/dbConnect';
import ChatbotSettings from '@/models/ChatbotSettings';
import MediaAgentSettings from '@/models/MediaAgentSettings';
import { decrypt } from '@/lib/crypto';

class AIImageAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.IMAGE_ANALYZER, config = {}) {
    super(agentId, config);
    this._settingsCache = null;
    this._embeddingSettingsCache = null;
  }

  /**
   * Initialize the agent
   */
  async _onInitialize() {
    await this._loadSettings();
  }

  /**
   * Load settings from database
   * @private
   */
  async _loadSettings() {
    try {
      await dbConnect();
      const agentSettings = await MediaAgentSettings.findOne({});
      const chatbotSettings = await ChatbotSettings.findOne({});

      if (!chatbotSettings || !chatbotSettings.providers) {
        this.logger.warn('No AI providers configured in Chatbot settings.');
      }

      this._settingsCache = {
        agent: agentSettings,
        chatbot: chatbotSettings,
      };
    } catch (error) {
      this.logger.error('Failed to load settings:', error);
      throw error;
    }
  }

  /**
   * Get AI provider settings
   * @returns {Promise<Object>} Provider configuration
   */
  async getSettings() {
    if (!this._settingsCache) {
      await this._loadSettings();
    }

    const { agent, chatbot } = this._settingsCache;
    const providerId = agent?.providerId || this.config.defaultProvider;
    const model = agent?.model || this.config.defaultModel;
    const persona = agent?.persona || this.config.persona;

    const provider = chatbot?.providers?.find((p) => p.id === providerId && p.isActive);

    if (!provider) {
      throw new Error('Selected AI provider is inactive or not found.');
    }

    const apiKey = decrypt(provider.apiKey);

    return {
      apiKey,
      baseUrl: provider.baseUrl,
      model,
      persona,
      isGoogle: provider.baseUrl?.includes('googleapis'),
    };
  }

  /**
   * Get embedding-specific settings
   * @returns {Promise<Object>} Embedding configuration
   */
  async getEmbeddingSettings() {
    if (!this._settingsCache) {
      await this._loadSettings();
    }

    const { agent, chatbot } = this._settingsCache;
    const providerId =
      agent?.embeddingProviderId || agent?.providerId || this.config.defaultProvider;
    const model =
      agent?.embeddingModel ||
      this.config.embeddingModel ||
      (providerId?.includes('google') ? 'embedding-001' : 'text-embedding-3-small');

    const provider = chatbot?.providers?.find((p) => p.id === providerId && p.isActive);

    if (!provider) {
      throw new Error('Selected embedding provider is inactive or not found.');
    }

    const apiKey = decrypt(provider.apiKey);

    return {
      apiKey,
      baseUrl: provider.baseUrl,
      model,
      isGoogle: provider.baseUrl?.includes('googleapis'),
    };
  }

  /**
   * Execute the agent - analyze an image
   * @param {Object} input - Input data
   * @param {string} input.base64Data - Base64 encoded image data
   * @param {string} input.mimeType - Image MIME type
   * @returns {Promise<Object>} Analysis result
   */
  async _onExecute(input) {
    const { base64Data, mimeType = 'image/jpeg' } = input;

    if (!base64Data) {
      throw new Error('base64Data is required for image analysis');
    }

    this.logger.info('Analyzing image...');
    const description = await this.analyzeImage(base64Data, mimeType);

    return {
      success: true,
      description,
      metadata: {
        mimeType,
        analyzedAt: new Date(),
        agentId: this.agentId,
      },
    };
  }

  /**
   * Analyze an image using configured provider
   * @param {string} base64Data - Base64 encoded image
   * @param {string} mimeType - Image MIME type
   * @returns {Promise<string>} Image description
   */
  async analyzeImage(base64Data, mimeType = 'image/jpeg') {
    const { apiKey, baseUrl, model, persona, isGoogle } = await this.getSettings();

    if (isGoogle) {
      return this.analyzeWithGoogle(apiKey, model, persona, base64Data, mimeType);
    } else {
      return this.analyzeWithOpenAI(apiKey, baseUrl, model, persona, base64Data, mimeType);
    }
  }

  /**
   * Generate embedding for text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Embedding vector
   */
  async generateEmbedding(text) {
    const { apiKey, baseUrl, model, isGoogle } = await this.getEmbeddingSettings();

    if (isGoogle) {
      return this.embedWithGoogle(apiKey, model, text);
    } else {
      return this.embedWithOpenAI(apiKey, baseUrl, model, text);
    }
  }

  /**
   * Generate embedding using Google AI
   * @private
   */
  async embedWithGoogle(apiKey, modelName, text) {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });
    const selectedModel = modelName || 'gemini-embedding-001';
    const response = await ai.models.embedContent({
      model: selectedModel,
      contents: [text],
      outputDimensionality: 768,
    });
    return response.embeddings[0].values;
  }

  /**
   * Generate embedding using OpenAI-compatible API
   * @private
   */
  async embedWithOpenAI(apiKey, baseUrl, modelName, text) {
    const openai = new OpenAI({
      apiKey,
      baseURL: baseUrl,
    });

    const response = await openai.embeddings.create({
      model: modelName || 'text-embedding-3-small',
      input: text,
      dimensions: 768,
    });

    return response.data[0].embedding;
  }

  /**
   * Analyze image using Google AI
   * @private
   */
  async analyzeWithGoogle(apiKey, modelName, persona, base64Data, mimeType) {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const response = await ai.models.generateContent({
      model: modelName || 'gemini-1.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
            { text: persona },
          ],
        },
      ],
    });

    return response.text.trim();
  }

  /**
   * Analyze image using OpenAI-compatible API
   * @private
   */
  async analyzeWithOpenAI(apiKey, baseUrl, modelName, persona, base64Data, mimeType) {
    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
      baseURL: baseUrl,
    });

    const response = await openai.chat.completions.create({
      model: modelName || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: persona },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    return response.choices[0].message.content.trim();
  }

  /**
   * Refresh settings cache
   */
  async refreshSettings() {
    this._settingsCache = null;
    this._embeddingSettingsCache = null;
    await this._loadSettings();
    this.logger.info('Settings cache refreshed');
  }

  /**
   * Get agent tools
   * @returns {string[]} Array of tool names
   */
  getTools() {
    return AGENT_TOOLS[this.agentId] || [];
  }
}

// Export singleton instance
export const aiImageAgent = new AIImageAgent();

// Also export the class for registry registration
export default AIImageAgent;
