/**
 * Image Editor Agent
 *
 * Edits existing images from descriptions using Google's generative models.
 * Replaces the legacy image-service.js `editImage`.
 * Extends BaseAgent.
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { GoogleGenAI } from '@google/genai';

class ImageEditorAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.IMAGE_EDITOR, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Image Editor Initialized');
  }

  async _validateInput(input) {
    if (!input || !input.base64Images) {
      throw new Error('base64Images is required');
    }
    if (
      !input.editPrompt ||
      typeof input.editPrompt !== 'string' ||
      input.editPrompt.trim().length === 0
    ) {
      throw new Error('editPrompt is required and must be a non-empty string');
    }
  }

  async _onExecute(input) {
    const { base64Images, editPrompt, aspectRatio = '1:1', providerId, model: inputModel } = input;

    // Use the new configuration system via BaseAgent's resolveProvider
    const resolvedProviderId = providerId || this.config.providerId;
    const provider = await this.resolveProvider(resolvedProviderId);

    if (!provider || !provider.apiKey) {
      throw new Error(
        'AI Provider is not configured or missing API key. Please check Admin > AI Command Hub.'
      );
    }

    const modelName = inputModel || this.config.model || 'gemini-1.5-flash';
    const genAI = new GoogleGenAI({ apiKey: provider.apiKey });

    // Ensure base64Images is an array
    const imagesArray = Array.isArray(base64Images) ? base64Images : [base64Images];

    this.logger.info(
      `Editing image(s) with model: ${modelName}, count: ${imagesArray.length}, aspect ratio: ${aspectRatio}`
    );

    const contents = [
      {
        role: 'user',
        parts: [
          ...imagesArray.map((base64) => ({
            inlineData: {
              data: base64,
              mimeType: 'image/jpeg',
            },
          })),
          {
            text: editPrompt.trim(),
          },
        ],
      },
    ];

    const result = await genAI.models.generateContent({
      model: modelName,
      contents,
      config: {
        responseModalities: ['IMAGE'],
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

export default ImageEditorAgent;
