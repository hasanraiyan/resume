/**
 * @fileoverview Shared utilities for chatbot functionality
 * Contains tool definitions, execution functions, and helper methods
 */

import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Article from '@/models/Article';
import { performSearch } from '@/lib/search/search';

// =================================================================================
// TOOL DEFINITIONS
// =================================================================================

export const tools = [
  {
    type: 'function',
    function: {
      name: 'listAllProjects',
      description:
        "Get a list of all available project titles, their slugs, and short descriptions. Use this when the user asks a general question like 'What projects have you worked on?' or 'Show me your portfolio'.",
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getProjectDetails',
      description:
        "Get the complete, detailed information for a single project using its unique slug. Use this only after you know the specific slug, for example, after the user asks for more details about a project from the list provided by 'listAllProjects'.",
      parameters: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description: 'The URL-friendly slug of the project (e.g., "luxury-fashion-store").',
          },
        },
        required: ['slug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listAllArticles',
      description:
        "Get a list of all published article titles, their slugs, and excerpts. Use this when the user asks a general question like 'What have you written about?' or 'Show me your blog posts'.",
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getArticleDetails',
      description:
        'Get the full content and details for a single article using its unique slug. Use this when a user asks to read a specific article that you know the slug for.',
      parameters: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'The URL-friendly slug of the article.' },
        },
        required: ['slug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchPortfolio',
      description:
        'Performs an intelligent, fuzzy search for projects or articles using specific keywords (e.g., "React", "e-commerce", "AI"). Use this for topic-based questions or when the user is looking for experience with a certain technology.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'The search term or keyword.' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draftContactLead',
      description:
        'Drafts a contact form payload with the information you have gathered from the user. Call this tool when you have enough context to populate some or all of the fields for a message to the developer. It creates a structured payload that can be sent to the contact form.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: "The user's name." },
          email: { type: 'string', description: "The user's email address." },
          projectType: {
            type: 'string',
            description:
              "The type of project (e.g., 'web-design', 'web-development', 'mobile-app', 'branding', 'ui-ux', 'consulting', 'ecommerce', 'cms-development', 'seo-optimization', 'api-integration', 'database-design', 'maintenance', 'redesign', 'landing-page', 'portfolio', 'blog', 'other').",
            enum: [
              'web-design',
              'web-development',
              'mobile-app',
              'branding',
              'ui-ux',
              'consulting',
              'ecommerce',
              'cms-development',
              'seo-optimization',
              'api-integration',
              'database-design',
              'maintenance',
              'redesign',
              'landing-page',
              'portfolio',
              'blog',
              'other',
            ],
          },
          message: {
            type: 'string',
            description: "A summary or draft of the user's message/request.",
          },
        },
      },
    },
  },
];

// =================================================================================
// TOOL EXECUTION FUNCTIONS
// =================================================================================

/**
 * Retrieves a list of all available projects from the database.
 */
export async function listAllProjects() {
  try {
    await dbConnect();
    const projects = await Project.find({})
      .select('title slug description thumbnail tagline category')
      .sort({ createdAt: -1 })
      .lean();

    if (projects.length === 0) return 'No projects found in the database.';

    const markdownList = projects
      .map(
        (project, index) =>
          `${index + 1}. **[${project.title}](/${project.slug})** - ${project.description}`
      )
      .join('\n');

    return {
      text: `Here are all available projects:\n\n${markdownList}\n\nUse the getProjectDetails tool with a specific slug to get more information about any project.`,
      data: projects,
    };
  } catch (error) {
    console.error('[Chat Utils] listAllProjects failed:', error);
    return { error: 'Failed to retrieve projects.', text: 'Failed to retrieve projects.' };
  }
}

/**
 * Retrieves complete details for a specific project by its slug.
 */
