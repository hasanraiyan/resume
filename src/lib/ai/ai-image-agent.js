import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import dbConnect from '@/lib/dbConnect';
import ChatbotSettings from '@/models/ChatbotSettings';
import MediaAgentSettings from '@/models/MediaAgentSettings';
import { decrypt } from '@/lib/crypto';

class AIImageAgent {
  async getSettings() {
    await dbConnect();
    const agentSettings = await MediaAgentSettings.findOne({});
    const chatbotSettings = await ChatbotSettings.findOne({});

    if (!chatbotSettings || !chatbotSettings.providers) {
      throw new Error('No AI providers configured in Chatbot settings.');
    }

    const providerId = agentSettings?.providerId;
    const model = agentSettings?.model;
    const persona = agentSettings?.persona;

    const provider = chatbotSettings.providers.find((p) => p.id === providerId && p.isActive);

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

  async analyzeImage(base64Data, mimeType = 'image/jpeg') {
    const { apiKey, baseUrl, model, persona, isGoogle } = await this.getSettings();

    if (isGoogle) {
      return this.analyzeWithGoogle(apiKey, model, persona, base64Data, mimeType);
    } else {
      return this.analyzeWithOpenAI(apiKey, baseUrl, model, persona, base64Data, mimeType);
    }
  }

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
}

export const aiImageAgent = new AIImageAgent();
