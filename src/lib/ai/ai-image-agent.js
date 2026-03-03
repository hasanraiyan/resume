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

  async getEmbeddingSettings() {
    await dbConnect();
    const agentSettings = await MediaAgentSettings.findOne({});
    const chatbotSettings = await ChatbotSettings.findOne({});

    if (!chatbotSettings || !chatbotSettings.providers) {
      throw new Error('No AI providers configured in Chatbot settings.');
    }

    const providerId = agentSettings?.embeddingProviderId || agentSettings?.providerId;
    const model =
      agentSettings?.embeddingModel ||
      (providerId?.includes('google') ? 'embedding-001' : 'text-embedding-3-small');

    const provider = chatbotSettings.providers.find((p) => p.id === providerId && p.isActive);

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

  async analyzeImage(base64Data, mimeType = 'image/jpeg') {
    const { apiKey, baseUrl, model, persona, isGoogle } = await this.getSettings();

    if (isGoogle) {
      return this.analyzeWithGoogle(apiKey, model, persona, base64Data, mimeType);
    } else {
      return this.analyzeWithOpenAI(apiKey, baseUrl, model, persona, base64Data, mimeType);
    }
  }

  async generateEmbedding(text) {
    const { apiKey, baseUrl, model, isGoogle } = await this.getEmbeddingSettings();

    if (isGoogle) {
      return this.embedWithGoogle(apiKey, model, text);
    } else {
      return this.embedWithOpenAI(apiKey, baseUrl, model, text);
    }
  }

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
    // The SDK returns an array of embeddings when using 'contents'
    return response.embeddings[0].values;
  }

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