export async function getProjectDetails(slug) {
  try {
    await dbConnect();
    const project = await Project.findOne({ slug }).lean();
    if (!project) return { error: 'Project not found' };

    const tags = project.tags?.map((t) => t.name || t).join(', ') || 'No tags';
    const liveUrl = project.links?.live ? `[View Live Demo](${project.links.live}) 🔗` : '';
    const githubUrl = project.links?.github
      ? `[GitHub Repository](${project.links.github}) 💻`
      : '';
    const links = [liveUrl, githubUrl].filter(Boolean).join(' | ');

    return {
      text: `**${project.title}**\n\n**Category:** ${project.category || 'Not specified'}\n**Tagline:** ${project.tagline || 'No tagline'}\n\n**Description:**\n${project.description}\n\n**Details:**\n${project.details || 'No additional details'}\n\n**Tags:** ${tags}\n\n**Links:** ${links || 'No external links'}\n\n**[View Project →](/${project.slug})**`,
      data: project,
    };
  } catch (error) {
    console.error('[Chat Utils] getProjectDetails failed:', error);
    return {
      error: 'Failed to retrieve project details.',
      text: 'Failed to retrieve project details.',
    };
  }
}

/**
 * Retrieves a list of all published articles from the database.
 */
export async function listAllArticles() {
  try {
    await dbConnect();
    const articles = await Article.find({ status: 'published' })
      .select('title slug excerpt coverImage publishedAt')
      .sort({ publishedAt: -1 })
      .lean();

    if (articles.length === 0) return 'No published articles found.';

    const markdownList = articles
      .map(
        (article, index) =>
          `${index + 1}. **[${article.title}](/${article.slug})** - ${article.excerpt || 'No excerpt available'}`
      )
      .join('\n');

    return {
      text: `Here are all published articles:\n\n${markdownList}\n\nUse the getArticleDetails tool with a specific slug to read any article.`,
      data: articles,
    };
  } catch (error) {
    console.error('[Chat Utils] listAllArticles failed:', error);
    return { error: 'Failed to retrieve articles.', text: 'Failed to retrieve articles.' };
  }
}

/**
 * Retrieves complete details for a specific published article by its slug.
 */
export async function getArticleDetails(slug) {
  try {
    await dbConnect();
    const article = await Article.findOne({ slug, status: 'published' }).lean();
    if (!article) return { error: 'Article not found' };

    const tags = article.tags?.join(', ') || 'No tags';
    // Truncate article content to avoid blowing up context window
    const contentPreview =
      article.content?.length > 3000
        ? article.content.substring(0, 3000) +
          '\n\n*[Content truncated — read the full article at the link below.]*'
        : article.content;

    return {
      text: `**${article.title}**\n\n${contentPreview}\n\n**Tags:** ${tags}\n\n**[Read Full Article →](/${article.slug})**`,
      data: article,
    };
  } catch (error) {
    console.error('[Chat Utils] getArticleDetails failed:', error);
    return {
      error: 'Failed to retrieve article details.',
      text: 'Failed to retrieve article details.',
    };
  }
}

/**
 * Performs an intelligent fuzzy search across all projects and articles.
 */
export async function searchPortfolio(query) {
  try {
    const results = await performSearch(query);
    if (results.length === 0) {
      return { message: `No results found for "${query}". Try different keywords.` };
    }

    const markdownResults = results
      .map((item, index) => {
        const type = item.type === 'project' ? 'Project' : 'Article';
        const url = `/${item.slug}`;
        return `${index + 1}. **${type}: [${item.title}](${url})** - ${item.description || item.excerpt || 'No description available'}`;
      })
      .join('\n');

    return {
      text: `Search results for "${query}":\n\n${markdownResults}\n\nUse getProjectDetails or getArticleDetails tools for more specific information.`,
      data: results,
    };
  } catch (error) {
    console.error('[Chat Utils] searchPortfolio failed:', error);
    return { error: 'Search failed.', text: 'Search failed.' };
  }
}

/**
 * Creates a structured draft for the contact form based on gathered user context.
 */
