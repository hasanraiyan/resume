'use client';

import { ArrowLeftRight, Landmark, TrendingDown, TrendingUp } from 'lucide-react';
import IconRenderer from './IconRenderer';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const accountIconColors = [
  { bg: 'bg-orange-100', text: 'text-orange-500', border: 'border-orange-200' },
  { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
  { bg: 'bg-red-100', text: 'text-red-500', border: 'border-red-200' },
];

function formatCurrency(value) {
  return `\u20B9${currencyFormatter.format(value || 0)}`;
}

function getAccountIconClass(icon) {
  if (icon === 'wallet' || icon === 'purse') return 'w-10 h-10 object-contain';
  if (icon === 'ippb' || icon === 'pnb') return 'w-10 h-8 object-contain';
  if (icon === 'rupay') return 'w-7 h-7 object-contain';
  return 'w-6 h-6 scale-125';
}

function ActionButton({ action, onInteract }) {
  if (!action?.label) return null;

  return (
    <button
      type="button"
      onClick={() => onInteract?.(action)}
      className="mt-3 inline-flex cursor-pointer items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-700 transition hover:bg-neutral-50"
    >
      {action.label}
    </button>
  );
}

function InlineActionButton({ action, onInteract }) {
  if (!action?.label) return null;

  return (
    <button
      type="button"
      onClick={() => onInteract?.(action)}
      className="inline-flex cursor-pointer items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-700 transition hover:bg-neutral-50"
    >
      {action.label}
    </button>
  );
}

function SummaryCardsBlock({ block, onInteract }) {
  const cards = [
    {
      label: 'Income',
      value: block.data.totalIncome,
      icon: TrendingUp,
      tone: 'text-[#1f644e] bg-[#1f644e]/10',
    },
    {
      label: 'Expense',
      value: block.data.totalExpense,
      icon: TrendingDown,
      tone: 'text-[#c94c4c] bg-[#c94c4c]/10',
    },
    {
      label: 'Net flow',
      value: block.data.netFlow,
      icon: ArrowLeftRight,
      tone:
        block.data.netFlow >= 0
          ? 'text-[#1f644e] bg-[#1f644e]/10'
          : 'text-[#c94c4c] bg-[#c94c4c]/10',
    },
    {
      label: 'Balance',
      value: block.data.totalAccountBalance,
      icon: Landmark,
      tone: 'text-[#1e3a34] bg-neutral-100',
    },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-[#f8f8f4] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-neutral-800">{block.title}</p>
        <div className="hidden sm:block">
          <InlineActionButton action={block.action} onInteract={onInteract} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-neutral-200/70 bg-white p-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.tone}`}>
                <card.icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                {card.label}
              </span>
            </div>
            <p className="mt-2 text-sm font-bold text-neutral-900">{formatCurrency(card.value)}</p>
          </div>
        ))}
      </div>
      <div className="sm:hidden">
        <ActionButton action={block.action} onInteract={onInteract} />
      </div>
    </div>
  );
}

function TransactionListBlock({ block, onInteract }) {
  const items = block.data?.items || [];

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-[#f8f8f4] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-neutral-800">{block.title}</p>
        <div className="hidden sm:block">
          <InlineActionButton action={block.action} onInteract={onInteract} />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center">
          <p className="text-sm font-semibold text-neutral-800">No transactions found</p>
          <p className="mt-1 text-[11px] text-neutral-500">
            Try another filter, timeframe, or ask for recent income or expenses.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => {
            const isExpense = item.type === 'expense';
            const isTransfer = item.type === 'transfer';

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/70 bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {item.description || item.category || 'Transaction'}
                  </p>
                  <p className="truncate text-[11px] text-neutral-500">
                    {isTransfer
                      ? `${item.account || 'Account'} to ${item.toAccount || 'Account'}`
                      : `${item.category || 'Uncategorized'} - ${item.account || 'Account'}`}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-xs font-bold ${
                    isExpense ? 'text-[#c94c4c]' : isTransfer ? 'text-[#1e3a34]' : 'text-[#1f644e]'
                  }`}
                >
                  {isTransfer ? '' : item.type === 'expense' ? '-' : '+'}
                  {formatCurrency(item.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="sm:hidden">
        <ActionButton action={block.action} onInteract={onInteract} />
      </div>
    </div>
  );
}

function AccountsSnapshotBlock({ block, onInteract }) {
  const items = block.data?.items || [];

  return (
    <div className="self-stretch min-w-0 w-full max-w-full rounded-2xl border border-neutral-200/70 bg-[#f8f8f4] p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-neutral-800">{block.title}</p>
        <div className="hidden sm:block">
          <InlineActionButton action={block.action} onInteract={onInteract} />
        </div>
      </div>

      <div className="mt-3 min-w-0 w-full max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2 custom-chat-scrollbar touch-pan-x">
        <div className="inline-flex h-full gap-2 pr-1 snap-x snap-mandatory">
          {items.map((item, index) => {
            const colorSet = accountIconColors[index % accountIconColors.length];

            return (
              <div
                key={item.id}
                className="w-[184px] sm:w-[204px] shrink-0 snap-start rounded-2xl border border-neutral-200/70 bg-white p-3 shadow-[0_4px_16px_rgba(30,58,52,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border ${colorSet.bg} ${colorSet.text} ${colorSet.border}`}
                  >
                    <IconRenderer name={item.icon} className={getAccountIconClass(item.icon)} />
                  </div>
                  <p
                    className={`text-[14px] font-bold ${
                      (item.balance || 0) >= 0 ? 'text-[#1f644e]' : 'text-[#c94c4c]'
                    }`}
                  >
                    {formatCurrency(item.balance)}
                  </p>
                </div>

                <div className="mt-3">
                  <p className="line-clamp-2 text-[13px] font-bold text-[#1e3a34]">{item.name}</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-[#7c8e88]">Initial</span>
                      <span className="text-xs font-bold text-[#1e3a34]">
                        {formatCurrency(item.initialBalance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-[#7c8e88]">Current</span>
                      <span
                        className={`text-xs font-bold ${
                          (item.balance || 0) >= 0 ? 'text-[#1f644e]' : 'text-[#c94c4c]'
                        }`}
                      >
                        {formatCurrency(item.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sm:hidden">
        <ActionButton action={block.action} onInteract={onInteract} />
      </div>
    </div>
  );
}

function CategoryBreakdownBlock({ block, onInteract }) {
  const data = block.data || {};

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-[#f8f8f4] p-3">
      <p className="text-xs font-semibold text-neutral-800">{block.title}</p>

      {data.mode === 'totals' ? (
        <div className="mt-3 space-y-2">
          {(data.items || []).map((item) => (
            <div
              key={`${item.name}-${item.total}`}
              className="rounded-2xl border border-neutral-200/70 bg-white px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-neutral-900">{item.name}</p>
                <p className="shrink-0 text-xs font-bold text-[#c94c4c]">
                  {formatCurrency(item.total)}
                </p>
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">{item.count} transaction(s)</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Income', items: data.income || [] },
            { label: 'Expense', items: data.expense || [] },
          ].map((group) => (
            <div
              key={group.label}
              className="rounded-2xl border border-neutral-200/70 bg-white p-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                {group.label}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.items.length === 0 ? (
                  <span className="text-[11px] text-neutral-400">No categories</span>
                ) : (
                  group.items.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-700"
                    >
                      <IconRenderer name={item.icon} className="h-3 w-3" />
                      {item.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ActionButton action={block.action} onInteract={onInteract} />
    </div>
  );
}

export default function FinanceChatBlockRenderer({ block, onInteract }) {
  if (!block?.kind) return null;

  if (block.kind === 'summary_cards') {
    return <SummaryCardsBlock block={block} onInteract={onInteract} />;
  }

  if (block.kind === 'transaction_list') {
    return <TransactionListBlock block={block} onInteract={onInteract} />;
  }

  if (block.kind === 'accounts_snapshot') {
    return <AccountsSnapshotBlock block={block} onInteract={onInteract} />;
  }

  if (block.kind === 'category_breakdown') {
    return <CategoryBreakdownBlock block={block} onInteract={onInteract} />;
  }

  if (block.kind === 'transaction_confirmation') {
    return <TransactionConfirmationBlock block={block} onInteract={onInteract} />;
  }

  return null;
}

function TransactionConfirmationBlock({ block, onInteract }) {
  const data = block.data || {};
  const isExpense = data.type === 'expense';
  const isTransfer = data.type === 'transfer';

  const amountColor = isExpense
    ? 'text-[#c94c4c]'
    : isTransfer
      ? 'text-[#1e3a34]'
      : 'text-[#1f644e]';
  const amountPrefix = isExpense ? '-' : isTransfer ? '' : '+';

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-[#f8f8f4] p-3 shadow-sm">
      <p className="text-xs font-semibold text-neutral-800 mb-3">
        {block.title || 'Confirm Transaction'}
      </p>

      <div className="rounded-xl border border-neutral-200 bg-white p-3 space-y-3">
        <div className="flex justify-between items-start gap-4 border-b border-neutral-100 pb-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {data.description || 'Draft Transaction'}
            </p>
            <p className="text-[11px] text-neutral-500 capitalize">{data.type}</p>
          </div>
          <p className={`text-sm font-bold shrink-0 ${amountColor}`}>
            {amountPrefix}
            {formatCurrency(data.amount)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-[10px] uppercase text-neutral-400 font-semibold mb-0.5">Date</p>
            <p className="font-medium text-neutral-800">{data.date || 'Today'}</p>
          </div>
          {!isTransfer && (
            <div>
              <p className="text-[10px] uppercase text-neutral-400 font-semibold mb-0.5">
                Category
              </p>
              <p className="font-medium text-neutral-800">{data.categoryHint || 'Uncategorized'}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase text-neutral-400 font-semibold mb-0.5">Account</p>
            <p className="font-medium text-neutral-800">{data.accountHint || 'Select later'}</p>
          </div>
          {isTransfer && (
            <div>
              <p className="text-[10px] uppercase text-neutral-400 font-semibold mb-0.5">
                To Account
              </p>
              <p className="font-medium text-neutral-800">{data.toAccountHint || 'Select later'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => onInteract?.({ type: 'confirm_transaction', data })}
          className="flex-1 cursor-pointer rounded-full bg-[#1e3a34] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#152924]"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={() => onInteract?.({ type: 'cancel_transaction', data })}
          className="flex-1 cursor-pointer rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Edit Manually
        </button>
      </div>
    </div>
  );
}
