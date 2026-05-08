import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { createAllCoursifyTools } from '../utils/coursify-tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

const TOOL_STATUS_MESSAGES = {
  search_courses: '🔍 Searching course catalog...',
  list_courses: '📚 Loading available courses...',
  get_course_outline: '📋 Loading course outline...',
  get_section_content: '📖 Reading section content...',
  search_course_sections: '🔍 Searching course sections...',
};

function buildSystemPrompt({ courseTitle, currentSectionTitle, currentSectionSummary }) {
  if (!courseTitle) {
    return `You are a helpful, friendly learning assistant for Coursify — a platform with free courses to learn and grow.

Your role:
- Help users discover courses that match their interests and goals
- Answer questions about what courses are available using your tools
- Recommend courses based on skill level or topic
- Provide links to courses so users can start learning

RULES:
1. Always use search_courses or list_courses to fetch real data — never invent course names.
2. When recommending courses, include the URL so the user can navigate directly.
3. Keep responses concise and encouraging.
4. Use markdown formatting (bullet points, bold titles, links).`;
  }

  let prompt = `You are a helpful, friendly learning assistant for the Coursify platform. You are helping a learner study: **"${courseTitle}"**.

Your role:
- Explain concepts from the course in clear, accessible language
- Answer questions using your tools to fetch the actual course content
- Help learners understand difficult sections
- Suggest related sections when relevant
- Encourage and support the learner's progress

RULES:
1. Always use tools to fetch content before explaining — never make up course material.
2. Keep explanations concise and practical.
3. Use markdown formatting for clarity (code blocks, bullet points, etc).
4. You also have search_courses and list_courses available if the learner asks about other courses.`;

  if (currentSectionTitle) {
    prompt += `\n\nCURRENT SECTION: The learner is reading **"${currentSectionTitle}"**.`;
    if (currentSectionSummary) prompt += ` (${currentSectionSummary})`;
    prompt += `\nFor questions about this section, call get_course_outline first to get the section ID, then get_section_content.`;
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
  }

  async *_onStreamExecute(input) {
    const {
      userMessage,
      chatHistory = [],
      courseId = null,
      courseTitle = '',
      currentSectionTitle = '',
      currentSectionSummary = '',
    } = input;

    const llm = await this.createChatModel();
    const tools = createAllCoursifyTools(courseId || null);

    const systemPrompt = buildSystemPrompt({
      courseTitle,
      currentSectionTitle,
      currentSectionSummary,
    });

    // Only keep user/assistant content messages — strip tool results and tool_calls.
    // Tools are idempotent DB reads, so re-fetching each turn is fine and avoids
    // the "tool message without preceding tool_calls" error on Azure OpenAI.
    const filteredHistory = chatHistory.filter(
      (msg) =>
        msg &&
        (msg.role === 'user' || msg.role === 'assistant') &&
        !msg.hidden &&
        msg.content?.trim()
    );

    const messages = [
      new SystemMessage({ content: systemPrompt }),
      ...filteredHistory.map((msg) =>
        msg.role === 'user'
          ? new HumanMessage({ content: msg.content || '' })
          : new AIMessage({ content: msg.content || '' })
      ),
      new HumanMessage({ content: userMessage }),
    ];

    const agent = createReactAgent({ llm, tools });
    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });

    for await (const event of eventStream) {
      const { event: type, data, name } = event;

      if (type === 'on_chat_model_stream' && data.chunk?.content) {
        yield { type: 'content', message: data.chunk.content };
      } else if (type === 'on_tool_start' && name !== 'agent') {
        yield { type: 'status', message: TOOL_STATUS_MESSAGES[name] || `⚙️ Running ${name}...` };
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
