/**
 * Image Generator Agent
 *
 * Generates images from text prompts using a LangGraph StateGraph workflow.
 * Uses Google's generative models with IMAGE response modality.
 * Extends BaseAgent.
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';

// Define the state schema for the image generation workflow
const ImageGenState = Annotation.Root({
  prompt: Annotation({ reducer: (_, b) => b, default: () => '' }),
  aspectRatio: Annotation({ reducer: (_, b) => b, default: () => '1:1' }),
  modelOverride: Annotation({ reducer: (_, b) => b, default: () => null }),
  buffer: Annotation({ reducer: (_, b) => b, default: () => null }),
  mimeType: Annotation({ reducer: (_, b) => b, default: () => null }),
  extension: Annotation({ reducer: (_, b) => b, default: () => null }),
  error: Annotation({ reducer: (_, b) => b, default: () => null }),
});

class ImageGeneratorAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.IMAGE_GENERATOR, config = {}) {
    super(agentId, config);
    this._graph = null;
  }

  async _onInitialize() {
    this.logger.info('Image Generator Initialized (LangGraph)');
  }

  _buildGraph() {
    const self = this;

    const generateNode = async (state) => {
      const { client, modelName } = await self.createGoogleGenAI({
        model: state.modelOverride || undefined,
      });

      self.logger.info(`Generating with model: ${modelName}, aspect ratio: ${state.aspectRatio}`);

      const result = await client.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: state.prompt.trim() }] }],
        config: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            aspectRatio: state.aspectRatio,
          },
        },
      });

      const candidates = result.candidates;

      if (
        !candidates ||
        candidates.length === 0 ||
        !candidates[0].content ||
        !candidates[0].content.parts ||
        candidates[0].content.parts.length === 0
      ) {
        return {
          error:
            "No image was generated. The response may have been blocked or the model didn't return an image.",
        };
      }

      const part = candidates[0].content.parts[0];
      if (!part.inlineData) {
        return { error: 'No image data found in the response part.' };
      }

      const inlineData = part.inlineData;
      return {
        buffer: Buffer.from(inlineData.data, 'base64'),
        mimeType: inlineData.mimeType,
        extension: inlineData.mimeType?.split('/')[1] || 'png',
      };
    };

    const graph = new StateGraph(ImageGenState)
      .addNode('generate', generateNode)
      .addEdge(START, 'generate')
      .addEdge('generate', END);

    return graph.compile();
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
    const { prompt, aspectRatio = '1:1', model: inputModel } = input;

    if (!this._graph) {
      this._graph = this._buildGraph();
    }

    const result = await this._graph.invoke({
      prompt,
      aspectRatio,
      modelOverride: inputModel || null,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      buffer: result.buffer,
      mimeType: result.mimeType,
      extension: result.extension,
    };
  }
}

export default ImageGeneratorAgent;
