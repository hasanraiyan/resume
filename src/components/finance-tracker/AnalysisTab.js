'use client';

import { useState, useEffect } from 'react';
import { useMoney } from '@/context/MoneyContext';
import {
  ChevronDown,
  TrendingDown,
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowLeftRight,
} from 'lucide-react';
import { PurseSVG } from '@/components/finance-tracker/IconRenderer';
import { Shimmer } from './FinanceSkeletons';
import dynamic from 'next/dynamic';

const IconRenderer = dynamic(() => import('./IconRenderer'), { ssr: false });

const viewOptions = [
  { id: 'expense', label: 'Expense', icon: TrendingDown },
  { id: 'income', label: 'Income', icon: TrendingUp },
  { id: 'flow', label: 'Flow', icon: BarChart3 },
  { id: 'accounts', label: 'Accounts', icon: PurseSVG },
];

const periodOptions = ['Daily', 'Weekly', 'Monthly', '3 Months', '6 Months', 'Yearly'];

export default function AnalysisTab() {
  const { analysis, fetchAnalysis, periodStart, periodEnd, setPeriod } = useMoney();
  const [viewMode, setViewMode] = useState('expense');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Weekly');

  useEffect(() => {
    fetchAnalysis(periodStart, periodEnd);
  }, [fetchAnalysis, periodStart, periodEnd]);

  const handlePeriodChange = (period) => {
    const now = new Date();
    const start = new Date();
    switch (period) {
      case 'Daily':
        start.setHours(0, 0, 0, 0);
        break;
      case 'Weekly':
        start.setDate(now.getDate() - 7);
        break;
      case 'Monthly':
        start.setMonth(now.getMonth() - 1);
        break;
      case '3 Months':
        start.setMonth(now.getMonth() - 3);
        break;
      case '6 Months':
        start.setMonth(now.getMonth() - 6);
        break;
      case 'Yearly':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    setSelectedPeriod(period);
    setPeriod(start.toISOString(), now.toISOString());
    setShowPeriodDropdown(false);
  };

  const formatPeriodRange = () => {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const opts = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
  };

  const expenseCategories =
    analysis?.categoryBreakdown?.filter((item) => item.type === 'expense') || [];
  const incomeCategories =
    analysis?.categoryBreakdown?.filter((item) => item.type === 'income') || [];
  const currentCategories = viewMode === 'income' ? incomeCategories : expenseCategories;
  const total = currentCategories.reduce((sum, item) => sum + item.total, 0) || 1;

  const dailyFlowMap = (analysis?.dailyFlow || []).reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = { expense: 0, income: 0 };
    }
    acc[entry.date][entry.type] = entry.total;
    return acc;
  }, {});
  const dailyEntries = Object.entries(dailyFlowMap);
  const maxDaily = Math.max(
    ...dailyEntries.map(([, data]) => Math.max(data.expense, data.income)),
    1
  );

  const accountData = (analysis?.accountAnalysis || []).reduce((acc, entry) => {
    const key = entry.accountId || entry.name;
    if (!acc[key]) {
      acc[key] = { name: entry.name, icon: entry.icon, expense: 0, income: 0 };
    }
    acc[key][entry.type] = entry.total;
    return acc;
  }, {});
  const maxAccountValue = Math.max(
    ...Object.values(accountData).flatMap((account) => [account.expense, account.income]),
    1
  );

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

  const EmptyState = ({ title, description }) => (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-[#f0f5f2] flex items-center justify-center mb-4">
        <PieChart className="w-8 h-8 text-[#7c8e88]" />
      </div>
      <p className="text-sm font-bold text-[#1e3a34] mb-1">{title}</p>
      <p className="text-xs text-[#7c8e88] text-center">{description}</p>
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

    return (
      <div className="space-y-6">
        {/* Donut Chart + Legend */}
        <div className="bg-white border border-[#e5e3d8] rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut */}
            <div className="relative shrink-0">
              <svg width="160" height="160" className="-rotate-90">
                <circle cx="80" cy="80" r="56" fill="none" stroke="#f0f5f2" strokeWidth="24" />
                {(() => {
                  let cum = 0;
                  return currentCategories.slice(0, 6).map((cat, i) => {
                    const pct = cat.total / total;
                    const circ = 2 * Math.PI * 56;
                    const dash = circ * pct;
                    const offset = -circ * cum;
                    cum += pct;
                    return (
                      <circle
                        key={cat.categoryId || i}
                        cx="80"
                        cy="80"
                        r="56"
                        fill="none"
                        stroke={chartColors[i % chartColors.length]}
                        strokeWidth="24"
                        strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={offset}
                        className="transition-all duration-700"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                  Total
                </span>
                <span className="text-lg font-bold text-[#1e3a34]">
                  ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
              {currentCategories.slice(0, 6).map((cat, i) => (
                <div key={cat.categoryId || i} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: chartColors[i % chartColors.length] }}
                  />
                  <span className="text-xs text-[#7c8e88] truncate flex-1">{cat.name}</span>
                  <span className="text-xs font-bold text-[#1e3a34]">
                    {((cat.total / total) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Bars */}
        <div className="bg-white border border-[#e5e3d8] rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#1e3a34] mb-4">Breakdown</h3>
          <div className="space-y-4">
            {currentCategories.map((cat, i) => {
              const pct = (cat.total / total) * 100;
              return (
                <div key={cat.categoryId || i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: chartColors[i % chartColors.length] }}
                      >
                        <IconRenderer name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-[#1e3a34]">{cat.name}</span>
                    </div>
                    <span className="text-sm font-bold text-[#1e3a34]">
                      ₹{cat.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[#f0f5f2] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: chartColors[i % chartColors.length],
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#7c8e88] w-10 text-right">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
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
      <div className="bg-white border border-[#e5e3d8] rounded-xl p-6">
        <h3 className="text-sm font-bold text-[#1e3a34] mb-4">Daily Flow</h3>
        <div className="h-48 flex items-end gap-1.5 mb-4">
          {dailyEntries.map(([date, data], i) => {
            const height = (data.expense / maxDaily) * 100;
            const incomeHeight = (data.income / maxDaily) * 100;
            return (
              <div
                key={date}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1e3a34] text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                  ₹{data.expense.toFixed(0)}
                </div>
                <div className="w-full flex gap-0.5 items-end h-full">
                  <div
                    className="flex-1 bg-[#c94c4c]/70 rounded-t-sm hover:bg-[#c94c4c] transition-all"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <div
                    className="flex-1 bg-[#1f644e]/70 rounded-t-sm hover:bg-[#1f644e] transition-all"
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
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[#e5e3d8]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#c94c4c]/70" />
            <span className="text-[10px] font-bold text-[#7c8e88]">Expense</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#1f644e]/70" />
            <span className="text-[10px] font-bold text-[#7c8e88]">Income</span>
          </div>
        </div>
      </div>
    );
  };

  const renderAccountAnalysis = () => {
    const accounts = Object.values(accountData);
    if (accounts.length === 0) {
      return <EmptyState title="No account data" description="Account activity will appear here" />;
    }

    return (
      <div className="space-y-4">
        {/* Chart */}
        <div className="bg-white border border-[#e5e3d8] rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#1e3a34] mb-4">Account Activity</h3>
          <div className="h-40 flex items-end gap-2 mb-4">
            {accounts.map((account, i) => (
              <div key={i} className="flex-1 flex gap-0.5 items-end h-full">
                <div
                  className="flex-1 bg-[#c94c4c]/60 rounded-t-sm transition-all duration-700"
                  style={{ height: `${(account.expense / maxAccountValue) * 100}%` }}
                />
                <div
                  className="flex-1 bg-[#1f644e]/60 rounded-t-sm transition-all duration-700"
                  style={{ height: `${(account.income / maxAccountValue) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-[#e5e3d8]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#c94c4c]/60" />
              <span className="text-[10px] font-bold text-[#7c8e88]">Expense</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#1f644e]/60" />
              <span className="text-[10px] font-bold text-[#7c8e88]">Income</span>
            </div>
          </div>
        </div>

        {/* Account Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map((account, i) => (
            <div key={i} className="bg-white border border-[#e5e3d8] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#f0f5f2] flex items-center justify-center">
                  <IconRenderer name={account.icon} className="w-5 h-5 text-[#7c8e88]" />
                </div>
                <span className="text-sm font-bold text-[#1e3a34]">{account.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                    Expense
                  </p>
                  <p className="text-sm font-bold text-[#c94c4c] mt-0.5">
                    ₹{account.expense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                    Income
                  </p>
                  <p className="text-sm font-bold text-[#1f644e] mt-0.5">
                    ₹{account.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-[#e5e3d8] rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#c94c4c]/10 flex items-center justify-center shrink-0">
                <TrendingDown className="w-6 h-6 text-[#c94c4c]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider">
                  Total Expense
                </p>
                <p className="text-xl font-bold text-[#c94c4c] mt-0.5">
                  {analysis ? (
                    `₹${analysis.totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                  ) : (
                    <Shimmer className="w-20 h-5" />
                  )}
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#e5e3d8] rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1f644e]/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-[#1f644e]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider">
                  Total Income
                </p>
                <p className="text-xl font-bold text-[#1f644e] mt-0.5">
                  {analysis ? (
                    `₹${analysis.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                  ) : (
                    <Shimmer className="w-20 h-5" />
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            {/* View Tabs */}
            <div className="flex bg-white border border-[#e5e3d8] rounded-xl p-1 gap-0.5">
              {viewOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setViewMode(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    viewMode === opt.id
                      ? 'bg-[#1f644e] text-white shadow-sm'
                      : 'text-[#7c8e88] hover:text-[#1e3a34]'
                  }`}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Period Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center gap-2 bg-white border border-[#e5e3d8] rounded-xl px-3 py-2 text-xs font-bold text-[#1e3a34] hover:bg-[#f8f9f4] transition cursor-pointer"
              >
                {selectedPeriod}
                <ChevronDown className="w-3.5 h-3.5 text-[#7c8e88]" />
              </button>
              {showPeriodDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#e5e3d8] rounded-xl shadow-lg py-1 z-20 min-w-[140px]">
                  {periodOptions.map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePeriodChange(p)}
                      className={`w-full text-left px-3 py-2 text-xs font-bold transition cursor-pointer ${
                        selectedPeriod === p
                          ? 'bg-[#1f644e] text-white'
                          : 'text-[#7c8e88] hover:bg-[#f0f5f2]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          {!analysis ? (
            <div className="px-4 space-y-3 mt-4">
              <div className="flex items-center gap-4 mb-6 justify-center">
                <Shimmer className="w-[140px] h-[140px] rounded-full" />
                <div className="space-y-2.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Shimmer className="w-2.5 h-2.5 rounded-full" />
                      <Shimmer className="w-16 h-3" />
                      <Shimmer className="w-10 h-3" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {(viewMode === 'expense' || viewMode === 'income') && renderCategoryOverview()}
              {viewMode === 'flow' && renderExpenseFlow()}
              {viewMode === 'accounts' && renderAccountAnalysis()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
