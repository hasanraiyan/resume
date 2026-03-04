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

    const systemPrompt = `You are an elite Presentation Designer and Visual Director. Research the topic, then create a COMPLETE presentation with full visual slide design briefs.

Respond ONLY with raw JSON. No markdown wrapping.

Topic: ${topic}
Additional Instructions: ${extraInstructions}

━━━ DESIGN GUARDRAILS ━━━
1. LIGHT MODE DEFAULT: Unless Additional Instructions explicitly request dark/colored themes, use: pure white (#FFFFFF) background, dark charcoal (#1A1A2E) headings, medium gray (#4A4A5A) body text, deep blue (#2563EB) as primary accent, indigo (#4F46E5) secondary, sky blue (#38BDF8) tertiary.
2. DIAGRAMS ARE MANDATORY: Every content slide MUST feature a rich visual — process flowcharts, isometric 3D infographics, comparison tables, radial diagrams, timelines, data charts, layered architecture diagrams, or icon grids. Plain text-only slides are FORBIDDEN.
3. STRICT CONSISTENCY: Same background, same fonts, same color palette on EVERY slide. Only content and layout composition change. Think Google Slides master template.
4. LAYOUT VARIETY: Mix different compositions across slides — 60/40 splits, centered hero visuals, full-width infographics, multi-column grids, timeline strips — but ALWAYS within the same design system.

━━━ JSON FORMAT ━━━
{
  "presentationTheme": "The master design system string. Must specify: background color, font family & weights, primary/secondary/accent hex colors, and visual style. If user didn't request a specific style, default to the light mode palette from Guardrail #1.",
  "slides": [
    {
      "title": "Slide Title",
      "points": ["Key point 1", "Key point 2"],
      "slideDesignBrief": "Complete art direction for this slide as a 16:9 image. Structure: BACKGROUND (restate from theme), TITLE (position, weight, color, size), BODY (text layout), HERO VISUAL (the diagram/infographic/3D scene — describe in EXTREME detail: every shape, color, label, arrow, icon, proportion, and spatial position), ACCENTS (decorative elements), COMPOSITION (spatial layout type). Must be so detailed the image AI can render it pixel-perfect without guessing."
    }
  ]
}

━━━ HERO VISUAL EXAMPLES (for inspiration — don't copy, adapt to the topic) ━━━
- Title Slide: Large 3D glossy emblem of the topic floating center, with the title in bold above and a subtle tagline below. Clean, dramatic, minimal.
- Process Slide: A 5-step horizontal pipeline diagram with numbered circular nodes connected by gradient arrows, each node containing an icon and label.
- Architecture Slide: Layered isometric 3D blocks showing system components stacked and connected with data flow lines.
- Comparison Slide: Side-by-side columns with icon headers, checkmarks/crosses, and a gradient divider line.
- Data Slide: Large donut chart or bar chart with annotated callouts, percentage labels, and a legend strip.
- Timeline Slide: Horizontal or vertical timeline with milestone markers, year labels, and small icon illustrations at each node.

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
  async generateSlideImage(slide, presentationTheme) {
    if (!this.isInitialized) await this.initialize();

    const fullPrompt = `Generate a single, production-ready presentation slide as a flat 16:9 image.

DESIGN SYSTEM (enforce exactly):
${presentationTheme}

SLIDE BRIEF:
${slide.slideDesignBrief}

TEXT CONTENT:
Title: ${slide.title}
${slide.points.map((p) => '• ' + p).join('\n')}

Rules: razor-sharp legible text, rich detailed visuals, consistent with the design system. No borders, no UI chrome, no slide frames. Single flat image only.`;

    this.logger.info(`Generating slide using IMAGE_GENERATOR: ${slide.title}`);

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
        fallbackText: `Slide: ${slide.title}. ${slide.points.join('. ')}`,
        slideDesignBrief: slide.slideDesignBrief,
      };
    } catch (error) {
      this.logger.error(`Failed to generate image for slide: ${slide.title}`, error);
      throw error;
    }
  }

  /**
   * Orchestrates the parallel generation of all slides based on an approved outline.
   */
  async generatePresentationVisuals(outlineData) {
    if (!this.isInitialized) await this.initialize();

    const { presentationTheme, slides } = outlineData;

    this.logger.info(`Starting parallel generation of ${slides.length} slides with dynamic theme.`);

    const slidePromises = slides.map((slide) => this.generateSlideImage(slide, presentationTheme));

    const results = await Promise.allSettled(slidePromises);

    const finalSlides = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        finalSlides.push(result.value);
      } else {
        this.logger.error(`Slide ${index} failed:`, result.reason);
        finalSlides.push({
          imageUrl: null,
          prompt: slides[index].slideDesignBrief,
          fallbackText: `[FAILED TO GENERATE] Slide: ${slides[index].title}`,
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
