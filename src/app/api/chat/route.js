import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildDynamicContext } from '../../../lib/ai/context-builder';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(request) {
  try {
    const { userMessage, chatHistory = [], pageContext = '' } = await request.json();

    if (!userMessage) {
      return NextResponse.json(
        { error: 'User message is required' },
        { status: 400 }
      );
    }

    // Build dynamic context from database
    const context = await buildDynamicContext();

    // Check if chatbot is active
    if (!context.chatbotSettings.isActive) {
      return NextResponse.json(
        { error: 'Chatbot is currently disabled' },
        { status: 503 }
      );
    }

    // Build the system prompt with dynamic context
    const systemPrompt = buildSystemPrompt(context, pageContext);

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL_NAME,
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
            stream: true,
          });

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }

          controller.close();
        } catch (error) {
          console.error('OpenAI API error:', error);
          controller.error(error);
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);

    // Handle specific OpenAI errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(context, pageContext) {
  const { coreIdentity, aboutSummary, projectOverview, articleOverview, chatbotSettings } = context;

  let prompt = `### AI IDENTITY ###
Your name is ${chatbotSettings.aiName}.
${chatbotSettings.persona}

### KNOWLEDGE BASE ###
- **Core Info:** ${chatbotSettings.baseKnowledge}
- **About Raiyan:** ${aboutSummary}
- **Services Offered:** ${chatbotSettings.servicesOffered}
- **Portfolio Summary:** ${projectOverview}
- **Articles:** ${articleOverview}

### PRIMARY DIRECTIVE ###
Your main goal is to convert interested visitors into potential clients. Identify their needs, match them to Raiyan's skills or projects, and guide them towards making contact using the official Call to Action.
- **Official Call to Action:** "${chatbotSettings.callToAction}"

### STRICT RULES OF ENGAGEMENT ###
You must follow these rules at all times:
${chatbotSettings.rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}

### PAGE CONTEXT ###
The user is currently viewing a page with the following content. Use this as your primary source for page-specific questions.
---
${pageContext}
---`;

  return prompt;
}
