'use client';

function createDeviceAction(toolName, label, options = {}) {
  return {
    toolName,
    label,
    guiRequested: options.guiRequested || false,
    guiRendered: options.guiRendered || false,
  };
}

const MAX_HISTORY_MESSAGES = 12;

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toPromptMessages(messages = []) {
  return messages
    .filter(
      (message) => message?.content && (message.role === 'user' || message.role === 'assistant')
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

function getLanguageModelApi() {
  if (typeof window === 'undefined') return null;

  if (window.LanguageModel?.create) {
    return window.LanguageModel;
  }

  if (window.ai?.languageModel?.create) {
    return window.ai.languageModel;
  }

  if (window.chrome?.aiOriginTrial?.languageModel?.create) {
    return window.chrome.aiOriginTrial.languageModel;
  }

  if (window.chrome?.ai?.languageModel?.create) {
    return window.chrome.ai.languageModel;
  }

  return null;
}

function createDebugPreview(value, maxLength = 800) {
  const text = String(value || '');
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function stripCodeFences(value) {
  const text = String(value || '').trim();
  if (!text.startsWith('```')) return text;
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function extractJsonCandidate(rawResult) {
  const cleaned = stripCodeFences(rawResult);
  if (!cleaned) return '';
  if (
    (cleaned.startsWith('{') && cleaned.endsWith('}')) ||
    (cleaned.startsWith('[') && cleaned.endsWith(']'))
  ) {
    return cleaned;
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function normalizeStructuredResult(parsed) {
  return {
    replyText: parsed?.replyText || '',
    intent: parsed?.intent || 'answer',
    needsGui: Boolean(parsed?.needsGui),
    followUpQuestion: parsed?.followUpQuestion || null,
    transactionFilterType: parsed?.transactionFilterType || 'all',
    limit: parsed?.limit ?? null,
    draftTransaction: parsed?.draftTransaction || null,
  };
}

function userExplicitlyWantsVisual(normalized) {
  return /(show|list|display|open|visualize|breakdown|browse|snapshot|table|chart|see)/.test(
    normalized
  );
}

function userLikelyWantsPlainAnswer(normalized) {
  return /(what|how much|which|why|when|do i|did i|have i|is my|are my)/.test(normalized);
}

function applyPresentationHeuristics(result, userMessage) {
  const normalized = normalizeText(userMessage);
  const explicitVisual = userExplicitlyWantsVisual(normalized);
  const likelyPlain = userLikelyWantsPlainAnswer(normalized);
  const next = {
    ...result,
    needsGui: Boolean(result?.needsGui),
  };

  if (next.intent === 'draft_transaction') {
    next.needsGui = false;
    return next;
  }

  if (
    ['show_accounts', 'show_transactions', 'show_analysis', 'show_categories'].includes(next.intent)
  ) {
    if (explicitVisual) {
      next.needsGui = true;
    } else if (likelyPlain) {
      next.needsGui = false;
    }
  }

  return next;
}

function createIntentFallback(userMessage, pendingDraft) {
  const normalized = normalizeText(userMessage);

  if (pendingDraft) return 'draft_transaction';
  if (/(show|list|display).*(account|balance)|account balance/.test(normalized)) {
    return 'show_accounts';
  }
  if (/(show|list|display).*(transaction|record)|last \d+/.test(normalized)) {
    return 'show_transactions';
  }
  if (/(analysis|summary|net flow|spending|expense breakdown|insight)/.test(normalized)) {
    return 'show_analysis';
  }
  if (/(category|categories)/.test(normalized)) {
    return 'show_categories';
  }
  if (
    /(spent|spend|paid|bought|expense|income|earned|received|salary|gift|grant|transfer|sent)/.test(
      normalized
    )
  ) {
    return 'draft_transaction';
  }

  return 'answer';
}

function buildFallbackStructuredResult(rawResult, userMessage, pendingDraft) {
  const cleaned = stripCodeFences(rawResult);
  const intent = createIntentFallback(userMessage, pendingDraft);
  const text = cleaned && cleaned !== '}' ? cleaned : '';

  return applyPresentationHeuristics(
    normalizeStructuredResult({
      replyText:
        text ||
        (intent === 'draft_transaction'
          ? 'I started working on your transaction locally.'
          : 'I checked your local finance data.'),
      intent,
      needsGui: userExplicitlyWantsVisual(normalizeText(userMessage)),
      followUpQuestion: null,
      transactionFilterType: 'all',
      limit: null,
      draftTransaction: null,
    }),
    userMessage
  );
}

function parseStructuredDeviceResult(rawResult, userMessage, pendingDraft) {
  const candidate = extractJsonCandidate(rawResult);

  try {
    return applyPresentationHeuristics(
      normalizeStructuredResult(JSON.parse(candidate)),
      userMessage
    );
  } catch (error) {
    const preview = createDebugPreview(candidate || rawResult);

    if (typeof window !== 'undefined') {
      window.__POCKETLY_DEVICE_AI_DEBUG__ = {
        rawResult,
        candidate,
        preview,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    console.error('[Pocketly Device AI] Failed to parse structured output', {
      error: error.message,
      preview,
      rawResult,
    });

    return buildFallbackStructuredResult(rawResult, userMessage, pendingDraft);
  }
}

export function getDeviceAiAvailability() {
  const api = getLanguageModelApi();
  return {
    supported: Boolean(api),
    reason: api ? '' : 'On-device AI is not available in this browser or device yet.',
  };
}

function createFinanceSnapshot({
  accounts = [],
  categories = [],
  transactions = [],
  analysis = null,
}) {
  const recentTransactions = transactions.slice(0, 12).map((transaction) => ({
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    description: transaction.description || '',
    categoryName:
      transaction.category?.name || transaction.categoryName || transaction.category || '',
    accountName: transaction.account?.name || transaction.accountName || transaction.account || '',
    toAccountName:
      transaction.toAccount?.name || transaction.toAccountName || transaction.toAccount || '',
    date: transaction.date,
  }));

  return {
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      balance: account.currentBalance ?? account.balance ?? 0,
      currency: account.currency || 'INR',
      icon: account.icon || 'wallet',
    })),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color || '#999999',
      icon: category.icon || 'tag',
    })),
    recentTransactions,
    analysis: analysis
      ? {
          totalIncome: analysis.totalIncome ?? 0,
          totalExpense: analysis.totalExpense ?? 0,
          netFlow: analysis.netFlow ?? 0,
          totalAccountBalance: analysis.totalAccountBalance ?? 0,
          topExpenseCategories: analysis.topExpenseCategories ?? [],
        }
      : null,
  };
}

function buildSystemPrompt() {
  return `You are Pocketly's on-device Finance Assistant.
You help with personal finance questions using only the local finance snapshot provided in the prompt.
Return valid JSON only.
Be concise, accurate, and practical.

When helping create a transaction draft:
- Never invent account IDs or category IDs.
- Work with account names and category names from the local snapshot.
- Ask one follow-up question at a time when information is missing.
- Required fields before a draft is considered complete:
  - type
  - amount
  - source account name
  - category name for income and expense
  - destination account name for transfers
- Date may be null if the user did not specify one.
- Description may be empty if the user did not specify one.

Use these UI intent rules consistently:
- If the user says "show", "list", "display", "open", "visualize", "breakdown", "browse", or asks to see a snapshot, set needsGui=true for the matching show_* intent.
- If the user asks a direct question like "what is my balance?", "how much did I spend?", or "which category is highest?", set needsGui=false unless they also asked to see it.
- Do not request visual UI just because you used local data. Request it only when the user-facing answer benefits from a card or list.`;
}

function getResponseSchema() {
  return {
    type: 'object',
    properties: {
      replyText: { type: 'string' },
      intent: {
        type: 'string',
        enum: [
          'answer',
          'clarify',
          'show_accounts',
          'show_transactions',
          'show_analysis',
          'show_categories',
          'draft_transaction',
        ],
      },
      needsGui: { type: 'boolean' },
      followUpQuestion: { type: ['string', 'null'] },
      transactionFilterType: {
        type: ['string', 'null'],
        enum: ['income', 'expense', 'transfer', 'all', null],
      },
      limit: { type: ['number', 'null'] },
      draftTransaction: {
        type: ['object', 'null'],
        properties: {
          type: {
            type: ['string', 'null'],
            enum: ['income', 'expense', 'transfer', null],
          },
          amount: { type: ['number', 'null'] },
          description: { type: ['string', 'null'] },
          accountName: { type: ['string', 'null'] },
          categoryName: { type: ['string', 'null'] },
          toAccountName: { type: ['string', 'null'] },
          date: { type: ['string', 'null'] },
        },
        required: [
          'type',
          'amount',
          'description',
          'accountName',
          'categoryName',
          'toAccountName',
          'date',
        ],
        additionalProperties: false,
      },
    },
    required: ['replyText', 'intent', 'needsGui', 'followUpQuestion', 'limit', 'draftTransaction'],
    additionalProperties: false,
  };
}

async function createSession(initialPrompts) {
  const api = getLanguageModelApi();
  if (!api?.create) {
    throw new Error('On-device AI is not available in this browser or device.');
  }

  return api.create({
    initialPrompts,
  });
}

async function promptSession(session, prompt, signal) {
  const options = {
    signal,
    responseConstraint: getResponseSchema(),
  };

  if (typeof session.promptStreaming === 'function') {
    const stream = await session.promptStreaming(prompt, options);
    let finalChunk = '';
    for await (const chunk of stream) {
      if (typeof chunk === 'string') {
        finalChunk += chunk;
      }
    }
    return finalChunk;
  }

  return session.prompt(prompt, options);
}

function pickSingleMatch(items, requestedName, accessor) {
  const normalizedRequested = normalizeText(requestedName);
  if (!normalizedRequested) {
    return { status: 'missing', matches: [] };
  }

  const exact = items.filter((item) => normalizeText(accessor(item)) === normalizedRequested);
  if (exact.length === 1) {
    return { status: 'resolved', match: exact[0], matches: exact };
  }

  const partial = items.filter((item) =>
    normalizeText(accessor(item)).includes(normalizedRequested)
  );
  if (partial.length === 1) {
    return { status: 'resolved', match: partial[0], matches: partial };
  }

  if (exact.length > 1 || partial.length > 1) {
    return { status: 'ambiguous', matches: exact.length > 1 ? exact : partial };
  }

  return { status: 'missing', matches: [] };
}

function buildAnalysisFallback(snapshot) {
  const totalIncome = snapshot.recentTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpense = snapshot.recentTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalAccountBalance = snapshot.accounts.reduce((sum, item) => sum + (item.balance || 0), 0);

  const categoryTotals = new Map();
  for (const transaction of snapshot.recentTransactions.filter((item) => item.type === 'expense')) {
    const key = transaction.categoryName || 'Uncategorized';
    const existing = categoryTotals.get(key) || { name: key, total: 0, count: 0 };
    existing.total += transaction.amount || 0;
    existing.count += 1;
    categoryTotals.set(key, existing);
  }

  return {
    totalIncome,
    totalExpense,
    netFlow: totalIncome - totalExpense,
    totalAccountBalance,
    topExpenseCategories: Array.from(categoryTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 6),
  };
}

function createUiBlocksFromIntent(result, snapshot) {
  if (!result.needsGui) return [];

  if (result.intent === 'show_accounts') {
    return [
      {
        kind: 'accounts_snapshot',
        title: 'Account balances',
        action: { type: 'switch_tab', tab: 'accounts', label: 'Open accounts' },
        data: {
          items: snapshot.accounts.slice(0, 6).map((item) => ({
            id: item.id,
            name: item.name,
            icon: item.icon,
            balance: item.balance,
            initialBalance: item.balance,
            currency: item.currency,
          })),
        },
      },
    ];
  }

  if (result.intent === 'show_transactions') {
    const limit = Math.max(1, Math.min(Number(result.limit) || 5, 10));
    const filtered =
      result.transactionFilterType && result.transactionFilterType !== 'all'
        ? snapshot.recentTransactions.filter((item) => item.type === result.transactionFilterType)
        : snapshot.recentTransactions;

    return [
      {
        kind: 'transaction_list',
        title: 'Matching transactions',
        action: { type: 'switch_tab', tab: 'records', label: 'Open records' },
        data: {
          items: filtered.slice(0, limit).map((item) => ({
            id: item.id,
            type: item.type,
            amount: item.amount,
            description: item.description,
            category: item.categoryName || 'Uncategorized',
            account: item.accountName || 'Unknown',
            toAccount: item.toAccountName || null,
            date: item.date,
          })),
        },
      },
    ];
  }

  if (result.intent === 'show_categories') {
    const income = snapshot.categories.filter((item) => item.type === 'income');
    const expense = snapshot.categories.filter((item) => item.type === 'expense');
    return [
      {
        kind: 'category_breakdown',
        title: 'Category setup',
        action: { type: 'switch_tab', tab: 'categories', label: 'Open categories' },
        data: { mode: 'groups', income, expense },
      },
    ];
  }

  if (result.intent === 'show_analysis') {
    const analysis = snapshot.analysis || buildAnalysisFallback(snapshot);
    return [
      {
        kind: 'summary_cards',
        title: 'Financial snapshot',
        action: { type: 'switch_tab', tab: 'analysis', label: 'Open analysis' },
        data: {
          totalIncome: analysis.totalIncome || 0,
          totalExpense: analysis.totalExpense || 0,
          netFlow: analysis.netFlow || 0,
          totalAccountBalance: analysis.totalAccountBalance || 0,
        },
      },
      {
        kind: 'category_breakdown',
        title: 'Top spending categories',
        action: { type: 'switch_tab', tab: 'analysis', label: 'View breakdown' },
        data: {
          mode: 'totals',
          items: analysis.topExpenseCategories || [],
        },
      },
    ].filter((block) => {
      if (block.kind === 'category_breakdown') {
        return block.data.items.length > 0;
      }
      return true;
    });
  }

  return [];
}

function mergeDefinedValues(...sources) {
  return sources.reduce((acc, source) => {
    if (!source || typeof source !== 'object') return acc;

    for (const [key, value] of Object.entries(source)) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'string' && !value.trim()) continue;
      acc[key] = value;
    }

    return acc;
  }, {});
}

