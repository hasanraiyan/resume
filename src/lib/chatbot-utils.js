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
];

// =================================================================================
// TOOL EXECUTION FUNCTIONS
// =================================================================================

/**
 * Retrieves a list of all available projects from the database.
 */
export async function listAllProjects() {
  console.log('[Chat Utils] 📋 Executing listAllProjects...');
  try {
    await dbConnect();
    const projects = await Project.find({})
      .select('title slug description')
      .sort({ createdAt: -1 })
      .lean();
    console.log(`[Chat Utils] ✅ Retrieved ${projects.length} projects`);

    if (projects.length === 0) {
      return 'No projects found in the database.';
    }

    const markdownList = projects
      .map((project, index) => {
        return `${index + 1}. **[${project.title}](/${project.slug})** - ${project.description}`;
      })
      .join('\n');

    return `Here are all available projects:\n\n${markdownList}\n\nUse the getProjectDetails tool with a specific slug to get more information about any project.`;
  } catch (error) {
    console.error('[Chat Utils] ❌ Error in listAllProjects:', error);
    return { error: 'Failed to retrieve projects.' };
  }
}

/**
 * Retrieves complete details for a specific project by its slug.
 */
export async function getProjectDetails(slug) {
  console.log(`[Chat Utils] 🔍 Executing getProjectDetails for slug: "${slug}"`);
  try {
    await dbConnect();
    const project = await Project.findOne({ slug }).lean();
    if (!project) {
      console.log(`[Chat Utils] ⚠️ Project not found: "${slug}"`);
      return { error: 'Project not found' };
    }
    console.log(`[Chat Utils] ✅ Retrieved project: "${project.title}"`);

    const tags = project.tags?.map((t) => t.name || t).join(', ') || 'No tags';
    const liveUrl = project.links?.live ? `[View Live Demo](${project.links.live}) 🔗` : '';
    const githubUrl = project.links?.github
      ? `[GitHub Repository](${project.links.github}) 💻`
      : '';

    const links = [liveUrl, githubUrl].filter(Boolean).join(' | ');

    return `**${project.title}**\n\n**Category:** ${project.category || 'Not specified'}\n**Tagline:** ${project.tagline || 'No tagline'}\n\n**Description:**\n${project.description}\n\n**Details:**\n${project.details || 'No additional details'}\n\n**Tags:** ${tags}\n\n**Links:** ${links || 'No external links'}\n\n**[View Project →](/${project.slug})**`;
  } catch (error) {
    console.error('[Chat Utils] ❌ Error in getProjectDetails:', error);
    return { error: 'Failed to retrieve project details.' };
  }
}

/**
 * Retrieves a list of all published articles from the database.
 */
export async function listAllArticles() {
  console.log('[Chat Utils] 📰 Executing listAllArticles...');
  try {
    await dbConnect();
    const articles = await Article.find({ status: 'published' })
      .select('title slug excerpt')
      .sort({ publishedAt: -1 })
      .lean();
    console.log(`[Chat Utils] ✅ Retrieved ${articles.length} published articles`);

    if (articles.length === 0) {
      return 'No published articles found.';
    }

    const markdownList = articles
      .map((article, index) => {
        return `${index + 1}. **[${article.title}](/${article.slug})** - ${article.excerpt || 'No excerpt available'}`;
      })
      .join('\n');

    return `Here are all published articles:\n\n${markdownList}\n\nUse the getArticleDetails tool with a specific slug to read any article.`;
  } catch (error) {
    console.error('[Chat Utils] ❌ Error in listAllArticles:', error);
    return { error: 'Failed to retrieve articles.' };
  }
}

/**
 * Retrieves complete details for a specific published article by its slug.
 */
export async function getArticleDetails(slug) {
  console.log(`[Chat Utils] 🔍 Executing getArticleDetails for slug: "${slug}"`);
  try {
    await dbConnect();
    const article = await Article.findOne({ slug, status: 'published' }).lean();
    if (!article) {
      console.log(`[Chat Utils] ⚠️ Article not found: "${slug}"`);
      return { error: 'Article not found' };
    }
    console.log(`[Chat Utils] ✅ Retrieved article: "${article.title}"`);

    const tags = article.tags?.join(', ') || 'No tags';

    return `**${article.title}**\n\n${article.content}\n\n**Tags:** ${tags}\n\n**[Read Full Article →](/${article.slug})**`;
  } catch (error) {
    console.error('[Chat Utils] ❌ Error in getArticleDetails:', error);
    return { error: 'Failed to retrieve article details.' };
  }
}

/**
 * Performs an intelligent fuzzy search across all projects and articles.
 */
export async function searchPortfolio(query) {
  console.log(`[Chat Utils] 🔎 Executing searchPortfolio with query: "${query}"`);
  try {
    const results = await performSearch(query);
    if (results.length === 0) {
      console.log(`[Chat Utils] ℹ️ No results found for: "${query}"`);
      return { message: `No results found for "${query}". Try different keywords.` };
    }
    console.log(`[Chat Utils] ✅ Found ${results.length} results for: "${query}"`);

    const markdownResults = results
      .map((item, index) => {
        const type = item.type === 'project' ? 'Project' : 'Article';
        const url = item.type === 'project' ? `/${item.slug}` : `/${item.slug}`;
        return `${index + 1}. **${type}: [${item.title}](${url})** - ${item.description || item.excerpt || 'No description available'}`;
      })
      .join('\n');

    return `Search results for "${query}":\n\n${markdownResults}\n\nUse getProjectDetails or getArticleDetails tools for more specific information.`;
  } catch (error) {
    console.error('[Chat Utils] ❌ Error in searchPortfolio:', error);
    return { error: 'Search failed.' };
  }
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

  console.log(`[Chat Utils] 🔧 Executing tool: ${name}`, parsedArgs);

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
    default:
      console.error(`[Chat Utils] ❌ Unknown tool requested: ${name}`);
      return { error: 'Unknown tool', toolName: name };
  }
}

/**
 * Maps tool names to user-friendly status messages.
 */
export function getToolStatusMessage(toolName, args, iteration = null) {
  const iterationSuffix = iteration > 1 ? ` (Step ${iteration})` : '';

  switch (toolName) {
    case 'listAllProjects':
      return `🎨 Loading all projects...${iterationSuffix}`;
    case 'getProjectDetails':
      return `🔍 Getting details about the project...${iterationSuffix}`;
    case 'listAllArticles':
      return `📚 Fetching blog articles...${iterationSuffix}`;
    case 'getArticleDetails':
      return `📖 Reading the article...${iterationSuffix}`;
    case 'searchPortfolio':
      return `🔎 Searching for "${args.query}"...${iterationSuffix}`;
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

  if (currentSize <= maxChars) {
    return messages;
  }

  console.log(`[Chat Utils] ⚠️ Context too large: ${currentSize} chars, pruning to ${maxChars}...`);

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
    console.log(
      `[Chat Utils] ✂️ Keeping only latest tool calls (removed ${startIndex} old messages)`
    );
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

  const prunedMessages = [...systemMessages, ...recentMessages, userMessage];
  const finalSize = calculateContextSize(prunedMessages);

  console.log(
    `[Chat Utils] ✂️ Pruned from ${messages.length} to ${prunedMessages.length} messages (${currentSize} → ${finalSize} chars)`
  );

  return prunedMessages;
}
