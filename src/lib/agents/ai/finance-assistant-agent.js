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

function normalizeToolInput(rawInput) {
  if (!rawInput) return {};

  if (typeof rawInput === 'string') {
    return tryParseJson(rawInput) || {};
  }

  if (typeof rawInput !== 'object') {
    return {};
  }

  if (typeof rawInput.input === 'string') {
    return tryParseJson(rawInput.input) || {};
  }

  if (rawInput.input && typeof rawInput.input === 'object') {
    return rawInput.input;
  }

  return rawInput;
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
    draft_transaction: 'Drafting transaction',
  };

  return labels[toolName] || `Using ${toolName}`;
}

function shouldRenderGui(toolName, toolArgs = {}) {
  if (toolName === 'draft_transaction') return true;
  if (toolArgs?.presentation === 'card') return true;
  return toolArgs?.isGui === true;
}

function buildUiBlocks(toolName, output, toolArgs = {}) {
  if (!shouldRenderGui(toolName, toolArgs)) {
    return [];
  }

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

  if (toolName === 'draft_transaction') {
    return [
      {
        kind: 'transaction_confirmation',
        title: 'Confirm Transaction',
        action: null,
        data: parsed,
      },
    ];
  }

  return [];
}

function pushToolInput(queueMap, toolName, input) {
  const existing = queueMap.get(toolName) || [];
  existing.push(input);
  queueMap.set(toolName, existing);
}

function shiftToolInput(queueMap, toolName) {
  const existing = queueMap.get(toolName) || [];
  if (existing.length === 0) return {};
  const next = existing.shift() || {};
  if (existing.length === 0) {
    queueMap.delete(toolName);
  } else {
    queueMap.set(toolName, existing);
  }
  return next;
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
When you use tools, the app may automatically show supporting finance UI cards for the user.
Only enable finance UI cards when they clearly add value and the user explicitly wants something shown, listed, displayed, browsed, or visualized.
For read-only tools (get_accounts, get_categories, get_transactions, get_analysis), prefer presentation="card" when the user is asking for a visual list, snapshot, or breakdown.
Prefer presentation="text" when the user just wants a normal conversational answer.
The old isGui flag still works, but presentation is preferred because it better captures the use case.
draft_transaction does not need presentation and should still produce its confirmation UI automatically.

Use these UI intent rules:
- If the user says "show", "display", "list", "open", "visualize", "breakdown", or asks for a snapshot, prefer presentation="card".
- If the user asks a direct question like "how much did I spend?", "what is my balance?", or "which category is highest?", prefer presentation="text" unless they also ask to see it.
- Do not request a card just because you used a tool. Request a card only when the user-facing answer benefits from it.

When the user is trying to record, add, log, save, or draft a transaction, follow this workflow strictly:
- Identify whether it is income, expense, or transfer.
- Collect all required details before calling draft_transaction.
- Required for every draft: type, amount, and source account.
- Required for income and expense: category.
- Required for transfers: destination account.
- Date may default to today only when the user did not specify another date.
- Description is optional unless the user naturally provides it.
- Ask only one missing follow-up question per turn.
- Never guess missing details from history or prior patterns.
- Users will provide account names and category names, not IDs. You must resolve them using tools.
- Use get_accounts to resolve accountId and toAccountId from account names.
- Use get_categories to resolve categoryId from category names for income and expense.
- If there is no exact single match, ask a clarification question and do not draft yet.
- Never invent IDs, never use placeholders, and never pass raw user text as an ID.
- Only call draft_transaction after every required ID has been resolved from tool output.
- When calling draft_transaction, set accountResolvedViaTool=true after resolving accountId with get_accounts.
- For income or expense, set categoryResolvedViaTool=true only after resolving categoryId with get_categories.
- For transfers, set toAccountResolvedViaTool=true only after resolving toAccountId with get_accounts.
- If multiple accounts or categories could match, ask which one the user means.
- If no matching account or category exists, say so and ask the user to choose from available options.
- Once the draft is complete, briefly summarize it in natural language and then let the confirmation UI appear.`,
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
    const activeToolInputsByName = new Map();
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
        const normalizedInput = normalizeToolInput(event.data?.input || event.data?.inputs || {});
        activeToolCalls.set(toolCallId, {
          name: event.name,
          input: normalizedInput,
        });
        pushToolInput(activeToolInputsByName, event.name, normalizedInput);

        yield {
          type: 'tool_start',
          toolName: event.name,
          toolCallId,
          label: getToolLabel(event.name),
          guiRequested: shouldRenderGui(event.name, normalizedInput),
        };
      } else if (event.event === 'on_tool_end') {
        this.logger.info(
          `[TOOL_RESULT] name="${event.name}", output length="${JSON.stringify(event.data.output || '').length}"`
        );

        const toolCallId = event.run_id || event.data?.run_id || null;
        const toolCallMeta = activeToolCalls.get(toolCallId);
        const toolName = toolCallMeta?.name || event.name;
        const toolInput = toolCallMeta?.input || shiftToolInput(activeToolInputsByName, toolName);
        const uiBlocks = buildUiBlocks(toolName, event.data.output, toolInput);

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
          guiRequested: shouldRenderGui(toolName, toolInput),
          guiRendered: uiBlocks.length > 0,
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
