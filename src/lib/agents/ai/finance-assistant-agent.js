import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createFinanceTools } from '../utils/finance-tools';

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

  if (
    typeof output.totalIncome === 'number' ||
    typeof output.totalExpense === 'number' ||
    Array.isArray(output.topExpenseCategories)
  ) {
    return output;
  }

  return null;
}

function getToolLabel(toolName) {
  const labels = {
    get_analysis: 'Analyzing your finances',
    get_transactions: 'Reviewing transactions',
    get_accounts: 'Checking accounts',
    get_categories: 'Reviewing categories',
    build_finance_ui: 'Designing the finance view',
  };

  return labels[toolName] || `Using ${toolName}`;
}

function buildUiBlocks(toolName, output) {
  const parsed = parseToolOutput(output);
  if (!parsed) return [];

  if (toolName === 'get_analysis') {
    return [
      {
        kind: 'summary_cards',
        title: 'Financial snapshot',
        action: { type: 'switch_tab', tab: 'analysis', label: 'Open analysis' },
        data: {
          totalIncome: parsed.totalIncome || 0,
          totalExpense: parsed.totalExpense || 0,
          netFlow: parsed.netFlow || 0,
          totalAccountBalance: parsed.totalAccountBalance || 0,
        },
      },
      {
        kind: 'category_breakdown',
        title: 'Top spending categories',
        action: { type: 'switch_tab', tab: 'analysis', label: 'View breakdown' },
        data: {
          mode: 'totals',
          items: parsed.topExpenseCategories || [],
        },
      },
    ].filter((block) => {
      if (block.kind === 'category_breakdown') {
        return block.data.items.length > 0;
      }

      return true;
    });
  }

  if (toolName === 'get_transactions' && Array.isArray(parsed)) {
    return [
      {
        kind: 'transaction_list',
        title: 'Matching transactions',
        action: { type: 'switch_tab', tab: 'records', label: 'Open records' },
        data: {
          items: parsed.slice(0, 6),
        },
      },
    ];
  }

  if (toolName === 'get_accounts' && Array.isArray(parsed)) {
    return [
      {
        kind: 'accounts_snapshot',
        title: 'Account balances',
        action: { type: 'switch_tab', tab: 'accounts', label: 'Open accounts' },
        data: {
          items: parsed.slice(0, 6),
        },
      },
    ];
  }

  if (toolName === 'get_categories' && Array.isArray(parsed)) {
    const income = parsed.filter((item) => item.type === 'income');
    const expense = parsed.filter((item) => item.type === 'expense');

    return [
      {
        kind: 'category_breakdown',
        title: 'Category setup',
        action: { type: 'switch_tab', tab: 'categories', label: 'Open categories' },
        data: {
          mode: 'groups',
          income,
          expense,
        },
      },
    ];
  }

  return [];
}

class FinanceAssistantAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.FINANCE_ASSISTANT, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Finance Assistant initialized');
  }

  async _validateInput(input) {
    if (!input || !input.userMessage) {
      throw new Error('userMessage is required for Finance Assistant');
    }
  }

  async *_onStreamExecute(input) {
    const { userMessage, chatHistory = [] } = input;

    const llm = await this.createChatModel();
    const persona = this.config.persona || '';
    const financeTools = createFinanceTools();

    this.logger.info(`[TOOLS] Created ${financeTools.length} tools:`);
    financeTools.forEach((tool, index) => {
      this.logger.info(
        `  Tool ${index + 1}: name="${tool.name}", description="${tool.description?.substring(0, 80)}..."`
      );
    });

    const systemMessage = new SystemMessage({
      content: `${persona}

You have access to real financial data through tools. Use them to answer questions accurately.
Format currency amounts with \u20B9 symbol and Indian number format (e.g., \u20B91,50,000).
Be concise and provide actionable insights, not just raw data.

The chat UI can render rich finance components (cards, tables, account snapshots) directly inside your reply bubble.
When tools return structured data, you should:
- Let the UI blocks present the raw numbers visually.
- Use your written response to explain what the user is seeing, call out important patterns, and suggest clear next steps.
- Only ask for more tool calls when they are needed to answer the user.

You also have a dedicated tool called "build_finance_ui" that lets you design which finance UI blocks to show. Typical pattern:
- First, use data tools (get_accounts, get_transactions, get_analysis, get_categories) to fetch any missing information.
- Then, call build_finance_ui with 1-3 blocks that best visualize the answer (for example, an accounts_snapshot block plus a summary_cards block).
Always base the numbers in those blocks on real tool outputs, not guesses.

Avoid repeating all numbers in text if they are already visible in the UI cards. Focus your words on interpretation and guidance.`,
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
      tools: financeTools,
      messageModifier: async (msgs) => msgs,
    });

    this.logger.info(
      `[AGENT] Created ReactAgent with ${financeTools.length} tools, starting stream...`
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

        let uiBlocks = [];

        if (toolName === 'build_finance_ui') {
          const parsed = parseToolOutput(event.data.output) || {};
          if (Array.isArray(parsed.blocks)) {
            // Lightweight validation to ensure only supported block kinds/tabs are rendered.
            const allowedKinds = new Set([
              'summary_cards',
              'transaction_list',
              'accounts_snapshot',
              'category_breakdown',
            ]);
            const allowedTabs = new Set(['accounts', 'records', 'analysis', 'categories']);

            uiBlocks = parsed.blocks
              .slice(0, 4)
              .filter((block) => block && typeof block === 'object')
              .map((block) => {
                const kind = allowedKinds.has(block.kind) ? block.kind : null;
                if (!kind) return null;

                const safeBlock = {
                  kind,
                  title:
                    typeof block.title === 'string' && block.title.trim()
                      ? block.title.trim()
                      : 'Finance overview',
                  data: typeof block.data === 'object' && block.data ? block.data : {},
                };

                if (
                  block.action &&
                  block.action.type === 'switch_tab' &&
                  allowedTabs.has(block.action.tab)
                ) {
                  safeBlock.action = {
                    type: 'switch_tab',
                    tab: block.action.tab,
                    label:
                      typeof block.action.label === 'string' && block.action.label.trim()
                        ? block.action.label.trim()
                        : 'Open details',
                  };
                }

                return safeBlock;
              })
              .filter(Boolean);
          }
        } else {
          uiBlocks = buildUiBlocks(toolName, event.data.output);
        }

        this.logger.info(
          `[UI_BLOCKS] tool="${toolName}", count=${uiBlocks.length}, parsed=${Boolean(
            parseToolOutput(event.data.output)
          )}`
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
    throw new Error('FinanceAssistantAgent only supports streamExecute');
  }
}

export default FinanceAssistantAgent;
