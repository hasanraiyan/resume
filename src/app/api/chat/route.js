/**
 * @fileoverview Chat API route for handling AI-powered chatbot interactions.
 * This module provides conversational AI capabilities with function calling
 * to access portfolio data (projects and articles) dynamically.
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildDynamicContext } from '@/lib/ai/context-builder';
import Analytics from '@/models/Analytics';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Article from '@/models/Article';
import { performSearch } from '@/lib/search/search';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// =================================================================================
// 1. DEFINE ALL AVAILABLE TOOLS FOR THE AI
// =================================================================================
const tools = [
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
// 2. CREATE THE EXECUTION FUNCTIONS FOR EACH TOOL
// =================================================================================

/**
 * Retrieves a list of all available projects from the database.
 * Returns only essential fields (title, slug, description) for overview purposes.
 *
 * @async
 * @function listAllProjects
 * @returns {Promise<Array<{title: string, slug: string, description: string}>>} Array of project objects with basic information
 * @returns {Promise<{error: string}>} Error object if retrieval fails
 */
async function listAllProjects() {
  console.log('[Chat API Tool] 📋 Executing listAllProjects...');
  try {
    await dbConnect();
    const projects = await Project.find({})
      .select('title slug description')
      .sort({ createdAt: -1 })
      .lean();
    console.log(`[Chat API Tool] ✅ Retrieved ${projects.length} projects`);
    return projects.map((p) => ({ title: p.title, slug: p.slug, description: p.description }));
  } catch (error) {
    console.error('[Chat API Tool] ❌ Error in listAllProjects:', error);
    return { error: 'Failed to retrieve projects.' };
  }
}

/**
 * Retrieves complete details for a specific project by its slug.
 * Returns comprehensive information including category, tags, and full description.
 *
 * @async
 * @function getProjectDetails
 * @param {string} slug - The URL-friendly identifier of the project
 * @returns {Promise<Object>} Object containing complete project information
 * @returns {Promise<{error: string}>} Error object if project not found or retrieval fails
 */
async function getProjectDetails(slug) {
  console.log(`[Chat API Tool] 🔍 Executing getProjectDetails for slug: "${slug}"`);
  try {
    await dbConnect();
    const project = await Project.findOne({ slug }).lean();
    if (!project) {
      console.log(`[Chat API Tool] ⚠️ Project not found: "${slug}"`);
      return { error: 'Project not found' };
    }
    console.log(`[Chat API Tool] ✅ Retrieved project: "${project.title}"`);
    return {
      title: project.title,
      slug: project.slug,
      category: project.category,
      tagline: project.tagline,
      description: project.description,
      details: project.details,
      tags: project.tags?.map((t) => t.name || t) || [],
    };
  } catch (error) {
    console.error('[Chat API Tool] ❌ Error in getProjectDetails:', error);
    return { error: 'Failed to retrieve project details.' };
  }
}

/**
 * Retrieves a list of all published articles from the database.
 * Only returns articles with 'published' status, sorted by publication date.
 *
 * @async
 * @function listAllArticles
 * @returns {Promise<Array<{title: string, slug: string, excerpt: string}>>} Array of article objects with basic information
 * @returns {Promise<{error: string}>} Error object if retrieval fails
 */
async function listAllArticles() {
  console.log('[Chat API Tool] 📰 Executing listAllArticles...');
  try {
    await dbConnect();
    const articles = await Article.find({ status: 'published' })
      .select('title slug excerpt')
      .sort({ publishedAt: -1 })
      .lean();
    console.log(`[Chat API Tool] ✅ Retrieved ${articles.length} published articles`);
    return articles.map((a) => ({ title: a.title, slug: a.slug, excerpt: a.excerpt }));
  } catch (error) {
    console.error('[Chat API Tool] ❌ Error in listAllArticles:', error);
    return { error: 'Failed to retrieve articles.' };
  }
}

