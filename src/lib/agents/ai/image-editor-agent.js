/**
 * Image Editor Agent
 *
 * Edits existing images from descriptions using a LangGraph StateGraph workflow.
 * Uses Google's generative models with IMAGE response modality.
 * Extends BaseAgent.
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';

// Define the state schema for the image editing workflow
const ImageEditState = Annotation.Root({
  base64Images: Annotation({ reducer: (_, b) => b, default: () => [] }),
  editPrompt: Annotation({ reducer: (_, b) => b, default: () => '' }),
  aspectRatio: Annotation({ reducer: (_, b) => b, default: () => '1:1' }),
  modelOverride: Annotation({ reducer: (_, b) => b, default: () => null }),
  buffer: Annotation({ reducer: (_, b) => b, default: () => null }),
  mimeType: Annotation({ reducer: (_, b) => b, default: () => null }),
  extension: Annotation({ reducer: (_, b) => b, default: () => null }),
  error: Annotation({ reducer: (_, b) => b, default: () => null }),
});

class ImageEditorAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.IMAGE_EDITOR, config = {}) {
    super(agentId, config);
    this._graph = null;
  }

  async _onInitialize() {
    this.logger.info('Image Editor Initialized (LangGraph)');
  }

  _buildGraph() {
    const self = this;

    const editNode = async (state) => {
      const { client, modelName } = await self.createGoogleGenAI({
        model: state.modelOverride || undefined,
      });

      // Ensure base64Images is an array
      const imagesArray = Array.isArray(state.base64Images)
        ? state.base64Images
        : [state.base64Images];

      self.logger.info(
        `Editing image(s) with model: ${modelName}, count: ${imagesArray.length}, aspect ratio: ${state.aspectRatio}`
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
              text: state.editPrompt.trim(),
            },
          ],
        },
      ];

      const result = await client.models.generateContent({
        model: modelName,
        contents,
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

    const graph = new StateGraph(ImageEditState)
      .addNode('edit', editNode)
      .addEdge(START, 'edit')
      .addEdge('edit', END);

    return graph.compile();
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
    const { base64Images, editPrompt, aspectRatio = '1:1', model: inputModel } = input;

    if (!this._graph) {
      this._graph = this._buildGraph();
    }

    const result = await this._graph.invoke({
      base64Images,
      editPrompt,
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

export default ImageEditorAgent;
