import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createJournalyTools } from '../utils/journaly-tools';

function tryParseJson(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function normalizeToolInput(rawInput) {
  if (!rawInput) return {};
  if (typeof rawInput === 'string') return tryParseJson(rawInput) || {};
  if (typeof rawInput !== 'object') return {};
  if (typeof rawInput.input === 'string') return tryParseJson(rawInput.input) || {};
  return rawInput.input && typeof rawInput.input === 'object' ? rawInput.input : rawInput;
}

function parseToolOutput(output) {
  if (!output) return null;
  if (Array.isArray(output)) return output;
  if (typeof output === 'string') return tryParseJson(output);
  if (typeof output !== 'object') return null;
  if (Array.isArray(output.messages)) {
    for (const msg of output.messages) {
      const p = parseToolOutput(msg);
      if (p) return p;
    }
  }
  if (output.output) return parseToolOutput(output.output);
  if (output.content) return parseToolOutput(output.content);
  return null;
}

function getToolLabel(toolName) {
  const labels = {
    search_entries: 'Searching journal entries',
    get_entries_by_date_range: 'Fetching entries by date',
    get_entry_by_id: 'Reading entry details',
    get_mood_summary: 'Analyzing mood and stats',
  };
  return labels[toolName] || `Using ${toolName}`;
}

function shouldRenderGui(toolName, toolArgs = {}) {
  return toolArgs?.presentation === 'card' || toolArgs?.isGui === true;
}

function buildUiBlocks(toolName, output, toolArgs = {}) {
  if (!shouldRenderGui(toolName, toolArgs)) return [];
  const parsed = parseToolOutput(output);
  if (!parsed) return [];

  if (toolName === 'search_entries' || toolName === 'get_entries_by_date_range') {
    return [
      {
        kind: 'entry_list',
        title: toolName === 'search_entries' ? 'Search Results' : 'Journal Entries',
        data: { items: Array.isArray(parsed) ? parsed : [] },
      },
    ];
  }

  if (toolName === 'get_mood_summary') {
    return [
      {
        kind: 'mood_insights',
        title: 'Journal Insights',
        data: parsed,
      },
    ];
  }

  if (toolName === 'get_entry_by_id') {
    return [
      {
        kind: 'entry_detail',
        title: 'Journal Entry',
        data: parsed,
      },
    ];
  }

  return [];
}

class JournalyAssistantAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.JOURNALY_ASSISTANT || 'journaly-assistant', config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Journaly Assistant initialized');
  }

  async _validateInput(input) {
    if (!input || !input.userMessage) {
      throw new Error('userMessage is required');
    }
  }

  async *_onStreamExecute(input) {
    const { userMessage, chatHistory = [], now } = input;
    const llm = await this.createChatModel();
    const persona = this.config.persona || 'You are Journaly AI, a helpful and reflective assistant for a personal journal app. You help users explore their past entries, find patterns in their moods, and recall memories.';
    const tools = createJournalyTools();
    const currentTimeIso = now || new Date().toISOString();

    const systemMessage = new SystemMessage({
      content: `${persona}
Current date/time (ISO): ${currentTimeIso}
You have access to the user's journal through tools. Use them to answer questions accurately.
When you use tools, you can request a visual UI card by setting presentation="card" if it helps the user see a list or summary.
Otherwise, respond in natural, supportive, and reflective language.`,
    });

    const messages = [
      systemMessage,
      ...chatHistory.map((msg) => {
        if (msg.role === 'user') return new HumanMessage({ content: msg.content || '' });
        if (msg.role === 'assistant') return new AIMessage({ content: msg.content || '' });
        return new HumanMessage({ content: msg.content || '' });
      }),
      new HumanMessage({ content: userMessage }),
    ];

    const agent = createReactAgent({
      llm,
      tools,
    });

    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });
    const activeToolCalls = new Map();

    for await (const event of eventStream) {
      if (event.event === 'on_chat_model_stream' && event.data.chunk?.content) {
        yield { type: 'content', message: event.data.chunk.content };
      } else if (event.event === 'on_tool_start') {
        const toolCallId = event.run_id || `${event.name}-${Date.now()}`;
        const normalizedInput = normalizeToolInput(event.data?.input || event.data?.inputs || {});
        activeToolCalls.set(toolCallId, { name: event.name, input: normalizedInput });

        yield {
          type: 'tool_start',
          toolName: event.name,
          toolCallId,
          label: getToolLabel(event.name),
          guiRequested: shouldRenderGui(event.name, normalizedInput),
        };
      } else if (event.event === 'on_tool_end') {
        const toolCallId = event.run_id;
        const toolCallMeta = activeToolCalls.get(toolCallId);
        const toolName = toolCallMeta?.name || event.name;
        const toolInput = toolCallMeta?.input || {};
        const uiBlocks = buildUiBlocks(toolName, event.data.output, toolInput);

        yield {
          type: 'tool_result',
          name: toolName,
          toolCallId,
          output: event.data.output,
        };

        yield {
          type: 'tool_end',
          toolName,
          toolCallId,
          uiBlocks,
          guiRequested: shouldRenderGui(toolName, toolInput),
          guiRendered: uiBlocks.length > 0,
        };
        if (toolCallId) activeToolCalls.delete(toolCallId);
      }
    }
  }

  async _onExecute() {
    throw new Error('Only streamExecute is supported');
  }
}

export default JournalyAssistantAgent;
