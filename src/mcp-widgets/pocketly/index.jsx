import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeftRight,
  BarChart3,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Tag,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import './styles.css';

const EMPTY_DATA = {
  accounts: [],
  categories: [],
  budgets: [],
  transactions: [],
  stats: {},
  analysis: null,
};

const MCP_UI_PROTOCOL_VERSION = '2026-01-26';
const MCP_REQUEST_TIMEOUT_MS = 10000;
const MCP_INIT_TIMEOUT_MS = 2500;
let mcpRequestId = 1;
let mcpListening = false;
let mcpInitialized = false;
let mcpInitializePromise = null;
let mcpBridgeFailed = false;
const pendingMcpRequests = new Map();
const mcpNotificationListeners = new Set();

const tabs = [
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'records', label: 'Records', icon: Receipt },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'planning', label: 'Planning', icon: Target },
];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value = 0) {
  return `INR ${currencyFormatter.format(Math.abs(Number(value) || 0))}`;
}

function getCurrentWeek() {
  const start = new Date();
  const day = start.getDay();
  start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function formatDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function dateInputToIso(value, endOfDay = false) {
  const date = value ? new Date(value) : new Date();
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function normalizePayload(payload) {
  const content = extractToolContent(payload);
  if (!content || typeof content !== 'object') return EMPTY_DATA;
  return {
    ...EMPTY_DATA,
    ...content,
    analysis:
      content.analysis || content.structuredContent?.analysis || content.analysisData || null,
  };
}

function looksLikePocketlyPayload(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    (Array.isArray(value.accounts) ||
      Array.isArray(value.categories) ||
      Array.isArray(value.budgets) ||
      Array.isArray(value.transactions) ||
      value.stats ||
      value.analysis)
  );
}

function extractToolContent(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return null;
  seen.add(value);

  if (looksLikePocketlyPayload(value)) return value;

  const candidates = [
    value.structuredContent,
    value.result?.structuredContent,
    value.params?.structuredContent,
    value.params?.result?.structuredContent,
    value.data,
    value.result?.data,
    value.params?.data,
    value._meta?.data,
    value.meta?.data,
    value.toolOutput,
    value.tool_output,
    value.toolResponseMetadata?.data,
    value.toolResponseMetadata?.structuredContent,
    value.toolResponseMetadata?.mcp_tool_result,
    value.toolResponseMetadata?.call_tool_result,
    value.mcp_tool_result,
    value.call_tool_result,
    value.mcpToolResult,
    value.callToolResult,
    value.widgetState?.data,
    value.openai?.toolOutput,
    value.openai?.toolResponseMetadata,
  ];

  for (const candidate of candidates) {
    const content = extractToolContent(candidate, seen);
    if (content) return content;
  }

  return null;
}

function getToolContent(response) {
  return extractToolContent(response) || {};
}

function hasOpenAiToolBridge() {
  return typeof window !== 'undefined' && typeof window.openai?.callTool === 'function';
}

function hasParentMcpBridge() {
  return typeof window !== 'undefined' && window.parent && window.parent !== window;
}

function parseMcpMessage(data) {
  if (!data) return null;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (typeof data === 'object') return data;
  return null;
}

function handleMcpHostMessage(event) {
  const message = parseMcpMessage(event.data);
  if (!message || typeof message !== 'object') return;

  if (
    message.jsonrpc === '2.0' &&
    Object.prototype.hasOwnProperty.call(message, 'id') &&
    pendingMcpRequests.has(message.id)
  ) {
    const pending = pendingMcpRequests.get(message.id);
    pendingMcpRequests.delete(message.id);
    clearTimeout(pending.timer);
    if (message.error) {
      const error = new Error(message.error.message || 'MCP request failed');
      error.code = message.error.code;
      pending.reject(error);
    } else {
      pending.resolve(message.result || {});
    }
    return;
  }

  if (message.method || getMcpNotificationContent(message)) {
    mcpNotificationListeners.forEach((listener) => listener(message));
  }
}

function ensureMcpMessageListener() {
  if (mcpListening || typeof window === 'undefined') return;
  window.addEventListener('message', handleMcpHostMessage);
  mcpListening = true;
}

function sendMcpRequest(method, params = {}, timeoutMs = MCP_REQUEST_TIMEOUT_MS) {
  ensureMcpMessageListener();
  if (!hasParentMcpBridge()) {
    return Promise.reject(new Error('MCP host window is unavailable.'));
  }

  const id = `pocketly-${mcpRequestId++}`;
  const message = { jsonrpc: '2.0', id, method, params };

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pendingMcpRequests.delete(id);
      reject(new Error(`MCP host did not answer ${method}.`));
    }, timeoutMs);

    pendingMcpRequests.set(id, { resolve, reject, timer });
    window.parent.postMessage(message, '*');
  });
}

