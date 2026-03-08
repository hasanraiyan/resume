import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import agentRegistry from '../AgentRegistry';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { getBackendMCPConfig } from '@/lib/mcpConfig';

const DESIGN_THEMES = {
  PREMIUM_BLUE: {
    id: 'premium_blue',
    name: 'Premium Blue',
    gradient:
      'deep midnight navy at the top-left to rich dark indigo at the bottom-right with a subtle warm purple glow in the center',
    accent: '#00D4FF',
    font: 'SF Pro Display or Inter Black',
    elements: 'Frosted glass panels, soft glowing orbs, bokeh light particles',
    exampleTitle:
      "A ultra-premium 16:9 presentation slide... The background is a rich multi-stop gradient flowing from deep midnight navy... In the upper center, the title 'THE FUTURE OF AI' is rendered in large bold white sans-serif...",
    exampleContent:
      'A ultra-premium 16:9 presentation slide... Same deep midnight navy to dark indigo gradient background. On the left: stacked horizontal glassmorphism cards...',
  },
  CYBERPUNK: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    gradient:
      'deep dark charcoal to vivid midnight violet, with aggressive neon cyan and hot pink light leaks from the edges',
    accent: '#FF00FF',
    font: 'JetBrains Mono or Space Grotesk Bold',
    elements:
      '3D retro-futuristic grids, glitch lines, holographic overlays, digital chromatic aberration',
    exampleTitle:
      "A futuristic 16:9 cyberpunk slide. Background is deep charcoal with neon violet glow. Title 'NEO-TECH' in glowing hot pink monospace font. A floating 3D holographic city model in cyan glows in the center.",
    exampleContent:
      'A cyberpunk slide. Background dark with cyan grid lines. Three data panels float like HUD elements with glitching green edges. 3D glowing fiber-optic cables snake across the right side.',
  },
  STUDIO_WHITE: {
    id: 'studio_white',
    name: 'Studio White',
    gradient:
      'soft off-white through misty silver to a clean pearl gray, perfectly diffused studio lighting',
    accent: '#000000',
    font: 'Inter or Helvetica Now Light',
    elements:
      'Ultra-thin 1px minimalist lines, vast whitespace, extremely soft drop shadows, high-key lighting',
    exampleTitle:
      "A minimalist studio-white slide. Background is a soft pearl gray gradient. Title 'PURE DESIGN' in large black lightweight sans-serif. A single high-end metallic 3D sphere sits elegantly in the bottom right.",
    exampleContent:
      'A clean white slide. Content arranged in a perfect grid with large margins. Subtle gray lines separate sections. Text is crisp black. A professional macro photo of architectural concrete on the right side.',
  },
  LUXURY_GOLD: {
    id: 'luxury_gold',
    name: 'Luxury Gold',
    gradient:
      'matte obsidian black to deep velvet espresso, with a rich metallic gold radiance in the focal point',
    accent: '#D4AF37',
    font: 'Playfair Display or Bodoni Serif',
    elements:
      'Brushed gold textures, marble surface reflections, thin gold wireframes, sophisticated bokeh',
    exampleTitle:
      "A luxury presentation slide. Background is matte obsidian black. Title 'EXCELLENCE' in elegant gold serif font. A 3D gold-leaf laurel or geometric sculpture with realistic metallic reflections floats in the center.",
    exampleContent:
      'A luxury slide. Dark velvet background. Two side-by-side white marble cards with gold bezels containing text. A blurred background of a high-end interior adds depth.',
  },
  SWISS_MODERN: {
    id: 'swiss_modern',
    name: 'Swiss Modern',
    gradient:
      'high-contrast solid vibrant electric red to bold signal orange (or other primary color pairings)',
    accent: '#FFFFFF',
    font: 'Akzidenz-Grotesk or Helvetica Bold',
    elements:
      'Strict asymmetric grid, oversized typography as a graphic element, thick solid borders, no shadows',
    exampleTitle:
      "A bold Swiss Modern slide. Background is solid electric red. Title 'FORM & FUNCTION' in massive white bold sans-serif, partially cropped at the edge. A black geometric circle overlaps a white square.",
    exampleContent:
      'A Swiss slide. Left half is black, right half is white. Text in opposite colors. Strong vertical and horizontal grid lines. A simple high-contrast icon placed exactly on a grid intersection.',
  },
  ORGANIC: {
    id: 'organic',
    name: 'Organic',
    gradient: 'soft sage green through misty forest moss to a warm sun-drenched linen texture',
    accent: '#4B5D50',
    font: 'Cormorant Garamond or Montserrat Light',
    elements:
      'Soft botanical shadows, hand-drawn organic shapes, artisanal paper textures, floating leaf silhouettes',
    exampleTitle:
      "An organic presentation slide. Background is a soft sage green linen texture. Title 'SUSTAINABILITY' in elegant serif typography. A delicate floating 3D leaf silhouette cast a soft shadow on the background.",
    exampleContent:
      'An organic slide. Background of misty forest moss. Text is arranged in a gentle, non-geometric flow. Small botanical illustrations decorate the corners. A soft sun-flare effect comes from the top left.',
  },
};

class PresentationAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.PRESENTATION_SYNTHESIZER, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Presentation Agent Initialized');
  }

  async draftOutline(
    topic,
    extraInstructions = '',
    isAdmin = false,
    slideCount = 7,
    designStyle = 'premium_blue'
  ) {
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
          mcpServerConfig[cfg.id] = {
            transport: cfg.type === 'http' ? 'http' : 'sse',
            headers: cfg.type === 'http' ? cfg.headers || {} : undefined,
            url: cfg.url
          };
        }
      }

      if (Object.keys(mcpServerConfig).length > 0) {
        mcpClient = new MultiServerMCPClient(mcpServerConfig);
        tools = await mcpClient.getTools();
      }
    } catch (e) {
      this.logger.error('MCP init error:', e);
    }

    const theme = DESIGN_THEMES[designStyle?.toUpperCase()] || DESIGN_THEMES.PREMIUM_BLUE;

    const systemPrompt = `You are a world-class presentation designer who has worked at Apple, Stripe, and IDEO. You design slides that win design awards.

Research the topic, then generate a JSON presentation where each slide has one "visualPrompt" — a rich, cinematic description of what the FULL slide looks like as a rendered image.

Topic: ${topic}
Design Style: ${theme.name}
Additional Instructions: ${extraInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DESIGN DNA — EVERY SLIDE MUST FOLLOW THIS (${theme.name} Theme)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VISUAL FOUNDATION:
- Every prompt MUST begin with: "A ultra-premium 16:9 presentation slide, rendered in stunning 4K quality, inspired by ${theme.name} aesthetic."
- Background: ${theme.gradient}.
- Add DEPTH LAYERS: ${theme.elements}.

TYPOGRAPHY RULES:
- Fonts to use: ${theme.font}.
- Use crisp ${theme.accent} or white as the primary text colors.
- Every text element must be EXPLICITLY described with exact wording, size relationship, position, and color.

VISUAL RICHNESS — NO PLAIN SLIDES:
- Use consistent motifs from the ${theme.name} style.
- NEVER just text on a background. That is FORBIDDEN.

LAYOUT COMPOSITION:
- Use asymmetric layouts, generous whitespace, and modern padding.

CONSISTENCY RULES:
- SAME gradient, SAME font style, and SAME accent color (${theme.accent}) on every slide.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  JSON FORMAT (respond with ONLY this, no markdown)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "designSystem": {
    "backgroundGradient": "${theme.gradient}",
    "accentColor": "${theme.accent}",
    "fontStyle": "${theme.font}",
    "themeId": "${theme.id}"
  },
  "slides": [
    {
      "visualPrompt": "A single dense paragraph (150-200 words) describing EVERYTHING visible on this slide."
    }
  ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EXAMPLE VISUAL PROMPTS FOR THIS STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TITLE SLIDE EXAMPLE:
"${theme.exampleTitle}"

CONTENT SLIDE EXAMPLE:
"${theme.exampleContent}"

Generate exactly ${slideCount} slides with a clear arc: Title → Context → Deep Dives → Key Insights → Conclusion.`;

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

  async draftContinuationSlide({
    topic,
    slideBrief,
    existingSlides = [],
    insertionIndex = 0,
    designSystem,
  }) {
    if (!this.isInitialized) await this.initialize();

    this.logger.info(`Drafting continuation slide for topic: ${topic}`);

    const llm = await this.createChatModel({ temperature: 0.4 });
    const surroundingSlides = existingSlides
      .map((slide, index) => {
        const title = slide?.title || slide?.fallbackText || `Slide ${index + 1}`;
        const visualPrompt = slide?.visualPrompt || 'No visual prompt provided.';
        return `${index + 1}. ${title}\nVisual intent: ${visualPrompt}`;
      })
      .join('\n\n');

    const systemPrompt = `You are extending an existing premium presentation deck with one new slide.

Return ONLY valid JSON with this exact shape:
{
  "title": "short slide title",
  "visualPrompt": "150-200 word dense visual prompt"
}

Requirements:
- The new slide will be inserted at position ${insertionIndex + 1} in the deck.
- The slide MUST feel like a natural continuation of the existing deck narrative and avoid duplicating earlier slides.
- The slide MUST preserve the locked design system.
- The visualPrompt must describe exact visible text, layout, hierarchy, and visual elements in one dense paragraph.
- Keep the same background gradient direction, accent color, and font treatment.

Topic: ${topic}
Requested slide brief: ${slideBrief}
Locked design system:
- Background gradient: ${designSystem?.backgroundGradient || 'Use the existing deck gradient'}
- Accent color: ${designSystem?.accentColor || 'Use the existing deck accent color'}
- Font style: ${designSystem?.fontStyle || 'Use the existing deck font style'}

Existing slides:
${surroundingSlides || 'No previous slides were provided.'}`;

    try {
      const response = await llm.invoke([
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Create the next presentation slide for this brief: ${slideBrief}`,
        },
      ]);

      let text = Array.isArray(response.content)
        ? response.content
            .map((part) => (typeof part === 'string' ? part : part?.text || ''))
            .join('')
        : response.content;

      text = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '');

      const slideData = JSON.parse(text.trim());

      if (!slideData.visualPrompt || typeof slideData.visualPrompt !== 'string') {
        throw new Error('LLM did not return a valid continuation slide prompt.');
      }

      const fallbackTitle = slideBrief.trim().split(/[.!?]/)[0].trim() || 'New Slide';

      return {
        title: slideData.title?.trim() || fallbackTitle.slice(0, 80),
        fallbackText: slideData.title?.trim() || fallbackTitle.slice(0, 80),
        visualPrompt: slideData.visualPrompt.trim(),
      };
    } catch (error) {
      this.logger.error('Failed to generate continuation slide:', error);
      throw new Error('Failed to generate continuation slide.');
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
        title: slide.title || slide.fallbackText || 'Slide',
        fallbackText: slide.fallbackText || slide.title || 'Slide',
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
        title: slides[index].title || slides[index].fallbackText || `Slide ${index + 1}`,
        fallbackText: slides[index].fallbackText || slides[index].title || `Slide ${index + 1}`,
        imageUrl: null,
        visualPrompt: slides[index].visualPrompt,
        prompt: slides[index].visualPrompt,
        error: result.reason.message,
      };
    });
  }

  async _onExecute(input) {
    const {
      action,
      topic,
      instructions,
      outlineData,
      isAdmin,
      slideCount = 7,
      designStyle = 'premium_blue',
    } = input;

    if (action === 'draft_outline') {
      if (!topic) throw new Error('Topic is required.');
      return await this.draftOutline(topic, instructions, isAdmin, slideCount, designStyle);
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
