'use client';

import { ArrowLeftRight, Landmark, TrendingDown, TrendingUp } from 'lucide-react';
import IconRenderer from './IconRenderer';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  return `\u20B9${currencyFormatter.format(value || 0)}`;
}

function ActionButton({ action, onInteract }) {
  if (!action?.label) return null;

  return (
    <button
      type="button"
      onClick={() => onInteract?.(action)}
      className="mt-3 inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-700 transition hover:bg-neutral-50"
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
      <p className="text-xs font-semibold text-neutral-800">{block.title}</p>
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
      <ActionButton action={block.action} onInteract={onInteract} />
    </div>
  );
}

function TransactionListBlock({ block, onInteract }) {
  const items = block.data?.items || [];

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-[#f8f8f4] p-3">
      <p className="text-xs font-semibold text-neutral-800">{block.title}</p>
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
      <ActionButton action={block.action} onInteract={onInteract} />
    </div>
  );
}

function AccountsSnapshotBlock({ block, onInteract }) {
  const items = block.data?.items || [];

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-[#f8f8f4] p-3">
      <p className="text-xs font-semibold text-neutral-800">{block.title}</p>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/70 bg-white px-3 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">
                <IconRenderer name={item.icon} className="h-4 w-4 text-neutral-700" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-900">{item.name}</p>
                <p className="text-[11px] text-neutral-500">
                  Started with {formatCurrency(item.initialBalance)}
                </p>
              </div>
            </div>
            <p
              className={`shrink-0 text-xs font-bold ${
                (item.balance || 0) >= 0 ? 'text-[#1f644e]' : 'text-[#c94c4c]'
              }`}
            >
              {formatCurrency(item.balance)}
            </p>
          </div>
        ))}
      </div>
      <ActionButton action={block.action} onInteract={onInteract} />
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

  return null;
}