function sendMcpNotification(method, params = {}) {
  if (!hasParentMcpBridge()) return;
  window.parent.postMessage({ jsonrpc: '2.0', method, params }, '*');
}

function subscribeMcpNotifications(listener) {
  ensureMcpMessageListener();
  mcpNotificationListeners.add(listener);
  return () => mcpNotificationListeners.delete(listener);
}

async function initializeMcpHost() {
  ensureMcpMessageListener();
  if (mcpInitialized) return {};
  if (mcpBridgeFailed) throw new Error('MCP Apps bridge is unavailable.');
  if (!mcpInitializePromise) {
    const params = {
      protocolVersion: MCP_UI_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'pocketly-widget', version: '1.0.0' },
      appCapabilities: { availableDisplayModes: ['inline', 'fullscreen'] },
    };

    mcpInitializePromise = (async () => {
      try {
        let result;
        try {
          result = await sendMcpRequest('ui/initialize', params, MCP_INIT_TIMEOUT_MS);
        } catch {
          result = await sendMcpRequest('initialize', params, MCP_INIT_TIMEOUT_MS);
        }
        mcpInitialized = true;
        sendMcpNotification('ui/notifications/initialized');
        return result;
      } catch (error) {
        mcpInitializePromise = null;
        mcpBridgeFailed = true;
        throw error;
      }
    })();
  }
  return mcpInitializePromise;
}

async function callMcpHostTool(name, args = {}) {
  await initializeMcpHost();
  return sendMcpRequest('tools/call', { name, arguments: args }, 30000);
}

function getMcpNotificationContent(message) {
  if (message?.method === 'ui/notifications/tool-result') {
    return getToolContent(message.params);
  }
  return extractToolContent(message);
}

function hasDataRows(payload) {
  return Boolean(
    payload?.accounts?.length ||
    payload?.categories?.length ||
    payload?.budgets?.length ||
    payload?.transactions?.length ||
    payload?.analysis
  );
}

function normalizeToolError(error) {
  if (error?.code === -32601 || /method not found/i.test(error?.message || '')) {
    return new Error('This MCP host does not expose widget tool calls yet.');
  }
  return error;
}

function readInitialData() {
  if (typeof window === 'undefined') return EMPTY_DATA;
  const openai = window.openai;
  const sources = [
    openai,
    openai?.toolOutput,
    openai?.toolResponseMetadata?.data,
    openai?.toolResponseMetadata?.structuredContent,
    openai?.toolResponseMetadata,
    openai?.widgetState?.data,
  ];
  return normalizePayload(sources.find((source) => source && typeof source === 'object'));
}

function getInitialTab() {
  if (typeof window === 'undefined') return 'accounts';
  const data = readInitialData();
  return (
    data.activeTab ||
    window.openai?.toolOutput?.activeTab ||
    window.openai?.toolResponseMetadata?.activeTab ||
    window.openai?.widgetState?.activeTab ||
    'accounts'
  );
}

