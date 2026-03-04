/**
 * Presentation Agent
 *
 * Implements a workflow for researching a topic using LangGraph's ReAct agent,
 * creating a presentation outline, and subsequently generating full visual slides
 * using Google GenAI images.
 *
 * Method 1: LLM-Generated Dynamic Theme (Refined for Consistency, Light Mode, & Rich Visuals)
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

    const systemPrompt = `You are an elite Presentation Designer and Visual Director. Research the topic, then create a COMPLETE presentation by generating highly detailed visual prompts for each slide.

Respond ONLY with raw JSON. No markdown wrapping.

Topic: ${topic}
Additional Instructions: ${extraInstructions}

━━━ DESIGN GUARDRAILS ━━━
1. USE NATURAL LANGUAGE COLORS: Do NOT use any hex codes (e.g., avoid #FFFFFF). Instead, use natural language color descriptions like "pure white", "dark charcoal", "medium gray", "deep blue", "indigo", and "sky blue". Unless instructed otherwise, default to a light mode palette with these natural language colors.
2. DIAGRAMS ARE MANDATORY: Every content slide MUST feature a rich visual — process flowcharts, isometric 3D infographics, comparison tables, radial diagrams, timelines, data charts, layered architecture diagrams, or icon grids. Plain text-only slides are FORBIDDEN.
3. STRICT CONSISTENCY: Same background, same fonts, same color palette on EVERY slide. Only content and layout composition change. Think Google Slides master template.
4. TEXT EMBEDDED IN VISUAL: The image generator can draw text, so you MUST include the exact text you want to appear on the slide (title, bullet points, labels) directly inside your visual prompt. Describe exactly where and how this text should be written.

━━━ JSON FORMAT ━━━
{
  "slides": [
    {
      "visualPrompt": "A single, highly detailed paragraph describing the complete visual layout, colors (in natural language only), diagrams, 3D elements, and the EXACT TEXT (title, points, annotations) to be drawn on this 16:9 slide."
    }
  ]
}

━━━ HERO VISUAL EXAMPLES (for inspiration — don't copy, adapt to the topic) ━━━
- Title Slide: Large 3D glossy emblem of the topic floating center, with the exact title text written in bold above and a subtle tagline below. Clean, dramatic, minimal.
- Process Slide: A 5-step horizontal pipeline diagram with numbered circular nodes connected by gradient arrows, each node containing an icon and a specific text label.
- Architecture Slide: Layered isometric 3D blocks showing system components stacked and connected with data flow lines and exact text annotations.

Generate 6-8 slides with a clear arc: Title → Context → Deep Dives (with diagrams) → Key Insights → Conclusion/CTA.`;

    const agent = createReactAgent({ llm, tools });

    try {
      const finalState = await agent.invoke({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please research and draft the presentation for: ${topic}` },
        ],
      });

      const lastMessage = finalState.messages[finalState.messages.length - 1];
      let text = lastMessage.content;

      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);

      const outlineData = JSON.parse(text.trim());

      if (!outlineData.slides || !Array.isArray(outlineData.slides)) {
        throw new Error('LLM did not return a valid slides array.');
      }

      return outlineData;
    } catch (error) {
      this.logger.error('Failed to generate outline:', error);
      throw new Error(
        'Failed to generate presentation outline. The agent may have struggled to output pure JSON after researching.'
      );
    }
  }

  /**
   * Generates a single visual slide using the central Image Generator Agent.
   */
  async generateSlideImage(slide) {
    if (!this.isInitialized) await this.initialize();

    const fullPrompt = `Generate a single, production-ready presentation slide as a flat 16:9 image.

SLIDE VISUAL PROMPT:
${slide.visualPrompt}

Rules: razor-sharp legible text, rich detailed visuals, consistent with the design system described. No borders, no UI chrome, no slide frames. Single flat image only.`;

    this.logger.info(`Generating slide using IMAGE_GENERATOR from visual prompt...`);

    try {
      const imageAgent = agentRegistry.get(AGENT_IDS.IMAGE_GENERATOR);
      const result = await imageAgent.execute({
        prompt: fullPrompt,
        aspectRatio: '16:9',
      });

      const base64Data = `data:${result.mimeType};base64,${result.buffer.toString('base64')}`;

      return {
        imageUrl: base64Data,
        prompt: fullPrompt,
        fallbackText: `Visual Prompt: ${slide.visualPrompt.substring(0, 50)}...`,
        visualPrompt: slide.visualPrompt,
      };
    } catch (error) {
      this.logger.error(`Failed to generate image for slide`, error);
      throw error;
    }
  }

  /**
   * Orchestrates the parallel generation of all slides based on an approved outline.
   */
  async generatePresentationVisuals(outlineData) {
    if (!this.isInitialized) await this.initialize();

    const { slides } = outlineData;

    this.logger.info(`Starting parallel generation of ${slides.length} slides.`);

    const slidePromises = slides.map((slide) => this.generateSlideImage(slide));

    const results = await Promise.allSettled(slidePromises);

    const finalSlides = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        finalSlides.push(result.value);
      } else {
        this.logger.error(`Slide ${index} failed:`, result.reason);
        finalSlides.push({
          imageUrl: null,
          prompt: slides[index].visualPrompt,
          fallbackText: `[FAILED TO GENERATE] Slide prompt: ${slides[index].visualPrompt.substring(0, 50)}...`,
          error: result.reason.message,
        });
      }
    });

    return finalSlides;
  }

  async _onExecute(input) {
    const { action, topic, instructions, outlineData, isAdmin } = input;

    if (action === 'draft_outline') {
      if (!topic) throw new Error('Topic is required to draft an outline.');
      return await this.draftOutline(topic, instructions, isAdmin);
    } else if (action === 'generate_visuals') {
      if (!outlineData || !outlineData.slides || !Array.isArray(outlineData.slides)) {
        throw new Error('Valid outline data with slides is required to generate visuals.');
      }
      return await this.generatePresentationVisuals(outlineData);
    }

    throw new Error(`Unknown action: ${action}`);
  }
}

export default PresentationAgent;
