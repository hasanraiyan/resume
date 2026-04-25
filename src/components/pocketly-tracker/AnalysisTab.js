'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMoney } from '@/context/MoneyContext';
import {
  ChevronDown,
  TrendingDown,
  TrendingUp,
  BarChart3,
  PieChart,
  RefreshCw,
  AlertTriangle,
  Wallet,
  SlidersHorizontal,
} from 'lucide-react';
import TopTabs from '@/components/ui/TopTabs';
import dynamic from 'next/dynamic';

const IconRenderer = dynamic(() => import('./IconRenderer'), { ssr: false });

const viewOptions = [
  { id: 'expense', label: 'Expense', icon: TrendingDown },
  { id: 'income', label: 'Income', icon: TrendingUp },
  { id: 'flow', label: 'Flow', icon: BarChart3 },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
];

const periodOptions = ['Daily', 'Weekly', 'Monthly', '3 Months', '6 Months', 'Yearly'];
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Compact formatter for large amounts, e.g. 45K, 1.2L
const compactNumberFormatter = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export default function AnalysisTab() {
  const {
    analysis,
    fetchAnalysis,
    periodStart,
    periodEnd,
    setPeriod,
    isAnalysisLoading,
    analysisError,
    budgets,
  } = useMoney();
  const [viewMode, setViewMode] = useState('expense');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Weekly');

  useEffect(() => {
    fetchAnalysis(periodStart, periodEnd).catch(() => {});
  }, [fetchAnalysis, periodEnd, periodStart]);

  const handlePeriodChange = (period) => {
    const now = new Date();
    let start, end, type;

    switch (period) {
      case 'Daily':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        type = 'day';
        break;
      case 'Weekly':
        start = new Date(now);
        end = new Date(now);
        start.setDate(now.getDate() - 7);
        end.setHours(23, 59, 59, 999);
        type = 'week';
        break;
      case 'Monthly':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        type = 'month';
        break;
      case '3 Months':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        type = 'month';
        break;
      case '6 Months':
        start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        type = 'month';
        break;
      case 'Yearly':
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        type = 'month';
        break;
      default:
        return;
    }

    setSelectedPeriod(period);
    setPeriod(start.toISOString(), end.toISOString(), type);
    setShowPeriodDropdown(false);
  };

  const expenseCategories = useMemo(
    () => analysis?.categoryBreakdown?.filter((item) => item.type === 'expense') || [],
    [analysis]
  );
  const incomeCategories = useMemo(
    () => analysis?.categoryBreakdown?.filter((item) => item.type === 'income') || [],
    [analysis]
  );
  const currentCategories = useMemo(
    () => (viewMode === 'income' ? incomeCategories : expenseCategories),
    [expenseCategories, incomeCategories, viewMode]
  );
  const total = useMemo(
    () => currentCategories.reduce((sum, item) => sum + item.total, 0) || 1,
    [currentCategories]
  );

  const { dailyEntries, maxDaily } = useMemo(() => {
    const dailyFlowMap = (analysis?.dailyFlow || []).reduce((accumulator, entry) => {
      if (!accumulator[entry.date]) {
        accumulator[entry.date] = { expense: 0, income: 0 };
      }
      accumulator[entry.date][entry.type] = entry.total;
      return accumulator;
    }, {});

    const entries = Object.entries(dailyFlowMap);
    return {
      dailyEntries: entries,
      maxDaily: Math.max(...entries.map(([, data]) => Math.max(data.expense, data.income)), 1),
    };
  }, [analysis]);

  const { accounts, maxAccountValue } = useMemo(() => {
    const accountData = (analysis?.accountAnalysis || []).reduce((accumulator, entry) => {
      const key = entry.accountId || entry.name;
      if (!accumulator[key]) {
        accumulator[key] = { name: entry.name, icon: entry.icon, expense: 0, income: 0 };
      }
      accumulator[key][entry.type] = entry.total;
      return accumulator;
    }, {});

    const values = Object.values(accountData);
    return {
      accounts: values,
      maxAccountValue: Math.max(
        ...values.flatMap((account) => [account.expense, account.income]),
        1
      ),
    };
  }, [analysis]);

  const chartColors = [
    '#1f644e',
    '#2d8a6e',
    '#3ba88a',
    '#5cbfa6',
    '#7ed6c2',
    '#4a86e8',
    '#9333ea',
    '#f59e0b',
  ];

  const isRefreshingAnalysis = Boolean(analysis) && isAnalysisLoading;

  const formatCurrencyWithCompact = (amount) => {
    const abs = Math.abs(amount || 0);
    const useCompact = abs >= 100000; // Use compact notation from 1L upwards
    const formatted = useCompact
      ? compactNumberFormatter.format(abs)
      : currencyFormatter.format(abs);
    return `₹${formatted}`;
  };

  const EmptyState = ({ title, description }) => (
    <div className="flex flex-col items-center justify-center px-6 py-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0f5f2]">
        <PieChart className="h-8 w-8 text-[#7c8e88]" />
      </div>
      <p className="mb-1 text-sm font-bold text-[#1e3a34]">{title}</p>
      <p className="text-center text-xs text-[#7c8e88]">{description}</p>
    </div>
  );

  const renderCategoryOverview = () => {
    if (currentCategories.length === 0) {
      return (
        <EmptyState
          title={`No ${viewMode === 'income' ? 'income' : 'expense'} data`}
          description="Transactions in this period will appear here"
        />
      );
    }

    const topCategory = currentCategories.reduce(
      (max, category) => (category.total > max.total ? category : max),
      currentCategories[0]
    );
    const topPercentage = total ? (topCategory.total / total) * 100 : 0;

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-[#e5e3d8] bg-white p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative shrink-0">
              <svg width="160" height="160" className="-rotate-90 w-36 h-36 sm:w-40 sm:h-40">
                <circle cx="80" cy="80" r="56" fill="none" stroke="#f0f5f2" strokeWidth="24" />
                {(() => {
                  let cumulative = 0;
                  return currentCategories.slice(0, 6).map((category, index) => {
                    const percentage = category.total / total;
                    const circumference = 2 * Math.PI * 56;
                    const dash = circumference * percentage;
                    const offset = -circumference * cumulative;
                    cumulative += percentage;

                    return (
                      <circle
                        key={category.categoryId || index}
                        cx="80"
                        cy="80"
                        r="56"
                        fill="none"
                        stroke={chartColors[index % chartColors.length]}
                        strokeWidth="24"
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={offset}
                        className="transition-all duration-700"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-bold text-[#1e3a34]">
                  {topPercentage.toFixed(0)}%
                </span>
                <span className="mt-0.5 w-16 text-center truncate text-[10px] font-semibold text-[#7c8e88]">
                  {topCategory.name}
                </span>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2">
              {currentCategories.slice(0, 6).map((category, index) => (
                <div key={category.categoryId || index} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: chartColors[index % chartColors.length] }}
                  />
                  <span className="flex-1 truncate text-xs text-[#7c8e88]">{category.name}</span>
                  <span className="text-xs font-bold text-[#1e3a34]">
                    {((category.total / total) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e3d8] bg-white p-6">
          <h3 className="mb-4 text-sm font-bold text-[#1e3a34]">Breakdown</h3>
          <div className="space-y-4">
            {currentCategories.map((category, index) => {
              const percentage = (category.total / total) * 100;
              const budget =
                viewMode === 'expense'
                  ? budgets?.find((b) => {
                      const bCatId = b.category?._id || b.category?.id || b.category;
                      return bCatId === category.categoryId;
                    })
                  : null;

              const isExceeded = budget && category.total > budget.amount;
              const budgetProgress = budget
                ? Math.min((category.total / budget.amount) * 100, 100)
                : null;

              return (
                <div key={category.categoryId || index}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: chartColors[index % chartColors.length] }}
                      >
                        <IconRenderer name={category.icon} className="h-4 w-4" />
                      </div>
                      <span className="max-w-[8rem] truncate text-sm font-bold text-[#1e3a34]">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-sm font-bold ${isExceeded ? 'text-[#c94c4c]' : 'text-[#1e3a34]'}`}
                      >
                        {formatCurrencyWithCompact(category.total)}
                      </span>
                      {budget && (
                        <span className="text-[10px] font-semibold text-[#7c8e88]">
                          Limit: {formatCurrencyWithCompact(budget.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f0f5f2]">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isExceeded ? 'bg-[#c94c4c]' : ''}`}
                        style={{
                          width: `${percentage}%`,
                          ...(!isExceeded
                            ? { backgroundColor: chartColors[index % chartColors.length] }
                            : {}),
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-bold text-[#7c8e88]">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  {budget && isExceeded && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#c94c4c]">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Budget exceeded</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderExpenseFlow = () => {
    if (dailyEntries.length === 0) {
      return (
        <EmptyState title="No flow data" description="Daily transaction data will appear here" />
      );
    }

    return (
      <div className="rounded-xl border border-[#e5e3d8] bg-white p-6">
        <h3 className="mb-4 text-sm font-bold text-[#1e3a34]">Daily Flow</h3>
        <div className="mb-4 flex h-48 items-end gap-1.5">
          {dailyEntries.map(([date, data]) => {
            const expenseHeight = (data.expense / maxDaily) * 100;
            const incomeHeight = (data.income / maxDaily) * 100;

            return (
              <div
                key={date}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
              >
                <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-[#1e3a34] px-2 py-1 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                  {formatCurrencyWithCompact(data.expense)}
                </div>
                <div className="flex h-full w-full items-end gap-0.5">
                  <div
                    className="flex-1 rounded-t-sm bg-[#c94c4c]/70 transition-all hover:bg-[#c94c4c]"
                    style={{ height: `${Math.max(expenseHeight, 2)}%` }}
                  />
                  <div
                    className="flex-1 rounded-t-sm bg-[#1f644e]/70 transition-all hover:bg-[#1f644e]"
                    style={{ height: `${Math.max(incomeHeight, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          {dailyEntries.map(([date]) => (
            <div key={date} className="flex-1 text-center">
              <span className="text-[10px] font-bold text-[#7c8e88]">
                {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 border-t border-[#e5e3d8] pt-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#c94c4c]/70" />
            <span className="text-[10px] font-bold text-[#7c8e88]">Expense</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[#1f644e]/70" />
            <span className="text-[10px] font-bold text-[#7c8e88]">Income</span>
          </div>
        </div>
      </div>
    );
  };

  const renderAccountAnalysis = () => {
    if (accounts.length === 0) {
      return <EmptyState title="No account data" description="Account activity will appear here" />;
    }

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[#e5e3d8] bg-white p-6">
          <h3 className="mb-4 text-sm font-bold text-[#1e3a34]">Account Activity</h3>
          <div className="mb-4 flex h-40 items-end gap-2">
            {accounts.map((account, index) => (
              <div
                key={`${account.name}-${index}`}
                className="flex h-full flex-1 items-end gap-0.5"
              >
                <div
                  className="flex-1 rounded-t-sm bg-[#c94c4c]/60 transition-all duration-700"
                  style={{ height: `${(account.expense / maxAccountValue) * 100}%` }}
                />
                <div
                  className="flex-1 rounded-t-sm bg-[#1f644e]/60 transition-all duration-700"
                  style={{ height: `${(account.income / maxAccountValue) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 border-t border-[#e5e3d8] pt-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-[#c94c4c]/60" />
              <span className="text-[10px] font-bold text-[#7c8e88]">Expense</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-[#1f644e]/60" />
              <span className="text-[10px] font-bold text-[#7c8e88]">Income</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {accounts.map((account, index) => (
            <div
              key={`${account.name}-${index}`}
              className="rounded-xl border border-[#e5e3d8] bg-white p-4"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f5f2]">
                  <IconRenderer name={account.icon} className="h-5 w-5 text-[#7c8e88]" />
                </div>
                <span className="max-w-[10rem] truncate text-sm font-bold text-[#1e3a34]">
                  {account.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                    Expense
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm font-bold text-[#c94c4c]">
                    {formatCurrencyWithCompact(account.expense)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                    Income
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm font-bold text-[#1f644e]">
                    {formatCurrencyWithCompact(account.income)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6 pb-4 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto">
          {/* Summary */}
          <div className="mb-6">
            {/* Mobile: simple 2-column cards, no icons (match RecordsTab style) */}
            <div className="sm:hidden">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#e5e3d8] bg-white px-3 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7c8e88]">
                    Total Expense
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[#c94c4c]">
                    {analysis ? (
                      formatCurrencyWithCompact(analysis.totalExpense)
                    ) : (
                      <span className="text-[#7c8e88]">--</span>
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-[#e5e3d8] bg-white px-3 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7c8e88]">
                    Total Income
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[#1f644e]">
                    {analysis ? (
                      formatCurrencyWithCompact(analysis.totalIncome)
                    ) : (
                      <span className="text-[#7c8e88]">--</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Tablet & desktop: icon cards */}
            <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4">
              <div className="flex items-center gap-4 rounded-xl border border-[#e5e3d8] bg-white p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#c94c4c]/10">
                  <TrendingDown className="h-6 w-6 text-[#c94c4c]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                    Total Expense
                  </p>
                  <p className="mt-0.5 text-xl font-bold text-[#c94c4c]">
                    {analysis ? (
                      formatCurrencyWithCompact(analysis.totalExpense)
                    ) : (
                      <span className="text-[#7c8e88]">--</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border border-[#e5e3d8] bg-white p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1f644e]/10">
                  <TrendingUp className="h-6 w-6 text-[#1f644e]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                    Total Income
                  </p>
                  <p className="mt-0.5 text-xl font-bold text-[#1f644e]">
                    {analysis ? (
                      formatCurrencyWithCompact(analysis.totalIncome)
                    ) : (
                      <span className="text-[#7c8e88]">--</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            {/* Integrated TopTabs Component */}
            <TopTabs
              options={viewOptions}
              activeId={viewMode}
              onChange={(id) => setViewMode(id)}
              theme="green"
            />

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  disabled={isAnalysisLoading}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#e5e3d8] bg-white px-3 py-2 text-xs font-bold text-[#1e3a34] transition hover:bg-[#f8f9f4] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white sm:pr-3"
                >
                  <span className="hidden sm:inline">{selectedPeriod}</span>
                  <span className="sm:hidden">
                    <SlidersHorizontal className="h-4 w-4 text-[#7c8e88]" />
                  </span>
                </button>
                {showPeriodDropdown && (
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-xl border border-[#e5e3d8] bg-white py-1 shadow-lg">
                    {periodOptions.map((period) => (
                      <button
                        key={period}
                        onClick={() => handlePeriodChange(period)}
                        className={`w-full cursor-pointer px-3 py-2 text-left text-xs font-bold transition ${
                          selectedPeriod === period
                            ? 'bg-[#1f644e] text-white'
                            : 'text-[#7c8e88] hover:bg-[#f0f5f2]'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {analysisError && !analysis ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#f0d2d2] bg-white px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fef2f2]">
                <AlertTriangle className="h-8 w-8 text-[#c94c4c]" />
              </div>
              <p className="mb-1 text-sm font-bold text-[#1e3a34]">Couldn&apos;t load analysis</p>
              <p className="mb-4 text-xs text-[#7c8e88]">{analysisError}</p>
              <button
                onClick={() => fetchAnalysis(periodStart, periodEnd).catch(() => {})}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1f644e] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#17503e]"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          ) : !analysis ? (
            <div className="min-h-[18rem]" />
          ) : (
            <div
              className={`transition-opacity ${isRefreshingAnalysis ? 'opacity-80' : 'opacity-100'}`}
            >
              {(viewMode === 'expense' || viewMode === 'income') && renderCategoryOverview()}
              {viewMode === 'flow' && renderExpenseFlow()}
              {viewMode === 'accounts' && renderAccountAnalysis()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