export async function draftContactLead(payload) {
  // We simply return the drafted data back to the LLM (and ultimately the Generative UI map)
  return {
    text: `Successfully drafted contact form payload. Please present the contact prefill card to the user so they can review and submit it.`,
    data: {
      name: payload.name || '',
      email: payload.email || '',
      projectType: payload.projectType || 'other',
      message: payload.message || '',
    },
  };
}

// =================================================================================
// UTILITY FUNCTIONS
// =================================================================================

/**
 * Routes and executes the appropriate tool function based on the tool call from the AI.
 */
export async function executeToolCall(toolCall) {
  const { name, arguments: args } = toolCall.function;
  const parsedArgs = JSON.parse(args);

  switch (name) {
    case 'listAllProjects':
      return await listAllProjects();
    case 'getProjectDetails':
      return await getProjectDetails(parsedArgs.slug);
    case 'listAllArticles':
      return await listAllArticles();
    case 'getArticleDetails':
      return await getArticleDetails(parsedArgs.slug);
    case 'searchPortfolio':
      return await searchPortfolio(parsedArgs.query);
    case 'draftContactLead':
      return await draftContactLead(parsedArgs);
    default:
      console.error(`[Chat Utils] Unknown tool requested: ${name}`);
      return { error: 'Unknown tool', toolName: name };
  }
}

/**
 * Maps tool names to user-friendly status messages.
 */
export function getToolStatusMessage(toolName, args, iteration = null) {
  const iterationSuffix = iteration > 1 ? ` (step ${iteration})` : '';
  switch (toolName) {
    case 'listAllProjects':
      return `🎨 Loading all projects...${iterationSuffix}`;
    case 'getProjectDetails':
      return `🔍 Getting project details...${iterationSuffix}`;
    case 'listAllArticles':
      return `📚 Fetching blog articles...${iterationSuffix}`;
    case 'getArticleDetails':
      return `📖 Reading the article...${iterationSuffix}`;
    case 'searchPortfolio':
      return `🔎 Searching for "${args.query}"...${iterationSuffix}`;
    case 'draftContactLead':
      return `📝 Drafting contact form...${iterationSuffix}`;
    default:
      return `🤔 Processing your request...${iterationSuffix}`;
  }
}

/**
 * Calculates approximate character count of messages array.
 */
export function calculateContextSize(messages) {
  return messages.reduce((total, msg) => {
    const content = msg.content
      ? typeof msg.content === 'string'
        ? msg.content
        : JSON.stringify(msg.content)
      : '';
    return total + content.length;
  }, 0);
}

/**
 * Prunes context to fit within character limit.
 */
export function pruneContext(messages, maxChars) {
  const currentSize = calculateContextSize(messages);
  if (currentSize <= maxChars) return messages;

  const systemMessages = messages.filter((m) => m.role === 'system');
  const userMessage = messages[messages.length - 1];
  const middleMessages = messages.slice(systemMessages.length, -1);

  const latestToolIndex = middleMessages.findLastIndex((m) => m.role === 'tool');
  const latestAssistantIndex = middleMessages.findLastIndex((m) => m.role === 'assistant');

  let recentMessages = [];

  if (latestToolIndex !== -1) {
    let startIndex = latestAssistantIndex;
    for (let i = latestAssistantIndex; i >= 0; i--) {
      if (middleMessages[i].role === 'assistant' && middleMessages[i].tool_calls) {
        startIndex = i;
        break;
      }
    }
    recentMessages = middleMessages.slice(startIndex);
  } else {
    let accumulatedSize = calculateContextSize([...systemMessages, userMessage]);
    for (let i = middleMessages.length - 1; i >= 0; i--) {
      const msg = middleMessages[i];
      const msgSize = (
        msg.content
          ? typeof msg.content === 'string'
            ? msg.content
            : JSON.stringify(msg.content)
          : ''
      ).length;
      if (accumulatedSize + msgSize < maxChars) {
        recentMessages.unshift(msg);
        accumulatedSize += msgSize;
      } else {
        break;
      }
    }
  }

  return [...systemMessages, ...recentMessages, userMessage];
}