/**
 * Retrieves complete details for a specific published article by its slug.
 * Only returns articles with 'published' status.
 *
 * @async
 * @function getArticleDetails
 * @param {string} slug - The URL-friendly identifier of the article
 * @returns {Promise<{title: string, slug: string, content: string, tags: Array}>} Object containing complete article information
 * @returns {Promise<{error: string}>} Error object if article not found or retrieval fails
 */
async function getArticleDetails(slug) {
  console.log(`[Chat API Tool] 🔍 Executing getArticleDetails for slug: "${slug}"`);
  try {
    await dbConnect();
    const article = await Article.findOne({ slug, status: 'published' }).lean();
    if (!article) {
      console.log(`[Chat API Tool] ⚠️ Article not found: "${slug}"`);
      return { error: 'Article not found' };
    }
    console.log(`[Chat API Tool] ✅ Retrieved article: "${article.title}"`);
    return {
      title: article.title,
      slug: article.slug,
      content: article.content,
      tags: article.tags,
    };
  } catch (error) {
    console.error('[Chat API Tool] ❌ Error in getArticleDetails:', error);
    return { error: 'Failed to retrieve article details.' };
  }
}

/**
 * Performs an intelligent fuzzy search across all projects and articles.
 * Uses the unified search function to find content matching the query.
 *
 * @async
 * @function searchPortfolio
 * @param {string} query - The search keywords or phrase
 * @returns {Promise<Array|Object>} Array of search results or message/error object
 * @returns {Promise<{message: string}>} Message object if no results found
 * @returns {Promise<{error: string}>} Error object if search fails
 */
async function searchPortfolio(query) {
  console.log(`[Chat API Tool] 🔎 Executing searchPortfolio with query: "${query}"`);
  try {
    // *** THIS NOW USES THE UNIFIED SEARCH FUNCTION ***
    const results = await performSearch(query);
    if (results.length === 0) {
      console.log(`[Chat API Tool] ℹ️ No results found for: "${query}"`);
      return { message: `No results found for "${query}". Try different keywords.` };
    }
    console.log(`[Chat API Tool] ✅ Found ${results.length} results for: "${query}"`);
    // The AI can handle the flat array with a 'type' property just fine.
    return results;
  } catch (error) {
    console.error('[Chat API Tool] ❌ Error in searchPortfolio:', error);
    return { error: 'Search failed.' };
  }
}

/**
 * Routes and executes the appropriate tool function based on the tool call from the AI.
 * Acts as a dispatcher for all available chatbot tools.
 *
 * @async
 * @function executeToolCall
 * @param {Object} toolCall - The tool call object from OpenAI API
 * @param {Object} toolCall.function - Function details
 * @param {string} toolCall.function.name - Name of the function to execute
 * @param {string} toolCall.function.arguments - JSON string of function arguments
 * @returns {Promise<*>} Result from the executed tool function
 */
async function executeToolCall(toolCall) {
  const { name, arguments: args } = toolCall.function;
  const parsedArgs = JSON.parse(args);

  console.log(`[Chat API] 🔧 Executing tool: ${name}`, parsedArgs);

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
      console.error(`[Chat API] ❌ Unknown tool requested: ${name}`);
      return { error: 'Unknown tool', toolName: name };
  }
}

/**
 * Maps tool names to user-friendly status messages.
 * Returns dynamic status text based on the tool being executed.
 *
 * @function getToolStatusMessage
 * @param {string} toolName - Name of the tool being executed
 * @param {Object} args - Arguments passed to the tool
 * @returns {string} User-friendly status message
 */
function getToolStatusMessage(toolName, args) {
  switch (toolName) {
    case 'listAllProjects':
      return '🎨 Loading all projects...';
    case 'getProjectDetails':
      return `🔍 Getting details about the project...`;
    case 'listAllArticles':
      return '📚 Fetching blog articles...';
    case 'getArticleDetails':
      return `📖 Reading the article...`;
    case 'searchPortfolio':
      return `🔎 Searching for "${args.query}"...`;
    default:
      return '🤔 Processing your request...';
  }
}

