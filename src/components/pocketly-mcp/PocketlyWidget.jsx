import React from 'react';

const TOOL_BY_KIND = {
  accounts: 'get_accounts',
  transactions: 'get_transactions',
  budgets: 'get_budgets',
  summary: 'get_financial_summary',
};

function formatCurrency(value) {
  const amount = Number(value || 0);
  const abs = Math.abs(amount);
  const compact = abs >= 100000;
  const formatted = new Intl.NumberFormat('en-IN', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
    minimumFractionDigits: compact ? 0 : 2,
  }).format(abs);
  return `INR ${formatted}`;
}

function formatSigned(value) {
  const amount = Number(value || 0);
  return `${amount < 0 ? '-' : '+'}${formatCurrency(amount)}`;
}

function SvgIcon({ name }) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  if (name === 'wallet') {
    return (
      <svg {...props}>
        <path d="M19 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h14a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7" />
        <path d="M16 14h.01" />
      </svg>
    );
  }

  if (name === 'trending-down') {
    return (
      <svg {...props}>
        <path d="m22 17-8.5-8.5-5 5L2 7" />
        <path d="M16 17h6v-6" />
      </svg>
    );
  }

  if (name === 'trending-up') {
    return (
      <svg {...props}>
        <path d="m22 7-8.5 8.5-5-5L2 17" />
        <path d="M16 7h6v6" />
      </svg>
    );
  }

  if (name === 'credit-card') {
    return (
      <svg {...props}>
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <path d="M2 10h20" />
      </svg>
    );
  }

  if (name === 'building') {
    return (
      <svg {...props}>
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
        <path d="M6 12H4a2 2 0 0 0-2 2v8" />
        <path d="M18 9h2a2 2 0 0 1 2 2v11" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
      </svg>
    );
  }

  if (name === 'coins') {
    return (
      <svg {...props}>
        <circle cx="8" cy="8" r="6" />
        <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
        <path d="M7 6h1v4" />
      </svg>
    );
  }

  if (name === 'phone') {
    return (
      <svg {...props}>
        <rect width="14" height="20" x="5" y="2" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    );
  }

  if (name === 'refresh') {
    return (
      <svg {...props}>
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
      <path d="M2 7h20v5H2z" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function IppbIcon() {
  return (
    <svg className="icon-img bank-logo" viewBox="0 0 24 24" preserveAspectRatio="none">
      <rect width="24" height="24" rx="3" fill="#3a0f1a" />
      <circle cx="9.5" cy="10.5" r="3.2" fill="#d92b2b" />
      <path
        d="M4 8c2 0 4 2 7 2"
        stroke="#ffd036"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 10c2 0 4 2 7 2"
        stroke="#ffd036"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 12c2 0 4 2 7 2"
        stroke="#ffd036"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RupayIcon() {
  return (
    <svg className="icon-img" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="#0052CC" />
      <path
        d="M7 16V8h3a3 3 0 0 1 0 6H7"
        stroke="#fff"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 16h3a3 3 0 0 0 0-6h-3"
        stroke="#ffb400"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AccountIcon({ name, assetBaseUrl }) {
  const normalized = String(name || '').toLowerCase();
  if (normalized === 'wallet' || normalized === 'purse') {
    return <img className="icon-img" src={`${assetBaseUrl}/images/purse.svg`} alt="" />;
  }
  if (normalized === 'pnb') {
    return <img className="icon-img bank-logo" src={`${assetBaseUrl}/images/pnb.png`} alt="" />;
  }
  if (normalized === 'ippb' || normalized === 'ip-pb' || normalized === 'ip_pb')
    return <IppbIcon />;
  if (normalized === 'rupay' || normalized === 'ru-pay' || normalized === 'ru_pay')
    return <RupayIcon />;
  if (normalized.includes('card')) return <SvgIcon name="credit-card" />;
  if (
    normalized.includes('bank') ||
    normalized.includes('landmark') ||
    normalized.includes('building')
  ) {
    return <SvgIcon name="building" />;
  }
  if (normalized.includes('piggy') || normalized.includes('coin')) return <SvgIcon name="coins" />;
  if (normalized.includes('phone')) return <SvgIcon name="phone" />;
  return <SvgIcon name="wallet" />;
}

function accountIconClass(index) {
  return ['orange', 'blue-soft', 'green', 'purple', 'red-soft'][index % 5];
}

function Header({ eyebrow, title, note, onRefresh, isRefreshing }) {
  return (
    <div className="header">
      <div className="brand">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="title">{title}</h1>
      </div>
      <div className="header-actions">
        <span className="note">{note || ''}</span>
        <button
          type="button"
          className="icon-button refresh-view"
          aria-label="Refresh Pocketly view"
          title="Refresh"
          disabled={isRefreshing}
          onClick={onRefresh}
        >
          <SvgIcon name="refresh" />
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = '', iconName, iconTone = '' }) {
  return (
    <div className="stat">
      {iconName ? (
        <div className={`stat-icon ${iconTone}`}>
          <SvgIcon name={iconName} />
        </div>
      ) : null}
      <div>
        <p className="stat-label">{label}</p>
        <p className={`stat-value ${tone}`}>{value}</p>
      </div>
    </div>
  );
}

function EmptyView({ children }) {
  return <div className="empty">{children}</div>;
}

function AccountCards({ accounts, assetBaseUrl }) {
  if (!accounts.length) return <EmptyView>No accounts yet.</EmptyView>;

  return (
    <div className="grid accounts">
      {accounts.map((account, index) => {
        const balance = Number(account.balance || 0);
        return (
          <div className="card account-card" key={account.id || account._id || account.name}>
            <div className="account-card-top">
              <div className={`icon account-icon ${accountIconClass(index)}`}>
                <AccountIcon name={account.icon} assetBaseUrl={assetBaseUrl} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <p className="card-title">{account.name}</p>
              <p className={`account-balance ${balance < 0 ? 'negative' : 'positive'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AccountsView({ data, onRefresh, isRefreshing, assetBaseUrl }) {
  const accounts = data.accounts || [];
  const stats = data.stats || {};

  return (
    <main className="shell">
      <Header
        eyebrow="Pocketly"
        title="Accounts"
        note={`${accounts.length} accounts`}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />
      <div className="content">
        <div className="summary account-summary">
          <Stat
            label="Balance"
            value={formatCurrency(stats.totalAccountBalance)}
            iconName="wallet"
          />
          <Stat
            label="Expense"
            value={formatCurrency(stats.totalExpense)}
            tone="negative"
            iconName="trending-down"
            iconTone="red"
          />
          <Stat
            label="Income"
            value={formatCurrency(stats.totalIncome)}
            tone="positive"
            iconName="trending-up"
          />
        </div>
        <div className="section-head">
          <h2 className="section-title">Your Accounts</h2>
        </div>
        <AccountCards accounts={accounts} assetBaseUrl={assetBaseUrl} />
      </div>
    </main>
  );
}

function groupTransactions(transactions) {
  return transactions.reduce((groups, transaction) => {
    const label = new Date(transaction.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'long',
    });
    groups[label] = groups[label] || [];
    groups[label].push(transaction);
    return groups;
  }, {});
}

function transactionTitle(transaction) {
  if (transaction.type === 'transfer') return 'Transfer';
  return transaction.category?.name || transaction.description || 'Transaction';
}

function transactionMeta(transaction) {
  if (transaction.type === 'transfer') {
    return `${transaction.account?.name || 'Account'} to ${transaction.toAccount?.name || 'Account'}`;
  }
  return transaction.account?.name || 'Account';
}

function TransactionsView({ data, onRefresh, isRefreshing }) {
  const transactions = data.transactions || [];
  const stats = data.stats || {};
  const groups = groupTransactions(transactions);

  return (
    <main className="shell">
      <Header
        eyebrow="Pocketly Records"
        title={data.period?.label || 'Recent Records'}
        note={`${transactions.length} shown`}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />
      <div className="content">
        <div className="summary">
          <Stat label="Expense" value={formatCurrency(stats.totalExpense)} tone="negative" />
          <Stat label="Income" value={formatCurrency(stats.totalIncome)} tone="positive" />
          <Stat
            label="Net Flow"
            value={formatSigned(stats.netFlow)}
            tone={stats.netFlow >= 0 ? 'positive' : 'negative'}
          />
        </div>
        {transactions.length ? (
          Object.entries(groups).map(([dateLabel, items]) => (
            <div className="date-group" key={dateLabel}>
              <p className="date-label">{dateLabel}</p>
              <div className="card records">
                {items.map((transaction) => {
                  const isExpense = transaction.type === 'expense';
                  const isIncome = transaction.type === 'income';
                  const iconClass =
                    transaction.type === 'transfer' ? 'blue' : isExpense ? 'red' : '';
                  const amount =
                    transaction.type === 'transfer'
                      ? formatCurrency(transaction.amount)
                      : `${isExpense ? '-' : '+'}${formatCurrency(transaction.amount)}`;
                  return (
                    <div className="record" key={transaction.id || transaction._id}>
                      <div className="record-left">
                        <div className={`icon ${iconClass}`}>
                          <SvgIcon
                            name={transaction.type === 'transfer' ? 'credit-card' : 'wallet'}
                          />
                        </div>
                        <div className="card-main">
                          <p className="card-title">{transactionTitle(transaction)}</p>
                          <p className="card-meta">{transactionMeta(transaction)}</p>
                        </div>
                      </div>
                      <div
                        className={`amount ${isExpense ? 'negative' : isIncome ? 'positive' : ''}`}
                      >
                        {amount}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <EmptyView>No transactions for this period.</EmptyView>
        )}
      </div>
    </main>
  );
}

function BudgetsView({ data, onRefresh, isRefreshing }) {
  const budgets = data.budgets || [];
  const stats = data.stats || {};

  return (
    <main className="shell">
      <Header
        eyebrow="Pocketly Planning"
        title="Budgets"
        note={`${budgets.length} budgets`}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />
      <div className="content">
        <div className="summary">
          <Stat label="Budget" value={formatCurrency(stats.totalBudget)} />
          <Stat
            label="Spent"
            value={formatCurrency(stats.totalSpent)}
            tone={stats.exceededCount ? 'negative' : 'positive'}
          />
          <Stat
            label="Exceeded"
            value={String(stats.exceededCount || 0)}
            tone={stats.exceededCount ? 'negative' : ''}
          />
        </div>
        {budgets.length ? (
          <div className="card progress-wrap">
            {budgets.map((budget) => {
              const progress = Math.max(0, Math.min(Number(budget.progress || 0), 100));
              return (
                <div key={budget.id || budget._id || budget.category?.name}>
                  <div className="progress-top">
                    <p className="progress-name">{budget.category?.name || 'Budget'}</p>
                    <span
                      className={`progress-value ${budget.isExceeded ? 'negative' : 'positive'}`}
                    >
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="bar">
                    <div
                      className={`bar-fill ${budget.isExceeded ? 'over' : ''}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="card-meta">
                    {formatCurrency(budget.spent)} spent of {formatCurrency(budget.amount)} -{' '}
                    {budget.period}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyView>No budgets yet.</EmptyView>
        )}
      </div>
    </main>
  );
}

function SummaryView({ data, onRefresh, isRefreshing }) {
  const stats = data.stats || {};
  const expenses = data.topExpenseCategories || [];

  return (
    <main className="shell">
      <Header
        eyebrow="Pocketly Analysis"
        title={data.period?.label || 'Summary'}
        note=""
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />
      <div className="content">
        <div className="summary four">
          <Stat label="Balance" value={formatCurrency(stats.totalAccountBalance)} />
          <Stat label="Expense" value={formatCurrency(stats.totalExpense)} tone="negative" />
          <Stat label="Income" value={formatCurrency(stats.totalIncome)} tone="positive" />
          <Stat
            label="Net Flow"
            value={formatSigned(stats.netFlow)}
            tone={stats.netFlow >= 0 ? 'positive' : 'negative'}
          />
        </div>
        <div className="section-head">
          <h2 className="section-title">Top Expense Categories</h2>
        </div>
        {expenses.length ? (
          <div className="card category-list">
            {expenses.map((category) => (
              <div className="category-row" key={category.id || category._id || category.name}>
                <span className="dot" style={{ background: category.color || '#1f644e' }} />
                <span className="card-title">{category.name}</span>
                <span className="negative">{formatCurrency(category.total)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyView>No category activity in this period.</EmptyView>
        )}
      </div>
    </main>
  );
}

export function PocketlyWidget({
  data,
  preferredKind,
  onRefresh,
  isRefreshing = false,
  assetBaseUrl = '',
}) {
  const kind = data?.kind || preferredKind || 'summary';

  if (!data) {
    return (
      <main className="shell">
        <EmptyView>Ask ChatGPT to load this Pocketly view.</EmptyView>
      </main>
    );
  }

  if (kind === 'accounts') {
    return (
      <AccountsView
        data={data}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        assetBaseUrl={assetBaseUrl}
      />
    );
  }
  if (kind === 'transactions') {
    return <TransactionsView data={data} onRefresh={onRefresh} isRefreshing={isRefreshing} />;
  }
  if (kind === 'budgets') {
    return <BudgetsView data={data} onRefresh={onRefresh} isRefreshing={isRefreshing} />;
  }
  return <SummaryView data={data} onRefresh={onRefresh} isRefreshing={isRefreshing} />;
}

export function getToolNameForKind(kind) {
  return TOOL_BY_KIND[kind] || TOOL_BY_KIND.summary;
}
