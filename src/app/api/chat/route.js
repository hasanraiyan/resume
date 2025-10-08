import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildDynamicContext } from '../../../lib/ai/context-builder';
import Analytics from '../../../models/Analytics';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Article from '@/models/Article';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// Define tools available to the AI
const tools = [
  {
    type: 'function',
    function: {
      name: 'getProjectDetails',
      description:
        'Retrieves detailed information about a specific project by its slug. Use this when a user asks specific questions about a named project, such as results achieved, technical challenges, client details, or role played.',
      parameters: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description:
              'The URL slug of the project (e.g., "luxury-fashion-store", "analytics-dashboard"). Convert project names to lowercase with hyphens.',
          },
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
        'Searches across all projects and articles for relevant content based on a query. Use this for broad questions about technologies, domains, or finding multiple relevant projects/articles. Returns a ranked list of results.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'The search query (e.g., "e-commerce projects", "React experience", "machine learning")',
          },
        },
        required: ['query'],
      },
    },
  },
];

// Tool execution functions
async function getProjectDetails(slug) {
  try {
    await dbConnect();
    const project = await Project.findOne({ slug }).lean();

    if (!project) {
      return {
        error: 'Project not found',
        slug: slug,
        suggestion: 'Try using searchPortfolio to find relevant projects.',
      };
    }

    // Return structured project data
    return {
      title: project.title,
      slug: project.slug,
      category: project.category,
      tagline: project.tagline,
      description: project.description,
      fullDescription: project.fullDescription,
      details: {
        client: project.details?.client || 'Not specified',
        year: project.details?.year || 'Not specified',
        duration: project.details?.duration || 'Not specified',
        role: project.details?.role || 'Not specified',
        challenge: project.details?.challenge || 'Not specified',
        solution: project.details?.solution || 'Not specified',
        results: project.details?.results || [],
      },
      tags: project.tags?.map((t) => t.name || t) || [],
      links: project.links || {},
    };
  } catch (error) {
    console.error('Error in getProjectDetails:', error);
    return {
      error: 'Failed to retrieve project details',
      message: error.message,
    };
  }
}

async function searchPortfolio(query) {
  try {
    await dbConnect();

    // Execute parallel searches with text indexing
    const [projectResults, articleResults] = await Promise.all([
      Project.find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
        .select('slug title description category tags tagline')
        .sort({ score: { $meta: 'textScore' } })
        .limit(5)
        .lean(),

      Article.find(
        {
          $text: { $search: query },
          status: 'published',
        },
        { score: { $meta: 'textScore' } }
      )
        .select('slug title excerpt tags')
        .sort({ score: { $meta: 'textScore' } })
        .limit(5)
        .lean(),
    ]);

    // Format results
    const results = {
      query,
      totalResults: projectResults.length + articleResults.length,
      projects: projectResults.map((p) => ({
        title: p.title,
        slug: p.slug,
        category: p.category,
        tagline: p.tagline,
        description: p.description,
        tags: p.tags?.map((t) => t.name || t) || [],
      })),
      articles: articleResults.map((a) => ({
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        tags: a.tags?.map((t) => t.name || t) || [],
      })),
    };

    if (results.totalResults === 0) {
      return {
        ...results,
        message:
          'No results found for this query. Try different keywords or ask about specific technologies.',
      };
    }

    return results;
  } catch (error) {
    console.error('Error in searchPortfolio:', error);
    return {
      error: 'Search failed',
      message: error.message,
      query,
    };
  }
}

// Execute tool calls
async function executeToolCall(toolCall) {
  const { name, arguments: args } = toolCall.function;
  const parsedArgs = JSON.parse(args);

  switch (name) {
    case 'getProjectDetails':
      return await getProjectDetails(parsedArgs.slug);
    case 'searchPortfolio':
      return await searchPortfolio(parsedArgs.query);
    default:
      return { error: 'Unknown tool', toolName: name };
  }
}

