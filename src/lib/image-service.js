// src/lib/image-service.js
import { GoogleGenAI } from '@google/genai';
import dbConnect from '@/lib/dbConnect';
import ChatbotSettings from '@/models/ChatbotSettings';
import { decrypt } from '@/lib/crypto';

class ImageService {
  async generateImage(prompt, aspectRatio = '1:1', providerId, modelName) {
    await dbConnect();
    const settings = await ChatbotSettings.findOne({});
    if (!settings || !settings.providers || settings.providers.length === 0) {
      throw new Error(
        'No AI providers configured. Please add a Google provider in Admin > Chatbot settings.'
      );
    }

    // Find the specified provider, or fall back to the first active Google provider
    let provider;
    if (providerId) {
      provider = settings.providers.find((p) => p.id === providerId && p.isActive);
    }
    if (!provider) {
      provider = settings.providers.find((p) => p.isActive && p.baseUrl?.includes('googleapis'));
    }
    if (!provider) {
      throw new Error(
        'No active Google provider found. Please configure one in Admin > Chatbot settings.'
      );
    }

    const apiKey = decrypt(provider.apiKey);
    if (!apiKey) {
      throw new Error(
        'Failed to decrypt Google provider API key. Please re-enter it in Admin > Chatbot settings.'
      );
    }

    const model = modelName || 'gemini-2.0-flash-preview-image-generation';
    const genAI = new GoogleGenAI({ apiKey });

    console.log(`[Gemini] Generating with model: ${model}, aspect ratio: ${aspectRatio}`);

    const response = await genAI.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio,
        },
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0 || !candidates[0].content.parts[0].inlineData) {
      throw new Error('No image was generated in the response');
    }

    const inlineData = candidates[0].content.parts[0].inlineData;
    const buffer = Buffer.from(inlineData.data, 'base64');
    const mimeType = inlineData.mimeType;
    const extension = mimeType?.split('/')[1] || 'png';

    return { buffer, mimeType, extension };
  }

  async editImage(base64Images, editPrompt, aspectRatio = '1:1', providerId, modelName) {
    await dbConnect();
    const settings = await ChatbotSettings.findOne({});
    if (!settings || !settings.providers || settings.providers.length === 0) {
      throw new Error(
        'No AI providers configured. Please add a Google provider in Admin > Chatbot settings.'
      );
    }

    // Find the specified provider, or fall back to the first active Google provider
    let provider;
    if (providerId) {
      provider = settings.providers.find((p) => p.id === providerId && p.isActive);
    }
    if (!provider) {
      provider = settings.providers.find((p) => p.isActive && p.baseUrl?.includes('googleapis'));
    }
    if (!provider) {
      throw new Error(
        'No active Google provider found. Please configure one in Admin > Chatbot settings.'
      );
    }

    const apiKey = decrypt(provider.apiKey);
    if (!apiKey) {
      throw new Error(
        'Failed to decrypt Google provider API key. Please re-enter it in Admin > Chatbot settings.'
      );
    }

    const model = modelName || 'gemini-3.1-flash-image-preview';
    const genAI = new GoogleGenAI({ apiKey });

    // Ensure base64Images is an array
    const imagesArray = Array.isArray(base64Images) ? base64Images : [base64Images];

    console.log(
      `[Gemini] Editing image(s) with model: ${model}, count: ${imagesArray.length}, aspect ratio: ${aspectRatio}`
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
            text: editPrompt,
          },
        ],
      },
    ];

    const response = await genAI.models.generateContent({
      model,
      contents,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio,
        },
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0 || !candidates[0].content.parts[0].inlineData) {
      throw new Error('No image was generated in the response');
    }

    const inlineData = candidates[0].content.parts[0].inlineData;
    const buffer = Buffer.from(inlineData.data, 'base64');
    const mimeType = inlineData.mimeType;
    const extension = mimeType?.split('/')[1] || 'png';

    return { buffer, mimeType, extension };
  }
}

const imageService = new ImageService();
export default imageService;