function detectTransactionTypeFromText(normalized) {
  if (/(transfer|transferred|send to|move to)/.test(normalized)) return 'transfer';
  if (/(spent|spend|paid|bought|expense|debited)/.test(normalized)) return 'expense';
  if (/(income|earned|received|salary|gift|grant|credited)/.test(normalized)) return 'income';
  return null;
}

function detectAmountFromText(userMessage) {
  const match = String(userMessage || '').match(
    /(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i
  );
  if (!match) return null;

  const amount = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function detectSingleEntityName(items, userMessage, accessor) {
  const normalizedMessage = normalizeText(userMessage);
  if (!normalizedMessage) return null;

  const matches = items.filter((item) => {
    const name = normalizeText(accessor(item));
    return name && normalizedMessage.includes(name);
  });

  if (matches.length === 1) return accessor(matches[0]);
  return null;
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectTransferAccounts(snapshot, userMessage) {
  const normalizedMessage = normalizeText(userMessage);
  const result = { accountName: null, toAccountName: null };

  for (const account of snapshot.accounts) {
    const name = normalizeText(account.name);
    if (!name || !normalizedMessage.includes(name)) continue;

    const escapedName = escapeRegex(name).replace(/\s+/g, '\\s+');
    const fromPattern = new RegExp(`from\\s+${escapedName}`);
    const toPattern = new RegExp(`to\\s+${escapedName}`);

    if (fromPattern.test(normalizedMessage)) {
      result.accountName = account.name;
    } else if (toPattern.test(normalizedMessage)) {
      result.toAccountName = account.name;
    } else if (!result.accountName) {
      result.accountName = account.name;
    } else if (!result.toAccountName && result.accountName !== account.name) {
      result.toAccountName = account.name;
    }
  }

  return result;
}

function detectDateHint(userMessage) {
  const normalized = normalizeText(userMessage);
  if (/\btoday\b/.test(normalized)) {
    return new Date().toISOString();
  }
  if (/\byesterday\b/.test(normalized)) {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString();
  }
  return null;
}

function detectAmountFromInput(userMessage) {
  const match = String(userMessage || '').match(
    /(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i
  );
  if (!match) return null;

  const amount = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function formatDraftReply(draft) {
  return `I prepared a ${draft.type} draft for Rs ${draft.amount}. Please confirm it below.`;
}

function extractDraftHintsFromUserMessage(userMessage, snapshot, pendingDraft) {
  const normalized = normalizeText(userMessage);
  const inferredType = detectTransactionTypeFromText(normalized) || pendingDraft?.type || null;
  const categoriesForType = snapshot.categories.filter((item) => item.type === inferredType);
  const transferAccounts = detectTransferAccounts(snapshot, userMessage);

  return {
    type: inferredType,
    amount: detectAmountFromInput(userMessage),
    accountName:
      transferAccounts.accountName ||
      detectSingleEntityName(snapshot.accounts, userMessage, (item) => item.name),
    categoryName: detectSingleEntityName(
      categoriesForType.length > 0 ? categoriesForType : snapshot.categories,
      userMessage,
      (item) => item.name
    ),
    toAccountName:
      transferAccounts.toAccountName ||
      (inferredType === 'transfer'
        ? detectSingleEntityName(snapshot.accounts, userMessage, (item) => item.name)
        : null),
    date: detectDateHint(userMessage),
  };
}

function createDeviceActions(result, options = {}) {
  const actions = [];
  const guiRequested = Boolean(result?.needsGui);
  const guiRendered = Boolean(options.uiBlocks?.length);

  if (options.checkedAccounts) {
    actions.push(
      createDeviceAction('local_accounts', 'Checking accounts', {
        guiRequested,
        guiRendered,
      })
    );
  }

  if (options.checkedCategories) {
    actions.push(
      createDeviceAction('local_categories', 'Checking categories', {
        guiRequested,
        guiRendered,
      })
    );
  }

  if (options.checkedTransactions) {
    actions.push(
      createDeviceAction('local_transactions', 'Reviewing recent transactions', {
        guiRequested,
        guiRendered,
      })
    );
  }

  if (options.checkedAnalysis) {
    actions.push(
      createDeviceAction('local_analysis', 'Generating local summary', {
        guiRequested,
        guiRendered,
      })
    );
  }

  if (options.preparedDraft) {
    actions.push(
      createDeviceAction('local_draft', 'Preparing transaction draft', {
        guiRequested: Boolean(guiRequested || guiRendered),
        guiRendered,
      })
    );
  }

  return actions;
}

function validateAndResolveDraft(draftTransaction, snapshot) {
  const draft = {
    type: draftTransaction?.type || null,
    amount:
      typeof draftTransaction?.amount === 'number' && Number.isFinite(draftTransaction.amount)
        ? draftTransaction.amount
        : null,
    description: draftTransaction?.description || '',
    accountName: draftTransaction?.accountName || '',
    categoryName: draftTransaction?.categoryName || '',
    toAccountName: draftTransaction?.toAccountName || '',
    date: draftTransaction?.date || null,
  };

  if (!draft.type) {
    return { complete: false, question: 'Is this an income, expense, or transfer?', draft };
  }

  if (!draft.amount || draft.amount <= 0) {
    return { complete: false, question: 'What is the transaction amount?', draft };
  }

  const accountResolution = pickSingleMatch(
    snapshot.accounts,
    draft.accountName,
    (item) => item.name
  );
  if (accountResolution.status === 'missing') {
    return { complete: false, question: 'Which account should I use for this transaction?', draft };
  }
  if (accountResolution.status === 'ambiguous') {
    return {
      complete: false,
      question: `Which account do you mean: ${accountResolution.matches
        .map((item) => item.name)
        .join(', ')}?`,
      draft,
    };
  }

  if (draft.type === 'transfer') {
    const toAccountResolution = pickSingleMatch(
      snapshot.accounts,
      draft.toAccountName,
      (item) => item.name
    );

    if (toAccountResolution.status === 'missing') {
      return {
        complete: false,
        question: 'Which destination account should I transfer to?',
        draft,
      };
    }

    if (toAccountResolution.status === 'ambiguous') {
      return {
        complete: false,
        question: `Which destination account do you mean: ${toAccountResolution.matches
          .map((item) => item.name)
          .join(', ')}?`,
        draft,
      };
    }

    return {
      complete: true,
      draft: {
        type: draft.type,
        amount: draft.amount,
        description: draft.description,
        accountId: accountResolution.match.id,
        accountName: accountResolution.match.name,
        categoryId: null,
        categoryName: null,
        toAccountId: toAccountResolution.match.id,
        toAccountName: toAccountResolution.match.name,
        date: draft.date,
      },
    };
  }

  const categoriesForType = snapshot.categories.filter((item) => item.type === draft.type);
  const categoryResolution = pickSingleMatch(
    categoriesForType,
    draft.categoryName,
    (item) => item.name
  );
  if (categoryResolution.status === 'missing') {
    return {
      complete: false,
      question: `Which ${draft.type} category should I use?`,
      draft,
    };
  }

  if (categoryResolution.status === 'ambiguous') {
    return {
      complete: false,
      question: `Which category do you mean: ${categoryResolution.matches
        .map((item) => item.name)
        .join(', ')}?`,
      draft,
    };
  }

  return {
    complete: true,
    draft: {
      type: draft.type,
      amount: draft.amount,
      description: draft.description,
      accountId: accountResolution.match.id,
      accountName: accountResolution.match.name,
      categoryId: categoryResolution.match.id,
      categoryName: categoryResolution.match.name,
      toAccountId: null,
      toAccountName: null,
      date: draft.date,
    },
  };
}

export async function runDeviceFinanceChat({
  userMessage,
  history,
  accounts,
  categories,
  transactions,
  analysis,
  pendingDraft,
  signal,
}) {
  const availability = getDeviceAiAvailability();
  if (!availability.supported) {
    throw new Error(availability.reason);
  }

  const snapshot = createFinanceSnapshot({ accounts, categories, transactions, analysis });
  const session = await createSession([
    {
      role: 'system',
      content: buildSystemPrompt(),
    },
    ...toPromptMessages(history),
  ]);

  const prompt = `Current finance snapshot:
${JSON.stringify(snapshot)}

Current pending transaction draft:
${JSON.stringify(pendingDraft || null)}

User message:
${userMessage}

Return JSON only using the required schema.`;

  const rawResult = await promptSession(session, prompt, signal);
  const parsed = parseStructuredDeviceResult(rawResult, userMessage, pendingDraft);
  const uiBlocks = createUiBlocksFromIntent(parsed, snapshot);

  if (parsed.intent === 'draft_transaction') {
    const mergedDraft = mergeDefinedValues(
      pendingDraft || {},
      extractDraftHintsFromUserMessage(userMessage, snapshot, pendingDraft),
      parsed.draftTransaction || {}
    );
    const resolved = validateAndResolveDraft(mergedDraft, snapshot);

    if (!resolved.complete) {
      return {
        replyText: parsed.followUpQuestion || parsed.replyText || resolved.question,
        uiBlocks: [],
        actions: createDeviceActions(parsed, {
          checkedAccounts: true,
          checkedCategories: Boolean(resolved.draft.type && resolved.draft.type !== 'transfer'),
          preparedDraft: true,
        }),
        pendingDraft: resolved.draft,
      };
    }

    return {
      replyText: parsed.replyText || formatDraftReply(resolved.draft),
      uiBlocks: [
        {
          kind: 'transaction_confirmation',
          title: 'Confirm Transaction',
          action: null,
          data: resolved.draft,
        },
      ],
      actions: createDeviceActions(parsed, {
        checkedAccounts: true,
        checkedCategories: resolved.draft.type !== 'transfer',
        preparedDraft: true,
        uiBlocks: [
          {
            kind: 'transaction_confirmation',
          },
        ],
      }),
      pendingDraft: null,
    };
  }

  return {
    replyText: parsed.replyText || parsed.followUpQuestion || 'Done.',
    uiBlocks,
    actions: createDeviceActions(parsed, {
      checkedAccounts: parsed.intent === 'show_accounts',
      checkedCategories: parsed.intent === 'show_categories',
      checkedTransactions: parsed.intent === 'show_transactions',
      checkedAnalysis: parsed.intent === 'show_analysis',
      uiBlocks,
    }),
    pendingDraft: null,
  };
}
