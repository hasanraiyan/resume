/**
 * @fileoverview Shared utilities for chatbot functionality
 * Contains tool definitions, execution functions, and helper methods
 */

import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Article from '@/models/Article';
import { performSearch } from '@/lib/search/search';

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
 * Executes the actual contact form submission.
 */
export async function submitContactForm(payload) {
  const { createContactSubmission } = await import('@/app/actions/contactActions');

  try {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('email', payload.email);
    formData.append('projectType', payload.projectType);
    formData.append('message', payload.message);

    const result = await createContactSubmission(formData);
    if (result.success) {
      return {
        text: 'Contact message submitted successfully! Raiyan has been notified.',
        data: { success: true },
      };
    }
    return { error: result.message || 'Failed to submit.' };
  } catch (error) {
    console.error('[Chat Utils] submitContactForm failed:', error);
    return { error: 'Internal server error during submission.' };
  }
}

// =================================================================================
// UTILITY FUNCTIONS
// =================================================================================

/**
 * Maps tool names to user-friendly status messages.
 */
export function getToolStatusMessage(toolName, rawArgs, iteration = null) {
  let args = rawArgs;
  if (typeof rawArgs === 'string') {
    try {
      args = JSON.parse(rawArgs);
    } catch (e) {
      args = {};
    }
  }

  // LangGraph often wraps tool arguments in { input: "{\"query\": \"...\"}" }
  if (args && typeof args.input === 'string') {
    try {
      args = JSON.parse(args.input);
    } catch (e) {
      // Just keep it as the wrapper if it fails
    }
  }

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
    case 'searchPortfolio': {
      const q = args?.query || (typeof args === 'string' ? args : 'items');
      return `🔎 Searching for "${q}"...${iterationSuffix}`;
    }
    case 'submitContactForm':
      return `📝 Submitting contact form...${iterationSuffix}`;
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
  const contentMessages = messages.slice(systemMessages.length);
  const latestToolIndex = contentMessages.findLastIndex((m) => m.role === 'tool');
  const latestAssistantIndex = contentMessages.findLastIndex((m) => m.role === 'assistant');

  let recentMessages = [];

  if (latestToolIndex !== -1) {
    // If tools exist, we MUST keep identifying the whole chain (Assistant TC -> Tool TR)
    let startIndex = latestAssistantIndex;
    for (let i = latestAssistantIndex; i >= 0; i--) {
      if (contentMessages[i].role === 'assistant' && contentMessages[i].tool_calls) {
        startIndex = i;
        // Optimization: Include the user prompt that triggered this chain
        if (i > 0 && contentMessages[i - 1].role === 'user') {
          startIndex = i - 1;
        }
        break;
      }
    }
    recentMessages = contentMessages.slice(startIndex);
  } else {
    let accumulatedSize = calculateContextSize([...systemMessages]);
    for (let i = contentMessages.length - 1; i >= 0; i--) {
      const msg = contentMessages[i];
      const msgSize =
        msg.role === 'tool' || (msg.role === 'assistant' && msg.tool_calls)
          ? 200 // heuristic for tool metadata size
          : (msg.content
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

  // Final check: Ensure we start with a user message for strict providers
  while (recentMessages.length > 0 && recentMessages[0].role !== 'user') {
    recentMessages.shift();
  }

  return [...systemMessages, ...recentMessages];
}
