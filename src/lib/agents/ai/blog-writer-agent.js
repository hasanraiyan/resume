import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { getBackendMCPConfig } from '@/lib/mcpConfig';
import agentRegistry from '../AgentRegistry';
import Article from '@/models/Article';
import { v2 as cloudinary } from 'cloudinary';
import { revalidatePath } from 'next/cache';

// Configure Cloudinary
// Use explicit env vars if CLOUDINARY_URL is not set
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Helper for stream upload
const uploadToCloudinary = async (buffer, mimeType, folder = 'blog_assets') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format: mimeType ? mimeType.split('/')[1] : 'png',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

const BlogGenState = Annotation.Root({
  topic: Annotation({ reducer: (_, b) => b, default: () => '' }),
  existingArticles: Annotation({ reducer: (_, b) => b, default: () => [] }),
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
    const nodeOrder = [
      'fetchExisting',
      'planTopic',
      'writeDraft',
      'generateImages',
      'assemblePost',
      'saveDraft',
    ];
    const totalNodes = nodeOrder.length;
    let completedNodes = 0;

    // Wrapper to emit progress events
    const wrapNode = (nodeId, nodeFunc) => {
      return async (state) => {
        try {
          const result = await nodeFunc(state);

          // Calculate and emit progress
          completedNodes++;
          const progressPercent = Math.round((completedNodes / totalNodes) * 100);

          if (emitStatus) {
            const progressEvent = {
              type: 'progress',
              percent: progressPercent,
            };

            // Include article ID in final progress event
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

    const fetchExisting = async (state) => {
      self.logger.info(`Fetching existing articles to avoid duplicates...`);
      // No status messages - progress events only

      const articles = await Article.find({}, 'title slug').lean();
      return { existingArticles: articles, status: 'Existing articles fetched' };
    };

    const planTopic = async (state) => {
      self.logger.info(`Planning topic: ${state.topic}`);
      // No status messages - progress events only

      // Gather tools from configured MCP servers
      let allTools = [];
      let mcpClient = null;

      try {
        const activeMCPIds = self.config.activeMCPs || [];
        const backendMCPs = await getBackendMCPConfig(true); // true = isAdmin
        const selectedMCPConfigs = backendMCPs.filter((m) => activeMCPIds.includes(m.id));

        if (selectedMCPConfigs.length > 0) {
          const mcpServerConfig = {};
          for (const cfg of selectedMCPConfigs) {
            if (cfg && cfg.type !== 'rest' && cfg.url) {
              mcpServerConfig[cfg.id] = { transport: 'sse', url: cfg.url };
            }
          }
          if (Object.keys(mcpServerConfig).length > 0) {
            mcpClient = new MultiServerMCPClient(mcpServerConfig);
            allTools = await mcpClient.getTools();
          }
        }
      } catch (e) {
        self.logger.warn('Failed to load MCP tools for planning:', e);
      }

      const llm = await self.createChatModel({ temperature: 0.4 });

      const systemPrompt = `You are an expert technical researcher and blog planner.
Your goal is to research the topic "${state.topic}" and produce a comprehensive research summary and an outline for a highly engaging, SEO-optimized blog post.
Existing articles on our site: ${JSON.stringify(state.existingArticles)}. Ensure your angle is unique.

If you have tools available, use them to find the latest information.

Output format:
RESEARCH NOTES: <your findings>
---
OUTLINE: <your detailed outline>`;

      let notesAndOutline = '';

      if (allTools.length > 0) {
        try {
          const plannerAgent = createReactAgent({ llm, tools: allTools });
          // Use invoke (not stream) to avoid emitting intermediate tool calls
          const result = await plannerAgent.invoke({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Research and plan: ${state.topic}` },
            ],
          });
          notesAndOutline = result.messages[result.messages.length - 1].content;
        } catch (e) {
          // Silently fall back to LLM if tools fail
          self.logger.warn('MCP tools failed for planning:', e);
          const result = await llm.invoke([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Plan: ${state.topic}` },
          ]);
          notesAndOutline = result.content;
        }
      } else {
        const result = await llm.invoke([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Plan: ${state.topic}` },
        ]);
        notesAndOutline = result.content;
      }

      const parts = notesAndOutline.split('---');
      const researchNotes = parts[0]?.replace('RESEARCH NOTES:', '').trim() || '';
      const outline = parts[1]?.replace('OUTLINE:', '').trim() || notesAndOutline;

      return { researchNotes, outline, status: 'Topic planned' };
    };

    const writeDraft = async (state) => {
      self.logger.info(`Writing draft...`);
      // No status messages - progress events only

      const llm = await self.createChatModel({ temperature: 0.7 });
      const prompt = `You are an expert technical writer. Write a comprehensive, highly engaging, and SEO-optimized blog post based on the following:

Topic: ${state.topic}
Research Notes: ${state.researchNotes}
Outline: ${state.outline}

RULES:
1. Write in a clear, authoritative, yet accessible tone.
2. Use markdown formatting (headers, lists, bold text).
3. The post should be at least 1000 words.
4. IMPORTANT: Determine points where an image would be beneficial. At exactly these points, insert an image in markdown format like so:
   ![Prompt for a conceptual hero image about the topic](IMAGE_0)
   ![Prompt for a technical diagram or illustration](IMAGE_1)
   ![Prompt description](IMAGE_n)
   The image IDs (IMAGE_0, IMAGE_1, etc.) will be automatically replaced with generated image URLs.

5. At the very end of your response, output a JSON block wrapped in \`\`\`json containing metadata:
   { "title": "...", "slug": "...", "excerpt": "...", "tags": ["tag1", "tag2"] }`;

      const result = await llm.invoke([{ role: 'user', content: prompt }]);
      const content = result.content;

      // Extract JSON metadata
      let metadata = {};
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          metadata = JSON.parse(jsonMatch[1]);
        } catch (e) {
          self.logger.warn('Failed to parse metadata JSON:', e);
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

      const cleanContent = content.replace(/```json\n[\s\S]*?\n```/, '').trim();

      // Extract Image Prompts from markdown format: ![description](IMAGE_0)
      const imagePrompts = [];
      const imageRegex = /!\[(.*?)\]\((IMAGE_\d+)\)/g;
      let match;
      while ((match = imageRegex.exec(cleanContent)) !== null) {
        const description = match[1].trim();
        const imageId = match[2].trim();

        imagePrompts.push({
          id: imageId,
          prompt: description,
          aspect: '16:9', // Default to 16:9 for all blog images
        });
      }

      return { rawContent: cleanContent, imagePrompts, metadata, status: 'Draft written' };
    };

    const generateImages = async (state) => {
      self.logger.info(`Generating images...`);
      // No status messages - progress events only

      const generatedImages = {};

      if (state.imagePrompts && state.imagePrompts.length > 0) {
        const imageGenerator = agentRegistry.get(AGENT_IDS.IMAGE_GENERATOR);

        for (const [index, img] of state.imagePrompts.entries()) {
          // Silently generate images, no status updates
          try {
            const result = await imageGenerator.execute({
              prompt: img.prompt,
              aspectRatio: img.aspect,
            });
            if (result && result.buffer) {
              const uploadRes = await uploadToCloudinary(result.buffer, result.mimeType);
              generatedImages[img.id] = uploadRes.secure_url;
            }
          } catch (e) {
            self.logger.error(`Failed to generate/upload image for ${img.id}:`, e);
          }
        }
      }

      return { generatedImages, status: 'Images generated' };
    };

    const assemblePost = async (state) => {
      self.logger.info(`Assembling final post...`);
      // No status messages - progress events only

      let finalContent = state.rawContent;
      let coverImage = null;

      // Replace placeholders in markdown format: ![description](IMAGE_0) -> ![description](url)
      for (const [id, url] of Object.entries(state.generatedImages)) {
        if (!coverImage) coverImage = url; // first image becomes cover
        // Replace IMAGE_0, IMAGE_1, etc. with actual URLs
        const regex = new RegExp(`\\(${id}\\)`, 'g');
        finalContent = finalContent.replace(regex, `(${url})`);
      }

      const finalMeta = { ...state.metadata };
      if (coverImage) finalMeta.coverImage = coverImage;

      return { finalContent, metadata: finalMeta, status: 'Post assembled' };
    };

    const saveDraft = async (state) => {
      self.logger.info(`Saving draft...`);
      // No status messages - progress events only

      let slug = state.metadata.slug;

      // Ensure unique slug
      let counter = 1;
      let existing = await Article.findOne({ slug });
      while (existing) {
        slug = `${state.metadata.slug}-${counter}`;
        existing = await Article.findOne({ slug });
        counter++;
      }

      const article = new Article({
        title: state.metadata.title,
        slug: slug,
        excerpt: state.metadata.excerpt,
        content: state.finalContent,
        coverImage: state.metadata.coverImage || '',
        tags: state.metadata.tags || [],
        status: 'draft',
        visibility: 'public',
      });

      await article.save();

      // No status messages - progress events only (emitted by wrapNode)

      return { articleId: article._id.toString(), status: 'Done' };
    };

    const graph = new StateGraph(BlogGenState)
      .addNode('fetchExisting', wrapNode('fetchExisting', fetchExisting))
      .addNode('planTopic', wrapNode('planTopic', planTopic))
      .addNode('writeDraft', wrapNode('writeDraft', writeDraft))
      .addNode('generateImages', wrapNode('generateImages', generateImages))
      .addNode('assemblePost', wrapNode('assemblePost', assemblePost))
      .addNode('saveDraft', wrapNode('saveDraft', saveDraft))
      .addEdge(START, 'fetchExisting')
      .addEdge('fetchExisting', 'planTopic')
      .addEdge('planTopic', 'writeDraft')
      .addEdge('writeDraft', 'generateImages')
      .addEdge('generateImages', 'assemblePost')
      .addEdge('assemblePost', 'saveDraft')
      .addEdge('saveDraft', END);

    return graph.compile();
  }

  async _validateInput(input) {
    if (!input || !input.topic) {
      throw new Error('topic is required');
    }
  }

  async *_onStreamExecute(input) {
    const { topic } = input;

    // We set the statusEmitter to yield directly from the node steps
    // Since node execution is somewhat opaque in streaming if we don't hook into its internal events,
    // we use a callback pattern mapped to our `yield` mechanism.

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
          // Don't send content message - just let progress bar handle it
          break;
        } else if (event.type === 'error') {
          throw new Error(event.error);
        } else {
          yield event; // Only yield progress events
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
