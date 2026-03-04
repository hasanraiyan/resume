/**
 * Presentation Agent
 *
 * Implements a workflow for researching a topic using LangGraph's ReAct agent,
 * creating a presentation outline, and subsequently generating full visual slides
 * using Google GenAI images.
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import agentRegistry from '../AgentRegistry';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { getBackendMCPConfig } from '@/lib/mcpConfig';

class PresentationAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.PRESENTATION_SYNTHESIZER, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Presentation Agent Initialized');
  }

  /**
   * Generates a structured outline for a presentation using a ReAct agent.
   */
  async draftOutline(topic, extraInstructions = '', isAdmin = false) {
    if (!this.isInitialized) await this.initialize();

    this.logger.info(`Drafting outline for topic: ${topic}`);

    const llm = await this.createChatModel({ temperature: 0.2 });
    let tools = [];
    let mcpClient = null;

    try {
        const backendMCPs = await getBackendMCPConfig(isAdmin);
        const activeMCPs = this.config.activeMCPs || [];
        const defaultMCPConfigs = backendMCPs.filter((m) => m.isDefault);
        const selectedMCPConfigs = backendMCPs.filter((m) => activeMCPs.includes(m.id));
        const allActiveConfigs = [...new Set([...defaultMCPConfigs, ...selectedMCPConfigs])];

        const mcpServerConfig = {};
        for (const cfg of allActiveConfigs) {
          if (cfg && cfg.type !== 'rest' && cfg.url) {
            mcpServerConfig[cfg.id] = {
              transport: 'sse',
              url: cfg.url,
            };
          }
        }

        if (Object.keys(mcpServerConfig).length > 0) {
            mcpClient = new MultiServerMCPClient(mcpServerConfig);
            tools = await mcpClient.getTools();
        }
    } catch (e) {
        this.logger.error('Failed getting MCP Tools for Presentation Agent:', e);
    }

    const systemPrompt = `You are an elite Presentation Synthesizer. Your task is to research the following topic using your tools (if any are available), and create a comprehensive, logically structured presentation outline.

You must respond ONLY with the final output as a valid JSON array of objects, where each object represents a slide. Do NOT wrap the JSON in markdown blocks (e.g., \`\`\`json). Just the raw JSON.

Topic: ${topic}
Additional Instructions: ${extraInstructions}

Format each object as follows:
{
  "title": "Slide Title",
  "points": ["Bullet point 1", "Bullet point 2"],
  "visualPrompt": "A highly detailed image generation prompt describing exactly what the FULL visual slide should look like. Include text layout, background, main subjects, color palette, and style. Ensure it looks like a professional presentation slide."
}

Ensure the presentation has a clear narrative arc (e.g., Title Slide, Problem, Solution, Architecture, Conclusion).`;

    // Create the ReAct agent with tools
    const agent = createReactAgent({
        llm,
        tools,
    });

    try {
      // Run the LangGraph ReAct workflow
      const finalState = await agent.invoke({
          messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Please research and draft the presentation for: ${topic}` }
          ]
      });

      // The final message from the agent should be the JSON array
      const lastMessage = finalState.messages[finalState.messages.length - 1];
      let text = lastMessage.content;

      // Clean up potential markdown formatting just in case
      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);

      const outline = JSON.parse(text.trim());

      if (!Array.isArray(outline)) {
         throw new Error('LLM did not return an array.');
      }

      return outline;
    } catch (error) {
       this.logger.error('Failed to generate outline:', error);
       throw new Error('Failed to generate presentation outline. The agent may have struggled to output pure JSON after researching.');
    }
  }

  /**
   * Generates a single visual slide using the central Image Generator Agent.
   */
  async generateSlideImage(slide) {
    if (!this.isInitialized) await this.initialize();

    const fullPrompt = `Create a professional presentation slide as a single, complete image.

Slide Title to Display: ${slide.title}
Text/Bullet Points to Display:
${slide.points.map(p => '- ' + p).join('\n')}

Visual Design & Layout Instructions:
${slide.visualPrompt}

Make sure the text is extremely legible, sharp, and perfectly integrated into the design. Ensure high-fidelity production, professional-grade consistency, and a 16:9 aspect ratio.`;

    this.logger.info(`Generating slide using IMAGE_GENERATOR: ${slide.title}`);

    try {
      // Defer to the dedicated Image Generator Agent for synthesis
      const imageAgent = agentRegistry.get(AGENT_IDS.IMAGE_GENERATOR);
      const result = await imageAgent.execute({
          prompt: fullPrompt,
          aspectRatio: '16:9',
      });

      const base64Data = `data:${result.mimeType};base64,${result.buffer.toString('base64')}`;

      return {
        imageUrl: base64Data,
        prompt: fullPrompt,
        fallbackText: `Slide: ${slide.title}. ${slide.points.join(' ')}`,
      };
    } catch (error) {
       this.logger.error(`Failed to generate image for slide: ${slide.title}`, error);
       throw error;
    }
  }

  /**
   * Orchestrates the parallel generation of all slides based on an approved outline.
   */
  async generatePresentationVisuals(outline) {
    if (!this.isInitialized) await this.initialize();

    this.logger.info(`Starting parallel generation of ${outline.length} slides`);

    const slidePromises = outline.map(slide => this.generateSlideImage(slide));

    // Use allSettled to prevent one failure from bringing down the whole presentation
    const results = await Promise.allSettled(slidePromises);

    const finalSlides = [];
    results.forEach((result, index) => {
       if (result.status === 'fulfilled') {
          finalSlides.push(result.value);
       } else {
          this.logger.error(`Slide ${index} failed:`, result.reason);
          // Insert a fallback object indicating failure for this slide
          finalSlides.push({
             imageUrl: null,
             prompt: outline[index].visualPrompt,
             fallbackText: `[FAILED TO GENERATE] Slide: ${outline[index].title}`,
             error: result.reason.message
          });
       }
    });

    return finalSlides;
  }

  async _onExecute(input) {
    const { action, topic, instructions, outline, isAdmin } = input;

    if (action === 'draft_outline') {
       if (!topic) throw new Error('Topic is required to draft an outline.');
       return await this.draftOutline(topic, instructions, isAdmin);
    } else if (action === 'generate_visuals') {
       if (!outline || !Array.isArray(outline)) throw new Error('Valid outline is required to generate visuals.');
       return await this.generatePresentationVisuals(outline);
    }

    throw new Error(`Unknown action: ${action}`);
  }
}

export default PresentationAgent;