// =================================================================================
// 3. MAIN API ROUTE (POST HANDLER)
// =================================================================================

/**
 * Handles POST requests to the chat API endpoint.
 * Processes user messages, manages conversation history, executes tool calls,
 * and streams AI responses back to the client.
 *
 * @async
 * @function POST
 * @param {Request} request - Next.js request object
 * @returns {Promise<NextResponse>} Streaming response with AI-generated content or JSON error response
 */
export async function POST(request) {
  console.log('\n[Chat API] 🚀 ======== NEW CHAT REQUEST ======== ');
  try {
    const { userMessage, chatHistory = [], sessionId, path = '/' } = await request.json();
    console.log('[Chat API] 📨 User message:', userMessage);
    console.log('[Chat API] 📍 Path:', path);
    console.log('[Chat API] 🔑 Session ID:', sessionId);
    console.log('[Chat API] 💬 Chat history length:', chatHistory.length);

    if (!userMessage) {
      console.error('[Chat API] ❌ No user message provided');
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    console.log('[Chat API] 🏗️ Building dynamic context...');
    const context = await buildDynamicContext();
    const actualModel = context.chatbotSettings.modelName || process.env.OPENAI_MODEL_NAME;
    console.log('[Chat API] ✅ Context built successfully');
    console.log('[Chat API] 🤖 AI Name:', context.chatbotSettings.aiName);
    console.log('[Chat API] ⚙️ Model:', actualModel);
    console.log('[Chat API] 🔌 Chatbot active:', context.chatbotSettings.isActive);

    if (!context.chatbotSettings.isActive) {
      console.warn('[Chat API] ⚠️ Chatbot is disabled');
      return NextResponse.json({ error: 'Chatbot is currently disabled' }, { status: 503 });
    }

    console.log('[Chat API] 📝 Building system messages...');
    const systemMessages = buildSystemMessages(context, path);
    const messages = [
      ...systemMessages,
      ...chatHistory.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userMessage },
    ];
    console.log('[Chat API] 📊 Total messages in conversation:', messages.length);

    let toolsUsed = [];
    console.log('[Chat API] 🎯 Sending initial completion request to OpenAI...');
    const initialCompletion = await openai.chat.completions.create({
      model: actualModel,
      messages: messages,
      tools: tools,
      tool_choice: 'auto',
    });

    const initialResponse = initialCompletion.choices[0].message;
    console.log('[Chat API] 📥 Initial response received');

    if (initialResponse.tool_calls) {
      console.log(`[Chat API] 🛠️ AI requested ${initialResponse.tool_calls.length} tool call(s)`);
      messages.push(initialResponse);
      for (const toolCall of initialResponse.tool_calls) {
        const toolResult = await executeToolCall(toolCall);
        console.log(`[Chat API] ✅ Tool ${toolCall.function.name} executed successfully`);
        toolsUsed.push({
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        });
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }
      console.log('[Chat API] 🔄 All tool calls completed, proceeding with final response');
    } else {
      console.log('[Chat API] ℹ️ No tool calls requested by AI');
    }

    console.log('[Chat API] 🌊 Starting streaming response...');
    const stream = new ReadableStream({
      async start(controller) {
        let assistantMessage = { content: '' };
        let chunkCount = 0;
        try {
          // Send tool status updates first if tools were used
          if (toolsUsed.length > 0) {
            for (const tool of toolsUsed) {
              const statusMessage = getToolStatusMessage(tool.name, tool.arguments);
              const statusData = JSON.stringify({ type: 'status', message: statusMessage }) + '\n';
              controller.enqueue(new TextEncoder().encode(statusData));
              console.log('[Chat API] 📢 Sent status:', statusMessage);
            }
          }
          const completion = await openai.chat.completions.create({
            model: actualModel,
            messages: messages,
            stream: true,
          });
          console.log('[Chat API] 📡 Stream established, receiving chunks...');

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              chunkCount++;
              assistantMessage.content += content;
              // Send content chunks as JSON data packets
              const contentData = JSON.stringify({ type: 'content', message: content }) + '\n';
              controller.enqueue(new TextEncoder().encode(contentData));
            }
          }
          console.log(`[Chat API] ✅ Stream completed. Total chunks: ${chunkCount}`);
          console.log(
            `[Chat API] 📝 Response length: ${assistantMessage.content.length} characters`
          );
          controller.close();
          // Analytics logic remains the same
          console.log('[Chat API] 💾 Saving analytics event...');
          const analyticsEvent = new Analytics({
            eventType: 'chatbot_interaction',
            path,
            sessionId,
            properties: {
              userQuestion: userMessage,
              toolsCount: toolsUsed.length,
              toolsUsed: toolsUsed.length ? toolsUsed : undefined,
            },
          });
          await analyticsEvent.save();
          console.log('[Chat API] ✅ Analytics saved successfully');
          console.log('[Chat API] 🏁 ======== REQUEST COMPLETE ======== \n');
        } catch (error) {
          console.error('[Chat API] ❌ Stream error:', error);
          controller.error(error);
        }
      },
    });

    console.log('[Chat API] 📤 Returning stream response');
    return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error) {
    console.error('[Chat API] 💥 FATAL ERROR:', error);
    console.error('[Chat API] Stack trace:', error.stack);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =================================================================================
// 4. UPDATED SYSTEM INSTRUCTIONS
// =================================================================================

/**
 * Builds system messages that define the AI's behavior and capabilities.
 * Creates context-aware instructions based on chatbot settings and current page.
 *
 * @function buildSystemMessages
 * @param {Object} context - Dynamic context object from context builder
 * @param {Object} context.chatbotSettings - Chatbot configuration settings
 * @param {string} context.chatbotSettings.aiName - Name of the AI assistant
 * @param {string} context.chatbotSettings.persona - AI personality description
 * @param {string} context.chatbotSettings.callToAction - CTA message for users
 * @param {Array<string>} context.chatbotSettings.rules - Behavioral rules for the AI
 * @param {string} path - Current page path the user is on
 * @returns {Array<{role: string, content: string}>} Array of system message objects
 */
function buildSystemMessages(context, path) {
  const { chatbotSettings } = context;
  const messages = [];

  messages.push({
    role: 'system',
    content: `You are ${chatbotSettings.aiName}. ${chatbotSettings.persona}. Your knowledge of projects and articles is limited; you must use tools to get information.`,
  });

  messages.push({
    role: 'system',
    content: `TOOL USAGE GUIDE:

1. FOR GENERAL LISTING (When a user wants to browse):
   - \`listAllProjects()\`: Use when asked "What projects do you have?" or "Show me your work."
   - \`listAllArticles()\`: Use when asked "What have you written?" or "Show me the blog."

2. FOR SPECIFIC DETAILS (When a user asks about ONE item):
   - \`getProjectDetails(slug)\`: Use this for a specific project.
   - \`getArticleDetails(slug)\`: Use this to get the full text of a specific article.

3. FOR KEYWORD SEARCHING (Most common use case):
   - \`searchPortfolio(query)\`: Use this for any topic-based questions like "Do you have experience with Python?" or "Tell me about your e-commerce projects."

CRITICAL: Do not make up information. If you don't know, use a tool.`,
  });

  messages.push({
    role: 'system',
    content: `GOAL: Convert visitors to clients by guiding them to the contact form using: "${chatbotSettings.callToAction}"
RULES: ${chatbotSettings.rules.join('. ')}`,
  });

  messages.push({
    role: 'system',
    content: `The user is currently on this page: "${path || '/'}"`,
  });

  return messages;
}
