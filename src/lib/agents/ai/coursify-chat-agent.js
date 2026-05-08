import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { createCoursifyTools } from '../utils/coursify-tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';

function buildSystemPrompt({ courseTitle, currentSectionTitle, currentSectionSummary }) {
  let prompt = `You are a helpful, friendly learning assistant for the Coursify platform. You are specifically helping a learner study the course: "${courseTitle}".

Your role:
- Explain concepts from the course in clear, accessible language
- Answer questions about course material using your tools to fetch the relevant content
- Help learners understand difficult sections
- Suggest related sections when relevant
- Encourage and support the learner's progress

IMPORTANT RULES:
1. Only discuss content from this course. For unrelated questions, gently redirect back to the course.
2. Always use tools to fetch section content before explaining — do not make up course content.
3. Keep explanations concise and practical.
4. Use markdown formatting for clarity (code blocks, bullet points, etc).`;

  if (currentSectionTitle) {
    prompt += `\n\nCURRENT CONTEXT: The learner is currently reading the section titled "${currentSectionTitle}".`;
    if (currentSectionSummary) {
      prompt += ` Summary: ${currentSectionSummary}`;
    }
    prompt += `\n\nWhen questions seem to relate to this section, use get_section_content with the appropriate ID from the outline first.`;
  }

  return prompt;
}

class CoursifyChatAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.COURSIFY_CHAT, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Coursify Chat Agent initialized');
  }

  async _validateInput(input) {
    if (!input?.userMessage) throw new Error('userMessage is required');
    if (!input?.courseId) throw new Error('courseId is required');
  }

  async *_onStreamExecute(input) {
    const {
      userMessage,
      chatHistory = [],
      courseId,
      courseTitle = 'this course',
      currentSectionTitle = '',
      currentSectionSummary = '',
      currentSectionId = '',
    } = input;

    const llm = await this.createChatModel();
    const tools = createCoursifyTools(courseId);

    const systemPrompt = buildSystemPrompt({
      courseTitle,
      currentSectionTitle,
      currentSectionSummary,
    });

    const filteredHistory = chatHistory.filter((msg) => msg && msg.role);
    const messages = [
      new SystemMessage({ content: systemPrompt }),
      ...filteredHistory.map((msg) => {
        if (msg.role === 'user') return new HumanMessage({ content: msg.content || '' });
        if (msg.role === 'assistant') {
          const params = { content: msg.content || '' };
          if (msg.tool_calls?.length) {
            params.tool_calls = msg.tool_calls.map((tc) => ({
              id: tc.id || `tc-${Math.random()}`,
              name: tc.function?.name || 'unknown',
              args:
                typeof tc.function?.arguments === 'string'
                  ? (() => {
                      try {
                        return JSON.parse(tc.function.arguments);
                      } catch {
                        return {};
                      }
                    })()
                  : tc.function?.arguments || {},
            }));
          }
          return new AIMessage(params);
        }
        if (msg.role === 'tool') {
          return new ToolMessage({
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            name: msg.name || 'unknown',
            tool_call_id: msg.tool_call_id || 'unknown-id',
          });
        }
        return new SystemMessage({ content: msg.content || '' });
      }),
      new HumanMessage({ content: userMessage }),
    ];

    const agent = createReactAgent({
      llm,
      tools,
    });

    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });

    for await (const event of eventStream) {
      const { event: type, data, name } = event;

      if (type === 'on_chat_model_stream' && data.chunk?.content) {
        yield { type: 'content', message: data.chunk.content };
      } else if (type === 'on_tool_start' && name !== 'agent') {
        const statusMap = {
          get_course_outline: 'Loading course outline...',
          get_section_content: 'Reading section content...',
          search_course_sections: 'Searching course sections...',
        };
        yield { type: 'status', message: statusMap[name] || `⚙️ Running ${name}...` };
      } else if (type === 'on_tool_end' && name !== 'agent') {
        yield {
          type: 'tool_result',
          tool_call_id: event.run_id,
          name,
          content: typeof data.output === 'string' ? data.output : JSON.stringify(data.output),
        };
      } else if (type === 'on_chat_model_end') {
        const aiMessage = data.output;
        if (aiMessage?.tool_calls?.length > 0) {
          yield {
            type: 'metadata',
            tool_calls: aiMessage.tool_calls.map((tc) => ({
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: JSON.stringify(tc.args) },
            })),
          };
        }
      }
    }
  }

  async _onExecute() {
    throw new Error('CoursifyChatAgent only supports streamExecute');
  }
}

export default CoursifyChatAgent;
