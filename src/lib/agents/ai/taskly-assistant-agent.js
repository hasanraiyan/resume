import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createTasklyTools } from '../utils/taskly-tools';

function tryParseJson(value) {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function parseToolOutput(output) {
  if (!output) return null;

  if (Array.isArray(output)) {
    return output;
  }

  if (typeof output === 'string') {
    return tryParseJson(output);
  }

  if (typeof output !== 'object') {
    return null;
  }

  if (Array.isArray(output.messages)) {
    for (const message of output.messages) {
      const parsedMessage = parseToolOutput(message);
      if (parsedMessage) return parsedMessage;
    }
  }

  if (output.output) {
    const parsedOutput = parseToolOutput(output.output);
    if (parsedOutput) return parsedOutput;
  }

  if (output.content) {
    const parsedContent = parseToolOutput(output.content);
    if (parsedContent) return parsedContent;
  }

  if (output.kwargs?.content) {
    const parsedKwargsContent = parseToolOutput(output.kwargs.content);
    if (parsedKwargsContent) return parsedKwargsContent;
  }

  if (typeof output.text === 'string') {
    const parsedText = tryParseJson(output.text);
    if (parsedText) return parsedText;
  }

  if (typeof output.totalTasks === 'number' || Array.isArray(output.tasks)) {
    return output;
  }

  return null;
}

function getToolLabel(toolName) {
  const labels = {
    get_tasks: 'Reviewing tasks',
    get_projects: 'Checking projects',
    get_insights: 'Analyzing productivity',
  };

  return labels[toolName] || `Using ${toolName}`;
}

function buildUiBlocks(toolName, output) {
  const parsed = parseToolOutput(output);
  if (!parsed) return [];

  if (toolName === 'get_insights') {
    return [
      {
        kind: 'taskly_insights',
        title: 'Productivity Snapshot',
        action: { type: 'switch_tab', tab: 'insights', label: 'View full insights' },
        data: {
          totalTasks: parsed.totalTasks || 0,
          completedTasks: parsed.completedTasks || 0,
          completionRate: parsed.completionRate || 0,
          overdueTasks: parsed.overdueTasks || 0,
          dueTodayTasks: parsed.dueTodayTasks || 0,
          activeProjects: parsed.activeProjects || 0,
        },
      },
    ];
  }

  if (toolName === 'get_tasks' && Array.isArray(parsed)) {
    return [
      {
        kind: 'task_list',
        title: 'Your Tasks',
        action: { type: 'switch_tab', tab: 'tasks', label: 'Open tasks' },
        data: {
          items: parsed.slice(0, 6),
        },
      },
    ];
  }

  if (toolName === 'get_projects' && Array.isArray(parsed)) {
    return [
      {
        kind: 'project_list',
        title: 'Your Projects',
        action: { type: 'switch_tab', tab: 'projects', label: 'Open projects' },
        data: {
          items: parsed.slice(0, 6),
        },
      },
    ];
  }

  return [];
}

class TasklyAssistantAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.TASKLY_ASSISTANT, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Taskly Assistant initialized');
  }

  async _validateInput(input) {
    if (!input || !input.userMessage) {
      throw new Error('userMessage is required for Taskly Assistant');
    }
  }

  async *_onStreamExecute(input) {
    const { userMessage, chatHistory = [] } = input;

    const llm = await this.createChatModel();
    const persona = this.config.persona || '';
    const tasklyTools = createTasklyTools();

    this.logger.info(`[TOOLS] Created ${tasklyTools.length} tools:`);
    tasklyTools.forEach((tool, index) => {
      this.logger.info(
        `  Tool ${index + 1}: name="${tool.name}", description="${tool.description?.substring(0, 80)}..."`
      );
    });

    const systemMessage = new SystemMessage({
      content: `${persona}

You have access to real task and project data through tools. Use them to answer questions accurately.
Be concise and provide actionable insights, not just raw data.
When you use tools, the app may automatically show supporting UI cards for the user.`,
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
      tools: tasklyTools,
      messageModifier: async (msgs) => msgs,
    });

    this.logger.info(
      `[AGENT] Created ReactAgent with ${tasklyTools.length} tools, starting stream...`
    );

    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });
    const activeToolCalls = new Map();
    let fallbackToolCounter = 0;

    for await (const event of eventStream) {
      this.logger.info(
        `[EVENT] type="${event.event}", name="${event.name || 'N/A'}"`,
        JSON.stringify(event.data).substring(0, 200)
      );

      if (event.event === 'on_chat_model_stream' && event.data.chunk?.content) {
        yield { type: 'content', message: event.data.chunk.content };
      } else if (event.event === 'on_tool_start') {
        const toolCallId =
          event.run_id || event.data?.run_id || `${event.name}-${++fallbackToolCounter}`;
        activeToolCalls.set(toolCallId, event.name);

        yield {
          type: 'tool_start',
          toolName: event.name,
          toolCallId,
          label: getToolLabel(event.name),
        };
      } else if (event.event === 'on_tool_end') {
        this.logger.info(
          `[TOOL_RESULT] name="${event.name}", output length="${JSON.stringify(event.data.output || '').length}"`
        );

        const toolCallId = event.run_id || event.data?.run_id || null;
        const toolName = activeToolCalls.get(toolCallId) || event.name;
        const uiBlocks = buildUiBlocks(toolName, event.data.output);

        this.logger.info(
          `[UI_BLOCKS] tool="${toolName}", count=${uiBlocks.length}, parsed=${Boolean(parseToolOutput(event.data.output))}`
        );

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
        };

        if (toolCallId) {
          activeToolCalls.delete(toolCallId);
        }
      }
    }
  }

  async _onExecute(input) {
    throw new Error('TasklyAssistantAgent only supports streamExecute');
  }
}

export default TasklyAssistantAgent;