export async function POST(request) {
  try {
    const { userMessage, chatHistory = [], sessionId, path = '/' } = await request.json();

    if (!userMessage) {
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    // Build dynamic context from database
    const context = await buildDynamicContext();

    // Check if chatbot is active
    if (!context.chatbotSettings.isActive) {
      return NextResponse.json({ error: 'Chatbot is currently disabled' }, { status: 503 });
    }

    // Build system messages as an array (to stay under character limits)
    const systemMessages = buildSystemMessages(context, path);

    // Prepare messages for OpenAI
    const messages = [
      ...systemMessages,
      ...chatHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    // Track tool usage for analytics
    let toolsUsed = [];
    let toolResults = [];

    // STEP 1: Make initial API call with tools
    console.log('🔧 Step 1: Sending request with tools enabled');
    const initialCompletion = await openai.chat.completions.create({
      model: context.chatbotSettings.modelName || process.env.OPENAI_MODEL_NAME,
      messages: messages,
      tools: tools,
      tool_choice: 'auto',
      max_tokens: 1000,
      temperature: 0.7,
    });

    const initialResponse = initialCompletion.choices[0].message;

    // STEP 2: Check if model wants to use tools
    if (initialResponse.tool_calls && initialResponse.tool_calls.length > 0) {
      console.log('🔧 Step 2: Model requested tool calls:', initialResponse.tool_calls.length);

      // Add the assistant's response (with tool calls) to messages
      messages.push(initialResponse);

      // STEP 3: Execute all tool calls
      for (const toolCall of initialResponse.tool_calls) {
        console.log(
          '🔧 Executing tool:',
          toolCall.function.name,
          'with args:',
          toolCall.function.arguments
        );

        const toolResult = await executeToolCall(toolCall);
        toolsUsed.push({
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        });
        toolResults.push(toolResult);

        // Add tool result to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }

      console.log('🔧 Step 4: Making second API call with tool results');
    }

    // STEP 4/5: Create final streaming response (with or without tool results)
    const stream = new ReadableStream({
      async start(controller) {
        let assistantMessage = { content: '' };

        try {
          const completion = await openai.chat.completions.create({
            model: context.chatbotSettings.modelName || process.env.OPENAI_MODEL_NAME,
            messages: messages,
            max_tokens: 800,
            temperature: 0.7,
            stream: true,
          });

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              assistantMessage.content += content;
              controller.enqueue(new TextEncoder().encode(content));
            }
          }

          controller.close();

          // Save analytics after successful completion
          try {
            const finalAssistantResponse = assistantMessage.content;
            const isCallToActionTriggered = finalAssistantResponse.includes(
              context.chatbotSettings.callToAction
            );

            const analyticsEvent = new Analytics({
              eventType: 'chatbot_interaction',
              eventName: 'chatbot_message_sent',
              path: path || '/chat',
              sessionId: sessionId || 'unknown_session',
              properties: {
                chatbotName: context.chatbotSettings.aiName,
                modelName: context.chatbotSettings.modelName || process.env.OPENAI_MODEL_NAME,
                userQuestion: userMessage,
                conversationLength: chatHistory.length + 1,
                isCallToAction: isCallToActionTriggered,
                hasPageContext: false, // Removed page scraping
                pageContextLength: 0, // Removed page scraping
                chatHistoryLength: chatHistory.length,
                // Tool usage tracking
                toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
                toolsCount: toolsUsed.length,
                toolResults:
                  toolsUsed.length > 0
                    ? toolResults.map((r) => ({
                        hasError: !!r.error,
                        resultSize: JSON.stringify(r).length,
                      }))
                    : undefined,
                timestamp: new Date().toISOString(),
              },
            });

            await analyticsEvent.save();
            console.log('✅ Chatbot analytics saved with tool usage:', toolsUsed.length);
          } catch (analyticsError) {
            console.error('❌ Error saving chatbot analytics:', analyticsError);
          }
        } catch (error) {
          console.error('❌ OpenAI API error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('❌ Chat API error:', error);

    // Handle specific OpenAI errors
    if (error.status === 401) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildSystemMessages(context, path) {
  const { coreIdentity, aboutSummary, projectOverview, articleOverview, chatbotSettings } = context;

  // Split system instructions into multiple messages to stay under character limits
  const messages = [];

  // Message 1: Identity and core knowledge
  messages.push({
    role: 'system',
    content: `You are ${chatbotSettings.aiName}. ${chatbotSettings.persona}

KNOWLEDGE:
- About: ${aboutSummary}
- Services: ${chatbotSettings.servicesOffered}
- Projects: ${projectOverview.substring(0, 800)}
- Articles: ${articleOverview.substring(0, 400)}`,
  });

  // Message 2: Tool usage instructions
  messages.push({
    role: 'system',
    content: `TOOLS AVAILABLE:

1. getProjectDetails(slug) - For SPECIFIC project questions
   - Use when user asks about a named project
   - Returns: description, client, role, challenge, solution, results
   - Example: "What were results of Analytics Dashboard?" → getProjectDetails("analytics-dashboard")

2. searchPortfolio(query) - For BROAD questions
   - Use for tech/domain searches
   - Example: "Show React projects" → searchPortfolio("react")

CRITICAL: Always use tools instead of guessing. Trust tool data 100%.`,
  });

  // Message 3: Rules and directive
  messages.push({
    role: 'system',
    content: `GOAL: Convert visitors to clients. Guide them to contact using: "${chatbotSettings.callToAction}"

RULES: ${chatbotSettings.rules.join('. ')}`,
  });

  // Message 4: Current page context (for awareness)
  messages.push({
    role: 'system',
    content: `CURRENT PAGE: User is viewing "${path || '/'}" - use this to provide relevant context in responses.`,
  });

  return messages;
}
