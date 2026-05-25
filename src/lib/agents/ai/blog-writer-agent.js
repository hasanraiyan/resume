import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import agentRegistry from '../AgentRegistry';
import Article from '@/models/Article';

// Dynamic date context for time-sensitive research
const CURRENT_DATE = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const CURRENT_YEAR = new Date().getFullYear().toString();

const BlogGenState = Annotation.Root({
  topic: Annotation({ reducer: (_, b) => b, default: () => '' }),
  researchNotes: Annotation({ reducer: (_, b) => b, default: () => '' }),
  outline: Annotation({ reducer: (_, b) => b, default: () => '' }),
  rawContent: Annotation({ reducer: (_, b) => b, default: () => '' }),
  imagePrompts: Annotation({ reducer: (_, b) => b, default: () => [] }),
  generatedImages: Annotation({ reducer: (a, b) => ({ ...a, ...b }), default: () => ({}) }),
  finalContent: Annotation({ reducer: (_, b) => b, default: () => '' }),
  metadata: Annotation({ reducer: (_, b) => b, default: () => ({}) }),
  status: Annotation({ reducer: (_, b) => b, default: () => 'Starting...' }),
  articleId: Annotation({ reducer: (_, b) => b, default: () => null }),
});

class BlogWriterAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.BLOG_WRITER, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Blog Writer Agent Initialized');
  }

  _buildGraph(emitStatus) {
    const self = this;

    // Node tracking for progress calculation
    const nodeOrder = ['researchTopic', 'planOutline', 'writeAndGenerate', 'assembleAndSave'];
    const totalNodes = nodeOrder.length;
    let completedNodes = 0;

    // Wrapper to emit progress events
    const wrapNode = (nodeId, nodeFunc) => {
      return async (state) => {
        try {
          const result = await nodeFunc(state);

          completedNodes++;
          const progressPercent = Math.round((completedNodes / totalNodes) * 100);

          if (emitStatus) {
            const progressEvent = {
              type: 'progress',
              percent: progressPercent,
            };

            if (result.articleId) {
              progressEvent.articleId = result.articleId;
            }

            emitStatus(progressEvent);
          }

          return result;
        } catch (error) {
          self.logger.error(`Error in node ${nodeId}:`, error);
          throw error;
        }
      };
    };

    // ─── Node 1: Research using LLM knowledge ───
    const researchTopic = async (state) => {
      self.logger.info(`Researching topic: ${state.topic}`);

      if (emitStatus) {
        emitStatus({ type: 'status', message: '🤖 Researching using AI knowledge base...' });
      }

      const llm = await self.createChatModel({ temperature: 0.3 });

      const result = await llm.invoke([
        {
          role: 'system',
          content: `You are an expert technical researcher. Provide a comprehensive research summary about the topic. IMPORTANT: The current date is ${CURRENT_DATE}. Focus on information from ${CURRENT_YEAR} and late ${parseInt(CURRENT_YEAR) - 1}. Include specific APIs, libraries, best practices, common pitfalls, and real-world examples. Note any recent updates or breaking changes.`,
        },
        {
          role: 'user',
          content: `Research: ${state.topic}. Provide the most current information as of ${CURRENT_DATE}.`,
        },
      ]);
      const researchNotes = result.content;

      return { researchNotes, status: 'Research complete' };
    };

    // ─── Node 2: Plan outline + extract image prompts & metadata ───
    const planOutline = async (state) => {
      self.logger.info(`Planning outline from research...`);

      if (emitStatus) {
        emitStatus({
          type: 'status',
          message: '📝 Creating article outline based on latest research...',
        });
      }

      const llm = await self.createChatModel({ temperature: 0.4 });

      const prompt = `You are an expert blog planner for a developer portfolio blog. Based on the research below (gathered in ${CURRENT_DATE}), create a detailed article outline that highlights the MOST CURRENT information.

TOPIC: ${state.topic}

RESEARCH NOTES (${CURRENT_DATE}):
${state.researchNotes}

CREATE A DETAILED OUTLINE following this exact structure:
- Title: Clear, compelling, specific (not generic) - should reflect current state of topic
- Opening hook (2-3 paragraphs with a relatable scenario or provocative question about ${CURRENT_YEAR})
- Section 1: The Problem / Context (why this matters NOW in ${CURRENT_YEAR})
- Sections 2-5: Core Content (deep technical sections — specify what code examples, comparisons, and tables go where)
- Section N-1: Practical Application / Common Mistakes (real-world tips for ${CURRENT_YEAR})
- Final Thoughts (2-3 paragraph conclusion with key insight)
- Further Reading (3-4 real, relevant URLs from the research)

For each section, note:
- The key points to cover
- Which research findings to reference
- Where to place code examples (specify what the code should demonstrate)
- Where to place comparison tables
- Where to use the real-world analogy

IMPORTANT: Ensure the outline reflects that this article is being written in ${CURRENT_DATE}.

Also plan 2-4 images for the article. For each image, provide a highly detailed generation prompt.

Output a JSON block at the very end with metadata AND image prompts:
\`\`\`json
{
  "title": "Exact article title",
  "slug": "lowercase-hyphenated-version",
  "excerpt": "Compelling 2-sentence summary, 150-200 characters",
  "tags": ["primary-category", "tag2", "tag3", "tag4", "tag5"],
  "imagePrompts": [
    { "id": "IMAGE_0", "prompt": "A clean, minimal infographic-style illustration on a white background. DETAILED DESCRIPTION HERE. Soft pastel colors, geometric shapes, modern editorial style. No text.", "aspect": "16:9" },
    { "id": "IMAGE_1", "prompt": "A clean, minimal infographic-style illustration on a white background. DETAILED DESCRIPTION HERE. Soft pastel colors, geometric shapes, modern editorial style. No text.", "aspect": "16:9" }
  ]
}
\`\`\`

Image prompt requirements:
- ALWAYS specify "white background" and "no text" in every prompt
- Be EXTREMELY specific and detailed about what objects, actions, and layout to show
- Style: clean, minimal, infographic-style illustration with soft pastel colors
- The first image (IMAGE_0) should be a cover/hero image about the overall topic
- Provide 5-8 lowercase tags. The first tag should be the primary category (e.g., "javascript", "react", "architecture").`;

      const result = await llm.invoke([{ role: 'user', content: prompt }]);
      const content = result.content;

      // Extract JSON metadata + imagePrompts
      let metadata = {};
      let imagePrompts = [];
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          imagePrompts = parsed.imagePrompts || [];
          delete parsed.imagePrompts;
          metadata = parsed;
        } catch (e) {
          self.logger.warn('Failed to parse outline JSON:', e);
        }
      }

      if (!metadata.title) metadata.title = state.topic;
      if (!metadata.slug)
        metadata.slug = state.topic
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      if (!metadata.excerpt) metadata.excerpt = 'A comprehensive guide to ' + state.topic;
      if (!metadata.tags) metadata.tags = [state.topic.split(' ')[0]];

      const cleanOutline = content.replace(/```json\n[\s\S]*?\n```/, '').trim();

      return { outline: cleanOutline, imagePrompts, metadata, status: 'Outline planned' };
    };

    // ─── Inner function: Write the draft ───
    const writeDraftFn = async (state) => {
      self.logger.info(`Writing draft...`);

      if (emitStatus) {
        emitStatus({ type: 'status', message: '✍️ Writing article with latest information...' });
      }

      const llm = await self.createChatModel({ temperature: 0.7 });

      // Build image placement instructions from pre-planned prompts
      const imagePlaceholders = (state.imagePrompts || [])
        .map((img) => `  ${img.id}: ${img.prompt}`)
        .join('\n');

      const prompt = `You are an expert technical writer for a developer portfolio blog. Write a professional, high-quality blog post with UP-TO-DATE information.

CURRENT DATE: ${CURRENT_DATE} (this article is being written in ${CURRENT_YEAR})

Topic: ${state.topic}
Research Notes: ${state.researchNotes}
Outline: ${state.outline}

ARTICLE STRUCTURE (follow this exactly):
1. Start with a compelling, specific title as # heading
2. Add an italic subtitle/hook — one line that makes the reader care
3. Add a --- separator
4. Opening hook: 2-3 paragraphs that draw the reader in with a relatable scenario or provocative question
5. ## Section 1: The Problem / Context — set up why this topic matters in ${CURRENT_YEAR}
6. ## Sections 2-5: Core Content — deep, well-structured sections with code examples, comparisons, and visuals
7. ## Practical Application / Common Mistakes — real-world tips and mistakes to avoid in ${CURRENT_YEAR}
8. ## Final Thoughts — 2-3 paragraph conclusion summarizing the key insight
9. Add a --- separator
10. End with a "**Further Reading:**" section with 3-4 relevant linked resources

WRITING RULES:
- Tone: Conversational but authoritative. Like explaining to a smart colleague, not lecturing.
- Length: 1,800-2,800 words (6-9 min read). NEVER under 1,500 words.
- Code examples: MUST include real, runnable code. Not pseudocode. Well-commented.
- Analogies: Use at least one strong real-world analogy.
- Tables: Use at least one comparison table when contrasting concepts.
- No fluff: Every paragraph must teach something. Cut sentences that don't add value.
- Subheadings: Use ## and ### liberally. No section should exceed 4-5 paragraphs without a heading break.
- Bold key terms: Use **bold** for important concepts on first mention.
- Use double quotes for all strings.

DATE CONTEXT: Mention when relevant that information is current as of ${CURRENT_DATE}. If discussing trends, note they are ${CURRENT_YEAR} trends.

IMAGE PLACEMENT:
Insert these pre-planned images at appropriate points in your article using this exact markdown format:
${imagePlaceholders}

Use: ![brief description](IMAGE_X) where IMAGE_X matches the IDs above.
Place them at natural visual break points between sections. The first image (IMAGE_0) should appear near the top as a hero image.

Do NOT output any JSON metadata block — just the article content.`;

      const result = await llm.invoke([{ role: 'user', content: prompt }]);

      return { rawContent: result.content.trim() };
    };

    // ─── Inner function: Generate all images in parallel ───
    const generateImagesFn = async (state) => {
      self.logger.info(`Generating images in parallel...`);

      if (emitStatus) {
        emitStatus({ type: 'status', message: '🎨 Generating custom illustrations...' });
      }

      const generatedImages = {};

      if (state.imagePrompts && state.imagePrompts.length > 0) {
        // Dynamic import to break circular dependency
        const { uploadGeneratedImage } = await import('@/app/actions/mediaActions');
        const imageGenerator = agentRegistry.get(AGENT_IDS.IMAGE_GENERATOR);

        const generateSingleImage = async (img) => {
          // Try up to 2 attempts (1 initial + 1 retry)
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const result = await imageGenerator.execute({
                prompt: img.prompt,
                aspectRatio: img.aspect,
              });
              if (result && result.buffer) {
                const uploadRes = await uploadGeneratedImage({
                  buffer: result.buffer,
                  mimeType: result.mimeType,
                  filename: `blog_${img.id}_${Date.now()}.${result.mimeType.split('/')[1]}`,
                  prompt: img.prompt,
                  source: 'blog_writer',
                });
                if (uploadRes.success) {
                  return { id: img.id, url: uploadRes.asset.secure_url };
                }
              }
            } catch (e) {
              self.logger.warn(`Image ${img.id} attempt ${attempt + 1} failed:`, e.message);
              if (attempt === 1) {
                self.logger.error(`Failed to generate image ${img.id} after retry`);
              }
            }
          }
          return null;
        };

        const results = await Promise.allSettled(
          state.imagePrompts.map((img) => generateSingleImage(img))
        );

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            generatedImages[result.value.id] = result.value.url;
          }
        }
      }

      return { generatedImages };
    };

    // ─── Node 3: Write draft & generate images in parallel ───
    const writeAndGenerate = async (state) => {
      if (emitStatus) {
        emitStatus({ type: 'status', message: '✍️ Writing draft & generating images...' });
      }

      const [draftResult, imageResult] = await Promise.all([
        writeDraftFn(state),
        generateImagesFn(state),
      ]);

      return { ...draftResult, ...imageResult, status: 'Draft & images complete' };
    };

    // ─── Node 4: Assemble final post & save to database ───
    const assembleAndSave = async (state) => {
      self.logger.info(`Assembling and saving...`);

      if (emitStatus) {
        emitStatus({ type: 'status', message: '✨ Assembling & saving article...' });
      }

      // Replace image placeholders with real URLs
      let finalContent = state.rawContent;
      let coverImage = null;

      for (const [id, url] of Object.entries(state.generatedImages)) {
        if (!coverImage) coverImage = url;
        const regex = new RegExp(`\\(${id}\\)`, 'g');
        finalContent = finalContent.replace(regex, `(${url})`);
      }

      const finalMeta = { ...state.metadata };
      if (coverImage) finalMeta.coverImage = coverImage;

      // Ensure unique slug
      let slug = finalMeta.slug;
      // Escape slug for regex and find all potential collisions
      const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const slugRegex = new RegExp(`^${escapedSlug}(-[0-9]+)?$`);

      // Only select the slug field and use lean() for performance
      const existingArticles = await Article.find({ slug: slugRegex }).select('slug').lean();

      if (existingArticles.length > 0) {
        const existingSlugs = new Set(existingArticles.map((a) => a.slug));
        if (existingSlugs.has(slug)) {
          let counter = 1;
          while (existingSlugs.has(`${finalMeta.slug}-${counter}`)) {
            counter++;
          }
          slug = `${finalMeta.slug}-${counter}`;
        }
      }

      const article = new Article({
        title: finalMeta.title,
        slug: slug,
        excerpt: finalMeta.excerpt,
        content: finalContent,
        coverImage: finalMeta.coverImage || '',
        tags: finalMeta.tags || [],
        status: 'draft',
        visibility: 'public',
      });

      await article.save();

      return { articleId: article._id.toString(), status: 'Done' };
    };

    const graph = new StateGraph(BlogGenState)
      .addNode('researchTopic', wrapNode('researchTopic', researchTopic))
      .addNode('planOutline', wrapNode('planOutline', planOutline))
      .addNode('writeAndGenerate', wrapNode('writeAndGenerate', writeAndGenerate))
      .addNode('assembleAndSave', wrapNode('assembleAndSave', assembleAndSave))
      .addEdge(START, 'researchTopic')
      .addEdge('researchTopic', 'planOutline')
      .addEdge('planOutline', 'writeAndGenerate')
      .addEdge('writeAndGenerate', 'assembleAndSave')
      .addEdge('assembleAndSave', END);

    return graph.compile();
  }

  async _validateInput(input) {
    if (!input || !input.topic) {
      throw new Error('topic is required');
    }
  }

  async *_onStreamExecute(input) {
    const { topic } = input;

    let currentResolver = null;
    let eventsQueue = [];

    const emitStatus = (event) => {
      eventsQueue.push(event);
      if (currentResolver) {
        currentResolver();
        currentResolver = null;
      }
    };

    const graph = this._buildGraph(emitStatus);

    const runPromise = graph
      .invoke({ topic })
      .then((result) => {
        eventsQueue.push({ type: 'done', result });
        if (currentResolver) currentResolver();
      })
      .catch((err) => {
        eventsQueue.push({ type: 'error', error: err.message });
        if (currentResolver) currentResolver();
      });

    while (true) {
      if (eventsQueue.length > 0) {
        const event = eventsQueue.shift();
        if (event.type === 'done') {
          break;
        } else if (event.type === 'error') {
          throw new Error(event.error);
        } else {
          yield event;
        }
      } else {
        await new Promise((resolve) => {
          currentResolver = resolve;
        });
      }
    }
  }
}

export default BlogWriterAgent;
