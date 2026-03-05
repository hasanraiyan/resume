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

  async draftOutline(topic, extraInstructions = '', isAdmin = false) {
    if (!this.isInitialized) await this.initialize();
    this.logger.info(`Drafting outline for topic: ${topic}`);

    const llm = await this.createChatModel({ temperature: 0.3 });
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
          mcpServerConfig[cfg.id] = { transport: 'sse', url: cfg.url };
        }
      }

      if (Object.keys(mcpServerConfig).length > 0) {
        mcpClient = new MultiServerMCPClient(mcpServerConfig);
        tools = await mcpClient.getTools();
      }
    } catch (e) {
      this.logger.error('MCP init error:', e);
    }

    const systemPrompt = `You are a world-class presentation designer who has worked at Apple, Stripe, and IDEO. You design slides that win design awards.

Research the topic, then generate a JSON presentation where each slide has one "visualPrompt" — a rich, cinematic description of what the FULL slide looks like as a rendered image.

Topic: ${topic}
Additional Instructions: ${extraInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DESIGN DNA — EVERY SLIDE MUST FOLLOW THIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VISUAL FOUNDATION:
- Every prompt MUST begin with: "A ultra-premium 16:9 presentation slide, rendered in stunning 4K quality, inspired by Apple Keynote 2024 and Stripe's investor deck aesthetic."
- Background: Deep rich gradients (NOT flat solid colors). Use multi-stop gradients like "a background transitioning from deep midnight navy at the top-left to rich dark indigo at the bottom-right with a subtle warm purple glow in the center".
- Add DEPTH LAYERS: frosted glass panels, soft glowing orbs, bokeh light particles, subtle grid lines, mesh gradients, aurora-like color bleeds behind content areas.

TYPOGRAPHY RULES:
- Title text: Large, bold, modern sans-serif font (like SF Pro Display or Inter Black). Crisp white or bright accent color.
- Body text: Clean, lightweight sans-serif. Soft white or light gray with generous line spacing.
- Every text element must be EXPLICITLY described with exact wording, size relationship (large/medium/small), position (top-left, center, etc.), and color.

VISUAL RICHNESS — NO PLAIN SLIDES:
- Every content slide MUST include at least ONE of these premium visual elements:
  • Glassmorphism cards: Semi-transparent frosted glass rectangles with soft white borders and subtle backdrop blur containing the text content
  • 3D floating objects: Glossy, reflective 3D icons or shapes with realistic shadows and ambient occlusion
  • Glowing data visualizations: Neon-outlined charts, radial progress rings with glow effects, gradient-filled bar charts
  • Isometric illustrations: Clean 3D isometric diagrams with soft shadows on a dark background
  • Icon grids: Beautiful minimal line icons arranged in a grid, each inside a soft-glowing rounded square
  • Flowing abstract art: Silk-like flowing gradients, DNA-helix shapes, orbital rings, particle systems as background accents
- NEVER just text on a background. That is FORBIDDEN.

LAYOUT COMPOSITION:
- Use asymmetric layouts: content on left 55%, rich visual on right 45% — or vice versa.
- Title slides: centered dramatic composition with a hero 3D visual element.
- Use generous whitespace and padding. Nothing should feel cramped.
- Content should feel like it's floating on layered glass cards above the background.

CONSISTENCY RULES:
- SAME gradient background direction and color palette on every slide.
- SAME font style throughout.
- SAME accent color for highlights, icons, and decorative elements.
- Only the CONTENT and VISUAL ELEMENTS change between slides — the overall design system stays locked.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  JSON FORMAT (respond with ONLY this, no markdown)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "designSystem": {
    "backgroundGradient": "describe the exact multi-stop gradient used on ALL slides",
    "accentColor": "the single bright accent color used for highlights across all slides",
    "fontStyle": "the font family and weight pattern"
  },
  "slides": [
    {
      "visualPrompt": "A single dense paragraph (150-200 words) describing EVERYTHING visible on this slide: the background gradient, every text element with exact wording and position, all visual elements with materials/lighting/shadows, layout composition, decorative accents. This paragraph alone must be enough to perfectly recreate this slide as a photorealistic render."
    }
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EXAMPLE VISUAL PROMPTS (study the density and specificity)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TITLE SLIDE EXAMPLE:
"A ultra-premium 16:9 presentation slide, rendered in stunning 4K quality, inspired by Apple Keynote 2024 aesthetic. The background is a rich multi-stop gradient flowing from deep midnight navy in the top-left corner through dark royal indigo in the center to a subtle deep plum in the bottom-right, with a soft ethereal blue-purple glow emanating from the center. In the upper center of the slide, the title 'THE FUTURE OF AI' is rendered in a large bold modern sans-serif font (similar to SF Pro Display Heavy) in crisp pure white, with wide letter-spacing for a premium feel. Below it, the subtitle 'Transforming Industries Through Intelligence' appears in a lighter weight of the same font in soft silver-gray. Centered below the text, a stunning 3D glossy translucent brain sculpture floats with internal glowing neural network pathways in electric cyan and soft purple, casting a subtle colored light reflection downward. The brain has a glass-like refractive material with soft caustic light patterns. Small floating holographic data particles orbit around it. The overall composition is clean, centered, and dramatic with generous negative space."

CONTENT SLIDE EXAMPLE:
"A ultra-premium 16:9 presentation slide, rendered in stunning 4K quality, inspired by Stripe's deck design. Same deep midnight navy to dark indigo gradient background. On the left 55% of the slide: the title 'Market Opportunity' is positioned at the top-left in bold white sans-serif text. Below it, three key points are displayed inside stacked horizontal glassmorphism cards — semi-transparent frosted glass rectangles with 1px soft white borders and rounded corners. Each card contains a glowing cyan dot bullet followed by text in light gray: '1. Global TAM reaches $4.2T by 2028', '2. 67% of enterprises actively adopting', '3. Cost reduction averaging 40% in Year 1'. The cards have subtle backdrop blur and a faint inner glow. On the right 45%, a large 3D isometric bar chart floats with four gradient-filled bars (cyan to purple gradient) of different heights, sitting on a thin translucent glass platform. Each bar has a soft glow at its base and a small floating label above it. Tiny glowing particles drift upward from the tallest bar. Subtle grid lines in very faint white (5% opacity) add depth to the background."

Generate 7-9 slides: Title → Problem/Context → 3-4 Deep Content Slides with rich visuals → Key Insight/Data → Closing/CTA.
Each visualPrompt must be 150-200 words. Short prompts produce garbage — be DENSE and SPECIFIC.`;

    const agent = createReactAgent({ llm, tools });

    try {
      const finalState = await agent.invoke({
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Research and create the presentation for: ${topic}`,
          },
        ],
      });

      const lastMessage = finalState.messages[finalState.messages.length - 1];
      let text = lastMessage.content;
      text = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '');

      const outlineData = JSON.parse(text.trim());

      if (!outlineData.slides || !Array.isArray(outlineData.slides)) {
        throw new Error('LLM did not return a valid slides array.');
      }

      return outlineData;
    } catch (error) {
      this.logger.error('Failed to generate outline:', error);
      throw new Error('Failed to generate presentation outline.');
    }
  }

  async generateSlideImage(slide, designSystem) {
    if (!this.isInitialized) await this.initialize();

    // THIS is the critical wrapper — it injects quality anchors
    // around every prompt so the image model knows the standard
    const qualityPrefix = `Photorealistic digital render of a presentation slide. Ultra high-end corporate keynote design. 4K resolution, crisp sharp rendering, perfect anti-aliased text, studio-quality lighting and shadows. NOT a photograph — this is a beautifully designed SLIDE graphic.`;

    const consistencyAnchor = designSystem
      ? `Design system: ${designSystem.backgroundGradient}. Accent color: ${designSystem.accentColor}. Font: ${designSystem.fontStyle}.`
      : '';

    const qualitySuffix = `The overall quality matches slides from Apple WWDC 2024 keynote or a $50,000 McKinsey consulting deck. Every element is pixel-perfect, modern, and sophisticated. Rich depth with layered glass effects, subtle glows, and volumetric lighting. No clipart, no stock photo aesthetic, no flat basic shapes. Premium, polished, award-winning design.`;

    const fullPrompt = `${qualityPrefix}

${consistencyAnchor}

${slide.visualPrompt}

${qualitySuffix}`;

    this.logger.info('Generating premium slide image...');

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
        visualPrompt: slide.visualPrompt,
      };
    } catch (error) {
      this.logger.error('Slide generation failed:', error);
      throw error;
    }
  }

  async generatePresentationVisuals(outlineData) {
    if (!this.isInitialized) await this.initialize();

    const { slides, designSystem } = outlineData;

    this.logger.info(`Generating ${slides.length} premium slides in parallel...`);

    const results = await Promise.allSettled(
      slides.map((slide) => this.generateSlideImage(slide, designSystem))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      this.logger.error(`Slide ${index} failed:`, result.reason);
      return {
        imageUrl: null,
        visualPrompt: slides[index].visualPrompt,
        error: result.reason.message,
      };
    });
  }

  async _onExecute(input) {
    const { action, topic, instructions, outlineData, isAdmin } = input;

    if (action === 'draft_outline') {
      if (!topic) throw new Error('Topic is required.');
      return await this.draftOutline(topic, instructions, isAdmin);
    }

    if (action === 'generate_visuals') {
      if (!outlineData?.slides?.length) {
        throw new Error('Valid outline with slides required.');
      }
      return await this.generatePresentationVisuals(outlineData);
    }

    throw new Error(`Unknown action: ${action}`);
  }
}

export default PresentationAgent;