function SummaryCard({ label, value, tone = 'neutral', icon: Icon }) {
  return (
    <div className="summary-card">
      <div className={`summary-icon ${tone}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="eyebrow">{label}</p>
        <p className={`summary-value ${tone}`}>{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={28} />
      </div>
      <p className="empty-title">{title}</p>
      <p className="muted">{description}</p>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AccountModal({ account, onSave, onClose, busy }) {
  const [form, setForm] = useState({
    name: account?.name || '',
    icon: account?.icon || 'wallet',
    initialBalance: account?.initialBalance ?? 0,
    currency: account?.currency || 'INR',
  });

  return (
    <Modal title={account ? 'Edit account' : 'Add account'} onClose={onClose}>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        </label>
        <label>
          Initial balance
          <input
            type="number"
            step="0.01"
            value={form.initialBalance}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, initialBalance: Number(event.target.value) || 0 }))
            }
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : null}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TransactionModal({ data, transaction, onSave, onClose, busy }) {
  const defaultAccount = data.accounts[0]?.id || '';
  const defaultCategory = data.categories.find((category) => category.type === 'expense')?.id || '';
  const [form, setForm] = useState({
    type: transaction?.type || 'expense',
    amount: transaction?.amount ?? '',
    description: transaction?.description || '',
    account: transaction?.account?.id || transaction?.account || defaultAccount,
    category: transaction?.category?.id || transaction?.category || defaultCategory,
    toAccount: transaction?.toAccount?.id || transaction?.toAccount || '',
    date: formatDateInput(transaction?.date || new Date().toISOString()),
    note: transaction?.note || '',
  });

  const categories = data.categories.filter((category) => category.type === form.type);
  const isTransfer = form.type === 'transfer';

  return (
    <Modal title={transaction ? 'Edit transaction' : 'Add transaction'} onClose={onClose}>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            ...form,
            amount: Number(form.amount),
            category: isTransfer ? null : form.category || null,
            toAccount: isTransfer ? form.toAccount || null : null,
            date: dateInputToIso(form.date),
          });
        }}
      >
        <label>
          Type
          <select
            value={form.type}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, type: event.target.value, category: '' }))
            }
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>
        </label>
        <label>
          Amount
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            required
          />
        </label>
        <label>
          Account
          <select
            value={form.account}
            onChange={(event) => setForm((prev) => ({ ...prev, account: event.target.value }))}
            required
          >
            {data.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        {!isTransfer ? (
          <label>
            Category
            <select
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            To account
            <select
              value={form.toAccount}
              onChange={(event) => setForm((prev) => ({ ...prev, toAccount: event.target.value }))}
              required
            >
              <option value="">Select account</option>
              {data.accounts
                .filter((account) => account.id !== form.account)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label>
          Date
          <input
            type="date"
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
            required
          />
        </label>
        <label>
          Description
          <input
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : null}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryModal({ category, onSave, onClose, busy }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    type: category?.type || 'expense',
    icon: category?.icon || 'tag',
    color: category?.color || '#1f644e',
  });

  return (
    <Modal title={category ? 'Edit category' : 'Add category'} onClose={onClose}>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        </label>
        <label>
          Type
          <select
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label>
          Color
          <input
            type="color"
            value={form.color.startsWith('#') ? form.color : '#1f644e'}
            onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : null}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function BudgetModal({ data, budget, onSave, onClose, busy }) {
  const expenseCategories = data.categories.filter((category) => category.type === 'expense');
  const [form, setForm] = useState({
    category: budget?.category?.id || budget?.category || expenseCategories[0]?.id || '',
    amount: budget?.amount ?? '',
    period: budget?.period || 'monthly',
  });

  return (
    <Modal title={budget ? 'Edit budget' : 'Add budget'} onClose={onClose}>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ ...form, amount: Number(form.amount) });
        }}
      >
        <label>
          Category
          <select
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            required
          >
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Amount
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            required
          />
        </label>
        <label>
          Period
          <select
            value={form.period}
            onChange={(event) => setForm((prev) => ({ ...prev, period: event.target.value }))}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : null}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AccountsTab({ data, onEdit, onDelete, onAdd }) {
  const totalBalance = data.stats.totalAccountBalance || 0;
  const totalIncome = data.transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = data.transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <section className="surface">
      <div className="summary-grid">
        <SummaryCard label="Balance" value={formatCurrency(totalBalance)} icon={Wallet} />
        <SummaryCard
          label="Expense"
          value={formatCurrency(totalExpense)}
          icon={TrendingDown}
          tone="danger"
        />
        <SummaryCard
          label="Income"
          value={formatCurrency(totalIncome)}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <div className="section-head">
        <h2>Your Accounts</h2>
        <button type="button" className="outline-button" onClick={onAdd}>
          <Plus size={16} />
          Add
        </button>
      </div>

      {data.accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Accounts will appear here."
        />
      ) : (
        <div className="account-grid">
          {data.accounts.map((account) => {
            const balance =
              account.currentBalance ?? account.balance ?? account.initialBalance ?? 0;
            return (
              <article className="account-card" key={account.id}>
                <div className="account-icon">
                  <Wallet size={22} />
                </div>
                <div className="grow">
                  <h3>{account.name}</h3>
                  <p className={balance < 0 ? 'amount danger' : 'amount success'}>
                    {formatCurrency(balance)}
                  </p>
                </div>
                <div className="row-actions">
                  <button className="icon-button" type="button" onClick={() => onEdit(account)}>
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => onDelete(account.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RecordsTab({ data, onEdit, onDelete, onAdd }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const filtered = useMemo(() => {
    return data.transactions.filter((transaction) => {
      const typeMatches = type === 'all' || transaction.type === type;
      const haystack = [
        transaction.description,
        transaction.category?.name,
        transaction.account?.name,
        transaction.toAccount?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return typeMatches && haystack.includes(query.toLowerCase());
    });
  }, [data.transactions, query, type]);

  const totalIncome = data.transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = data.transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <section className="surface">
      <div className="summary-grid">
        <SummaryCard
          label="Expense"
          value={formatCurrency(totalExpense)}
          icon={TrendingDown}
          tone="danger"
        />
        <SummaryCard
          label="Income"
          value={formatCurrency(totalIncome)}
          icon={TrendingUp}
          tone="success"
        />
        <SummaryCard
          label="Net Flow"
          value={formatCurrency(totalIncome - totalExpense)}
          icon={Wallet}
          tone={totalIncome - totalExpense >= 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="record-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search transactions"
          />
        </div>
        <div className="segmented">
          {['all', 'income', 'expense', 'transfer'].map((item) => (
            <button
              type="button"
              key={item}
              className={type === item ? 'active' : ''}
              onClick={() => setType(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button type="button" className="outline-button" onClick={onAdd}>
          <Plus size={16} />
          Add
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions"
          description="Transactions for this period will appear here."
        />
      ) : (
        <div className="transaction-list">
          {filtered.map((transaction) => {
            const isTransfer = transaction.type === 'transfer';
            const title = isTransfer ? 'Transfer' : transaction.category?.name || 'Uncategorized';
            const subtitle = isTransfer
              ? `${transaction.account?.name || 'Account'} to ${transaction.toAccount?.name || 'Account'}`
              : transaction.account?.name || 'Account';
            return (
              <article className="transaction-row" key={transaction.id}>
                <div className={`transaction-icon ${transaction.type}`}>
                  {isTransfer ? <ArrowLeftRight size={18} /> : <Tag size={18} />}
                </div>
                <div className="grow">
                  <h3>{title}</h3>
                  <p>{subtitle}</p>
                  {transaction.description ? <span>{transaction.description}</span> : null}
                </div>
                <div className="amount-column">
                  <p className={`amount ${transaction.type === 'expense' ? 'danger' : 'success'}`}>
                    {transaction.type === 'expense'
                      ? '-'
                      : transaction.type === 'income'
                        ? '+'
                        : ''}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <time>{new Date(transaction.date).toLocaleDateString()}</time>
                </div>
                <div className="row-actions">
                  <button className="icon-button" type="button" onClick={() => onEdit(transaction)}>
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => onDelete(transaction.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function AnalysisTab({ data, analysis }) {
  const currentAnalysis = analysis || data.analysis;
  const expenseBreakdown =
    currentAnalysis?.categoryBreakdown?.filter((item) => item.type === 'expense') || [];
  const totalExpense = currentAnalysis?.totalExpense || 0;
  const totalIncome = currentAnalysis?.totalIncome || 0;
  const maxCategory = Math.max(...expenseBreakdown.map((item) => item.total), 1);

  return (
    <section className="surface">
      <div className="summary-grid two">
        <SummaryCard
          label="Total Expense"
          value={formatCurrency(totalExpense)}
          icon={TrendingDown}
          tone="danger"
        />
        <SummaryCard
          label="Total Income"
          value={formatCurrency(totalIncome)}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      {!currentAnalysis ? (
        <EmptyState
          icon={BarChart3}
          title="No analysis loaded"
          description="Analysis will appear here."
        />
      ) : expenseBreakdown.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No expense data"
          description="Expense analysis will appear here."
        />
      ) : (
        <div className="analysis-list">
          {expenseBreakdown.slice(0, 8).map((item) => (
            <article className="analysis-row" key={item.categoryId || item.name}>
              <div className="category-dot" style={{ backgroundColor: item.color || '#1f644e' }} />
              <div className="grow">
                <div className="analysis-label">
                  <strong>{item.name}</strong>
                  <span>{formatCurrency(item.total)}</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.max(4, (item.total / maxCategory) * 100)}%`,
                      backgroundColor: item.color || '#1f644e',
                    }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PlanningTab({
  data,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
}) {
  const expenseCategories = data.categories.filter((category) => category.type === 'expense');
  const incomeCategories = data.categories.filter((category) => category.type === 'income');

  return (
    <section className="surface planning">
      <div className="planning-column">
        <div className="section-head">
          <h2>Categories</h2>
          <button type="button" className="outline-button" onClick={onAddCategory}>
            <Plus size={16} />
            Add
          </button>
        </div>
        <CategoryGroup
          title="Income"
          items={incomeCategories}
          onEdit={onEditCategory}
          onDelete={onDeleteCategory}
        />
        <CategoryGroup
          title="Expense"
          items={expenseCategories}
          onEdit={onEditCategory}
          onDelete={onDeleteCategory}
        />
      </div>

      <div className="planning-column">
        <div className="section-head">
          <h2>Budgets</h2>
          <button type="button" className="outline-button" onClick={onAddBudget}>
            <Plus size={16} />
            Add
          </button>
        </div>
        {data.budgets.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No budgets set"
            description="Budgets will appear here."
          />
        ) : (
          <div className="budget-list">
            {data.budgets.map((budget) => (
              <article className="budget-card" key={budget.id}>
                <div>
                  <h3>{budget.category?.name || 'Category'}</h3>
                  <p>{budget.period}</p>
                </div>
                <strong>{formatCurrency(budget.amount)}</strong>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => onEditBudget(budget)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => onDeleteBudget(budget.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CategoryGroup({ title, items, onEdit, onDelete }) {
  return (
    <div className="category-group">
      <div className="group-title">
        <span>{title}</span>
        <small>{items.length}</small>
      </div>
      {items.length === 0 ? (
        <p className="muted compact-empty">No {title.toLowerCase()} categories.</p>
      ) : (
        <div className="category-grid">
          {items.map((category) => (
            <article className="category-card" key={category.id}>
              <div
                className="category-dot"
                style={{ backgroundColor: category.color || '#1f644e' }}
              />
              <strong>{category.name}</strong>
              <div className="row-actions">
                <button className="icon-button" type="button" onClick={() => onEdit(category)}>
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => onDelete(category.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const initialPeriod = getCurrentWeek();
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [period, setPeriod] = useState({
    startDate: readInitialData().startDate || initialPeriod.startDate,
    endDate: readInitialData().endDate || initialPeriod.endDate,
  });
  const [data, setData] = useState(readInitialData);
  const [analysis, setAnalysis] = useState(readInitialData().analysis);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [hostConnected, setHostConnected] = useState(
    () => hasOpenAiToolBridge() || hasDataRows(readInitialData())
  );
  const [toolCallsAvailable, setToolCallsAvailable] = useState(hasOpenAiToolBridge);
  const canCallTools = toolCallsAvailable;
  const hasLiveData = hasDataRows(data);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.openai?.setWidgetState?.({ activeTab, data });
    }
  }, [activeTab, data]);

  useEffect(() => {
    function applyOpenAiGlobals(globals = window.openai) {
      if (!globals || typeof globals !== 'object') return;
      if (typeof globals.callTool === 'function') setToolCallsAvailable(true);

      const content = extractToolContent(globals);
      if (content) {
        setHostConnected(true);
        applyContent(content);
        if (content.activeTab && tabs.some((tab) => tab.id === content.activeTab)) {
          setActiveTab(content.activeTab);
        }
        if (content.startDate || content.endDate) {
          setPeriod((prev) => ({
            startDate: content.startDate || prev.startDate,
            endDate: content.endDate || prev.endDate,
          }));
        }
      }
    }

    function handleSetGlobals(event) {
      applyOpenAiGlobals(event.detail?.globals || event.detail || window.openai);
    }

    applyOpenAiGlobals();
    window.addEventListener('openai:set_globals', handleSetGlobals, { passive: true });
    return () => window.removeEventListener('openai:set_globals', handleSetGlobals);
  }, []);

  useEffect(() => {
    function handleNotification(message) {
      setHostConnected(true);

      if (
        message.method === 'ui/notifications/tool-input' ||
        message.method === 'ui/notifications/tool-input-partial'
      ) {
        const args = message.params?.arguments || {};
        if (args.activeTab && tabs.some((tab) => tab.id === args.activeTab)) {
          setActiveTab(args.activeTab);
        }
        if (args.startDate || args.endDate) {
          setPeriod((prev) => ({
            startDate: args.startDate || prev.startDate,
            endDate: args.endDate || prev.endDate,
          }));
        }
      }

      const content = getMcpNotificationContent(message);
      if (content) applyContent(content);
    }

    return subscribeMcpNotifications(handleNotification);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (hasOpenAiToolBridge()) {
      setHostConnected(true);
      setToolCallsAvailable(true);
      return () => {
        cancelled = true;
      };
    }
    initializeMcpHost()
      .then(() => {
        if (!cancelled) {
          setHostConnected(true);
          setToolCallsAvailable(true);
        }
      })
      .catch(() => {
        if (!cancelled && hasOpenAiToolBridge()) {
          setHostConnected(true);
          setToolCallsAvailable(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (canCallTools && !hasLiveData) {
      refresh();
    }
  }, [hostConnected]);

  useEffect(() => {
    if (activeTab === 'analysis' && canCallTools) {
      loadAnalysis();
    }
  }, [activeTab, period.startDate, period.endDate, hostConnected]);

  function applyContent(content) {
    const normalized = normalizePayload(content);
    if (
      normalized.accounts.length ||
      normalized.categories.length ||
      normalized.budgets.length ||
      normalized.transactions.length ||
      normalized.stats
    ) {
      setData((prev) => ({ ...prev, ...normalized }));
    }
    if (normalized.analysis) setAnalysis(normalized.analysis);
  }

  async function callTool(name, args = {}) {
    let response;

    if (hasOpenAiToolBridge()) {
      response = await window.openai.callTool(name, args);
    } else if (!mcpBridgeFailed && hasParentMcpBridge()) {
      try {
        response = await callMcpHostTool(name, args);
      } catch (error) {
        mcpBridgeFailed = true;
        setToolCallsAvailable(false);
        throw normalizeToolError(error);
      }
    }

    if (!response) {
      throw new Error('MCP host tools are unavailable.');
    }

    setHostConnected(true);
    const content = getToolContent(response);
    applyContent(content);
    return content;
  }

  async function run(action) {
    setBusy(true);
    setError('');
    try {
      return await action();
    } catch (err) {
      setError(err?.message || 'Request failed');
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    await run(async () => {
      const next = await callTool('bootstrap', period);
      setData(normalizePayload(next));
    });
  }

  async function loadAnalysis() {
    await run(async () => {
      const next = await callTool('get_analysis', period);
      setAnalysis(next.analysis);
    });
  }

  async function mutate(tool, args) {
    await run(async () => {
      await callTool(tool, args);
      await refresh();
      if (activeTab === 'analysis') await loadAnalysis();
      setModal(null);
    });
  }

  const content = (() => {
    if (activeTab === 'accounts') {
      return (
        <AccountsTab
          data={data}
          onAdd={() => setModal({ type: 'account' })}
          onEdit={(account) => setModal({ type: 'account', record: account })}
          onDelete={(id) => mutate('delete_account', { id })}
        />
      );
    }
    if (activeTab === 'records') {
      return (
        <RecordsTab
          data={data}
          onAdd={() => setModal({ type: 'transaction' })}
          onEdit={(transaction) => setModal({ type: 'transaction', record: transaction })}
          onDelete={(id) => mutate('delete_transaction', { id })}
        />
      );
    }
    if (activeTab === 'analysis') {
      return <AnalysisTab data={data} analysis={analysis} />;
    }
    return (
      <PlanningTab
        data={data}
        onAddCategory={() => setModal({ type: 'category' })}
        onEditCategory={(category) => setModal({ type: 'category', record: category })}
        onDeleteCategory={(id) => mutate('delete_category', { id })}
        onAddBudget={() => setModal({ type: 'budget' })}
        onEditBudget={(budget) => setModal({ type: 'budget', record: budget })}
        onDeleteBudget={(id) => mutate('delete_budget', { id })}
      />
    );
  })();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/images/apps/pocketly.png" alt="" />
          <span>Pocketly</span>
        </div>
        <nav>
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <h1>{tabs.find((tab) => tab.id === activeTab)?.label || 'Pocketly'}</h1>
            <p>
              {new Date(period.startDate).toLocaleDateString()} -{' '}
              {new Date(period.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="topbar-actions">
            <input
              type="date"
              value={formatDateInput(period.startDate)}
              onChange={(event) =>
                setPeriod((prev) => ({ ...prev, startDate: dateInputToIso(event.target.value) }))
              }
            />
            <input
              type="date"
              value={formatDateInput(period.endDate)}
              onChange={(event) =>
                setPeriod((prev) => ({
                  ...prev,
                  endDate: dateInputToIso(event.target.value, true),
                }))
              }
            />
            <button
              type="button"
              className="primary-button"
              disabled={busy || !toolCallsAvailable}
              onClick={refresh}
              title={
                toolCallsAvailable
                  ? 'Refresh Pocketly data'
                  : 'This MCP host does not expose widget tool calls'
              }
            >
              {busy ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
              Refresh
            </button>
          </div>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}
        {content}
      </main>

      <nav className="mobile-tabs">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {modal?.type === 'account' ? (
        <AccountModal
          account={modal.record}
          busy={busy}
          onClose={() => setModal(null)}
          onSave={(form) =>
            mutate(modal.record ? 'update_account' : 'create_account', {
              ...(modal.record ? { id: modal.record.id } : {}),
              ...form,
            })
          }
        />
      ) : null}

      {modal?.type === 'transaction' ? (
        <TransactionModal
          data={data}
          transaction={modal.record}
          busy={busy}
          onClose={() => setModal(null)}
          onSave={(form) =>
            mutate(modal.record ? 'update_transaction' : 'create_transaction', {
              ...(modal.record ? { id: modal.record.id } : {}),
              ...form,
            })
          }
        />
      ) : null}

      {modal?.type === 'category' ? (
        <CategoryModal
          category={modal.record}
          busy={busy}
          onClose={() => setModal(null)}
          onSave={(form) =>
            mutate(modal.record ? 'update_category' : 'create_category', {
              ...(modal.record ? { id: modal.record.id } : {}),
              ...form,
            })
          }
        />
      ) : null}

      {modal?.type === 'budget' ? (
        <BudgetModal
          data={data}
          budget={modal.record}
          busy={busy}
          onClose={() => setModal(null)}
          onSave={(form) =>
            mutate(modal.record ? 'update_budget' : 'create_budget', {
              ...(modal.record ? { id: modal.record.id } : {}),
              ...form,
            })
          }
        />
      ) : null}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
