/**
 * AI Image Agent
 *
 * Handles image analysis and generation tasks using LangGraph.
 * Extends BaseAgent.
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

class AIImageAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.IMAGE_ANALYZER, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('AI Image Agent initialized');
  }

  async analyzeImage(base64Data, mimeType = 'image/jpeg') {
    const provider = await this.resolveProvider(
      this.config.providerId || this.config.defaultProvider
    );
    if (!provider) throw new Error('No provider found for AIImageAgent');

    const { apiKey, baseUrl, model } = provider;
    const isGoogle = baseUrl?.includes('googleapis');
    const persona = this.config.persona || 'Describe this image clearly and concisely.';

    if (isGoogle) {
      return this.analyzeWithGoogle(
        apiKey,
        model || 'gemini-1.5-flash',
        persona,
        base64Data,
        mimeType
      );
    } else {
      return this.analyzeWithOpenAI(
        apiKey,
        baseUrl,
        model || 'gpt-4o',
        persona,
        base64Data,
        mimeType
      );
    }
  }

  async generateEmbedding(text) {
    const provider = await this.resolveProvider(
      this.config.providerId || this.config.defaultProvider
    );
    if (!provider) throw new Error('No provider found for AIImageAgent');

    const { apiKey, baseUrl } = provider;
    const isGoogle = baseUrl?.includes('googleapis');

    const defaultGoogleEmb = 'gemini-embedding-001';
    const defaultOpenAIEmb = 'text-embedding-3-small';

    if (isGoogle) {
      return this.embedWithGoogle(apiKey, this.config.model || defaultGoogleEmb, text);
    } else {
      return this.embedWithOpenAI(apiKey, baseUrl, this.config.model || defaultOpenAIEmb, text);
    }
  }

  async embedWithGoogle(apiKey, modelName, text) {
    const genAI = new GoogleGenAI({ apiKey });
    const selectedModel =
      modelName && typeof modelName === 'string' && modelName.includes('embed')
        ? modelName
        : 'text-embedding-004';

    const result = await genAI.models.embedContent({
      model: selectedModel,
      contents: [{ parts: [{ text }] }],
      config: {
        outputDimensionality: 768,
      },
    });
    return result.embeddings[0].values;
  }

  async embedWithOpenAI(apiKey, baseUrl, modelName, text) {
    const openai = new OpenAI({ apiKey, baseURL: baseUrl });
    const selectedModel =
      modelName && typeof modelName === 'string' && modelName.includes('embed')
        ? modelName
        : 'text-embedding-3-small';
    const response = await openai.embeddings.create({
      model: selectedModel,
      input: text,
      dimensions: 768,
    });
    return response.data[0].embedding;
  }

  async analyzeWithGoogle(apiKey, modelName, persona, base64Data, mimeType) {
    const genAI = new GoogleGenAI({ apiKey });

    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [{ inlineData: { data: base64Data, mimeType } }, { text: persona }],
        },
      ],
    });

    const response = result;
    // In the new SDK, use candidates[0].content.parts[0].text or helper methods
    return response.candidates[0].content.parts[0].text.trim();
  }

  async analyzeWithOpenAI(apiKey, baseUrl, modelName, persona, base64Data, mimeType) {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true, baseURL: baseUrl });
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: persona },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
          ],
        },
      ],
      max_tokens: 300,
    });
    return response.choices[0].message.content.trim();
  }

  async *_onStreamExecute(input) {
    const { imageUrl, prompt = 'Analyze this image', base64Data, mimeType = 'image/jpeg' } = input;
    try {
      yield { type: 'status', message: '🖼️ Analyzing image...' };
      const analysis = await this.analyzeImage(base64Data, mimeType);
      yield { type: 'content', message: analysis };
    } catch (error) {
      this.logger.error('Stream execution error:', error);
      throw error;
    }
  }

  async _onExecute(input) {
    const action = input.taskType || input.action;
    const base64 = input.base64Image || input.base64Data;

    if (action === 'embedding' || action === 'embed' || input.text) {
      const embedding = await this.generateEmbedding(input.text);
      return { embedding };
    }

    if (action === 'analyze' || base64) {
      return await this.analyzeImage(base64, input.mimeType || 'image/jpeg');
    }

    throw new Error(
      'Unsupported execution action for AIImageAgent. Use taskType: "analyze" or "embedding".'
    );
  }
}

export const aiImageAgent = new AIImageAgent();
export default AIImageAgent;
