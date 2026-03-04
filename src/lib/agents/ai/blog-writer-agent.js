import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { getBackendMCPConfig } from '@/lib/mcpConfig';
import agentRegistry from '../AgentRegistry';
import Article from '@/models/Article';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
// It will automatically pick up process.env.CLOUDINARY_URL
cloudinary.config({
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

    const fetchExisting = async (state) => {
      self.logger.info(`Fetching existing articles to avoid duplicates...`);
      if (emitStatus)
        emitStatus({ type: 'status', message: '🔍 Checking existing articles...' });

      const articles = await Article.find({}, 'title slug').lean();
      return { existingArticles: articles, status: 'Existing articles fetched' };
    };

    const planTopic = async (state) => {
      self.logger.info(`Planning topic: ${state.topic}`);
      if (emitStatus)
        emitStatus({ type: 'status', message: '📚 Researching topic...' });

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
        const plannerAgent = createReactAgent({ llm, tools: allTools });
        const result = await plannerAgent.invoke({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Research and plan: ${state.topic}` },
          ],
        });
        notesAndOutline = result.messages[result.messages.length - 1].content;
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
      if (emitStatus)
        emitStatus({ type: 'status', message: '✍️ Writing draft...' });

      const llm = await self.createChatModel({ temperature: 0.7 });
      const prompt = `You are an expert technical writer. Write a comprehensive, highly engaging, and SEO-optimized blog post based on the following:

Topic: ${state.topic}
Research Notes: ${state.researchNotes}
Outline: ${state.outline}

RULES:
1. Write in a clear, authoritative, yet accessible tone.
2. Use markdown formatting (headers, lists, bold text).
3. The post should be at least 1000 words.
4. IMPORTANT: Determine points where an image would be beneficial. At exactly these points, insert an image placeholder like so:
   IMAGE_URL_0: [Prompt for a conceptual hero image about the topic, 16:9]
   IMAGE_URL_1: [Prompt for a technical diagram or illustration, 16:9]
   IMAGE_URL_n: [Prompt...]
   Do NOT use standard markdown image tags yet. Just output the placeholder lines on their own lines.

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

      // Extract Image Prompts
      const imagePrompts = [];
      const imageRegex = /IMAGE_URL_(\d+):\s*\[(.*?)\]/g;
      let match;
      while ((match = imageRegex.exec(cleanContent)) !== null) {
        const parts = match[2].split(',');
        const p = parts[0].trim();
        const aspect = parts[1] ? parts[1].trim() : '16:9';
        imagePrompts.push({ id: `IMAGE_URL_${match[1]}`, prompt: p, aspect });
      }

      return { rawContent: cleanContent, imagePrompts, metadata, status: 'Draft written' };
    };

    const generateImages = async (state) => {
      self.logger.info(`Generating images...`);

      const generatedImages = {};

      if (state.imagePrompts && state.imagePrompts.length > 0) {
        const imageGenerator = agentRegistry.get(AGENT_IDS.IMAGE_GENERATOR);

        for (const [index, img] of state.imagePrompts.entries()) {
          if (emitStatus)
            emitStatus({
              type: 'status',
              message: `🎨 Visualizing... (${index + 1}/${state.imagePrompts.length})`,
            });
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
      if (emitStatus)
        emitStatus({ type: 'status', message: '⚙️ Assembling post...' });

      let finalContent = state.rawContent;
      let coverImage = null;

      // Replace placeholders
      for (const [id, url] of Object.entries(state.generatedImages)) {
        if (!coverImage) coverImage = url; // first image becomes cover
        const regex = new RegExp(`${id}:\\s*\\[.*?\\]`, 'g');
        finalContent = finalContent.replace(regex, `![Image](${url})`);
      }

      const finalMeta = { ...state.metadata };
      if (coverImage) finalMeta.coverImage = coverImage;

      return { finalContent, metadata: finalMeta, status: 'Post assembled' };
    };

    const saveDraft = async (state) => {
      self.logger.info(`Saving draft...`);
      if (emitStatus) emitStatus({ type: 'status', message: '💾 Saving draft...' });

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
      });

      await article.save();

      if (emitStatus)
        emitStatus({ type: 'status', message: `✅ Draft saved successfully!` });

      return { articleId: article._id.toString(), status: 'Done' };
    };

    const graph = new StateGraph(BlogGenState)
      .addNode('fetchExisting', fetchExisting)
      .addNode('planTopic', planTopic)
      .addNode('writeDraft', writeDraft)
      .addNode('generateImages', generateImages)
      .addNode('assemblePost', assemblePost)
      .addNode('saveDraft', saveDraft)
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
          const finalUrl = `/admin/articles/${event.result.articleId}/edit`;
          yield {
            type: 'content',
            message: `I have successfully researched, written, and generated images for the blog post! It is currently saved as a draft.\n\n[Click here to review and publish the draft](${finalUrl})`,
          };
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
