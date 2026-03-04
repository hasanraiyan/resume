/**
 * Image Generator Agent
 *
 * Generates images from text prompts using Google's generative models.
 * Replaces the legacy image-service.js `generateImage`.
 * Extends BaseAgent.
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { GoogleGenAI } from '@google/genai';
import dbConnect from '@/lib/dbConnect';
import ChatbotSettings from '@/models/ChatbotSettings';
import { decrypt } from '@/lib/crypto';

class ImageGeneratorAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.IMAGE_GENERATOR, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Image Generator Initialized');
  }

  async _validateInput(input) {
    if (
      !input ||
      !input.prompt ||
      typeof input.prompt !== 'string' ||
      input.prompt.trim().length === 0
    ) {
      throw new Error('prompt is required and must be a non-empty string');
    }
  }

  async _onExecute(input) {
    const { prompt, aspectRatio = '1:1', providerId, model: inputModel } = input;

    // Use the new configuration system via BaseAgent's resolveProvider
    const resolvedProviderId = providerId || this.config.providerId;
    const provider = await this.resolveProvider(resolvedProviderId);

    if (!provider || !provider.apiKey) {
      throw new Error(
        'AI Provider is not configured or missing API key. Please check Admin > AI Command Hub.'
      );
    }

    const modelName = inputModel || this.config.model || 'gemini-2.0-flash-exp';
    const genAI = new GoogleGenAI({ apiKey: provider.apiKey });

    this.logger.info(`Generating with model: ${modelName}, aspect ratio: ${aspectRatio}`);

    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt.trim() }] }],
      config: {
        responseModalities: ['IMAGE'],
        // Specialized image generation config
        // @ts-ignore
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    });

    const response = result;
    const candidates = response.candidates;

    if (
      !candidates ||
      candidates.length === 0 ||
      !candidates[0].content ||
      !candidates[0].content.parts ||
      candidates[0].content.parts.length === 0
    ) {
      throw new Error(
        "No image was generated in the response. The response may have been blocked or the model didn't return an image."
      );
    }

    const part = candidates[0].content.parts[0];
    if (!part.inlineData) {
      throw new Error('No image data found in the response part.');
    }

    const inlineData = part.inlineData;
    const buffer = Buffer.from(inlineData.data, 'base64');
    const mimeType = inlineData.mimeType;
    const extension = mimeType?.split('/')[1] || 'png';

    return { buffer, mimeType, extension };
  }
}

export const imageGeneratorAgent = new ImageGeneratorAgent();
export default ImageGeneratorAgent;
