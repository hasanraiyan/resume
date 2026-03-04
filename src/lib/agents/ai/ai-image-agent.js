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

    const { apiKey, baseUrl, model: providerModel } = provider;
    const isGoogle = baseUrl?.includes('googleapis');
    const persona =
      this.config.persona ||
      'You are a Professional Visual Content Analyst. Provide a highly detailed, comprehensive description of this image. For maximum semantic search (RAG) performance, include: 1. Core Subject: Exactly what is in the image. 2. Style: Is it a photo, anime, 3D render, oil painting, or sketch? 3. Composition: Foreground/background elements, lighting, and camera angle. 4. Color Palette: Dominant and accent colors. 5. Mood/Atmosphere: Vibrant, dark, futuristic, calm, etc. 6. Fine Details: Textures, materials, and any specific text or symbols visible. Aim for a rich narrative that captures the essence of the visual.';

    // Prioritize Agent Config model over Provider default model
    const rawModel =
      this.config.model || providerModel || (isGoogle ? 'gemini-1.5-flash' : 'gpt-4o');
    const modelName = rawModel.replace(/^models\//, '');

    this.logger.info('Analyzing image with:', {
      provider: provider.name,
      rawModel,
      resolvedModel: modelName,
      isGoogle,
    });

    if (isGoogle) {
      return this.analyzeWithGoogle(apiKey, modelName, persona, base64Data, mimeType);
    } else {
      return this.analyzeWithOpenAI(apiKey, baseUrl, modelName, persona, base64Data, mimeType);
    }
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
    // In @google/genai, result contains candidates
    if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('No text returned from Gemini analysis');
    }
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

    if (action === 'analyze' || base64) {
      return await this.analyzeImage(base64, input.mimeType || 'image/jpeg');
    }

    throw new Error(
      'Unsupported execution action for AIImageAgent. Use taskType: "analyze" or "embedding".'
    );
  }
}

export default AIImageAgent;
