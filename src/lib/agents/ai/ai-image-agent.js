/**
 * AI Image Agent
 *
 * Handles image analysis and generation tasks using LangGraph.
 * Extends BaseAgent.
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { HumanMessage } from '@langchain/core/messages';

class AIImageAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.IMAGE_ANALYZER, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('AI Image Agent initialized');
  }

  async analyzeImage(base64Data, mimeType = 'image/jpeg') {
    const llm = await this.createChatModel();

    const persona =
      this.config.persona ||
      'You are a Professional Visual Content Analyst. Provide a highly detailed, comprehensive description of this image. For maximum semantic search (RAG) performance, include: 1. Core Subject: Exactly what is in the image. 2. Style: Is it a photo, anime, 3D render, oil painting, or sketch? 3. Composition: Foreground/background elements, lighting, and camera angle. 4. Color Palette: Dominant and accent colors. 5. Mood/Atmosphere: Vibrant, dark, futuristic, calm, etc. 6. Fine Details: Textures, materials, and any specific text or symbols visible. Aim for a rich narrative that captures the essence of the visual.';

    this.logger.info('Analyzing image using LangChain multimodal message');

    const message = new HumanMessage({
      content: [
        { type: 'text', text: persona },
        {
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${base64Data}` },
        },
      ],
    });

    const response = await llm.invoke([message]);
    return response.content.trim();
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
