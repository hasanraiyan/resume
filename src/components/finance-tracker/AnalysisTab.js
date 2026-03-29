'use client';

import { useState, useEffect } from 'react';
import { useMoney } from '@/context/MoneyContext';
import { ChevronDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Shimmer } from './FinanceSkeletons';
import dynamic from 'next/dynamic';

const IconRenderer = dynamic(() => import('./IconRenderer'), { ssr: false });

const viewOptions = ['Expense overview', 'Income overview', 'Expense flow', 'Account analysis'];
const periodOptions = ['Daily', 'Weekly', 'Monthly', '3 Months', '6 Months', 'Yearly'];

export default function AnalysisTab() {
  const { analysis, fetchAnalysis, periodStart, periodEnd, setPeriod } = useMoney();
  const [viewMode, setViewMode] = useState('Expense overview');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
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
    setShowFilter(false);
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
  const currentCategories = viewMode === 'Income overview' ? incomeCategories : expenseCategories;
  const total = currentCategories.reduce((sum, item) => sum + item.total, 0) || 1;

  const dailyFlowMap = (analysis?.dailyFlow || []).reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = { expense: 0, income: 0 };
    }
    acc[entry.date][entry.type] = entry.total;
    return acc;
  }, {});
  const dailyEntries = Object.entries(dailyFlowMap);
  const maxDaily = Math.max(...dailyEntries.map(([, data]) => data.expense), 1);

  const accountData = (analysis?.accountAnalysis || []).reduce((acc, entry) => {
    const key = entry.accountId || entry.name;
    if (!acc[key]) {
      acc[key] = {
        name: entry.name,
        icon: entry.icon,
        expense: 0,
        income: 0,
      };
    }
    acc[key][entry.type] = entry.total;
    return acc;
  }, {});
  const maxAccountValue = Math.max(
    ...Object.values(accountData).flatMap((account) => [account.expense, account.income]),
    1
  );

  const DataSkeleton = () => (
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
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Shimmer className="w-6 h-6 rounded-full" />
              <Shimmer className="w-20 h-3.5" />
            </div>
            <Shimmer className="w-16 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <Shimmer className="flex-1 h-1.5 rounded-full" />
            <Shimmer className="w-10 h-3" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="pb-4">
      {/* Period Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <button className="text-[#1f644e] hover:bg-[#1f644e]/10 p-1 rounded">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-[#1f644e]">{formatPeriodRange()}</span>
        <div className="flex items-center gap-1">
          <button className="text-[#1f644e] hover:bg-[#1f644e]/10 p-1 rounded">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="text-[#1f644e] hover:bg-[#1f644e]/10 p-1 rounded"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex text-center border-b border-[#e5e3d8] pb-2 mb-4 mx-4">
        <div className="flex-1">
          <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1">
            Expense
          </div>
          <div className="text-sm font-bold text-[#c94c4c]">
            {analysis ? (
              `₹${analysis.totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            ) : (
              <Shimmer className="w-20 h-4 mx-auto" />
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1">
            Income
          </div>
          <div className="text-sm font-bold text-[#5cb85c]">
            {analysis ? (
              `₹${analysis.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            ) : (
              <Shimmer className="w-20 h-4 mx-auto" />
            )}
          </div>
        </div>
      </div>

      {/* View Dropdown */}
      <div className="flex justify-center mb-6 relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="border border-[#1f644e] text-[#1f644e] rounded px-4 py-1.5 text-sm font-bold flex items-center gap-2 bg-white uppercase"
        >
          {viewMode} <ChevronDown className="w-4 h-4" />
        </button>
        {showDropdown && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-[#e5e3d8] rounded shadow-lg w-52 z-20 text-sm">
            {viewOptions.map((opt) => (
              <div
                key={opt}
                onClick={() => {
                  setViewMode(opt);
                  setShowDropdown(false);
                }}
                className={`px-4 py-2.5 hover:bg-[#f0f5f2] cursor-pointer first:rounded-t last:rounded-b ${
                  viewMode === opt ? 'font-bold text-[#1f644e]' : 'text-[#7c8e88]'
                }`}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="mx-4 mb-4 p-3 bg-white border border-[#e5e3d8] rounded-lg animate-in slide-in-from-top duration-200">
          <p className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-2">
            View mode
          </p>
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded transition ${
                  selectedPeriod === p
                    ? 'bg-[#1f644e] text-white'
                    : 'bg-[#f0f5f2] text-[#7c8e88] hover:bg-[#d6dfd9]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading / Data */}
      {!analysis ? (
        <DataSkeleton />
      ) : (
        <>
          {/* Expense/Income Overview */}
          {(viewMode === 'Expense overview' || viewMode === 'Income overview') && (
            <div className="px-4">
              {/* Donut Chart */}
              {currentCategories.length > 0 && (
                <div className="flex items-center gap-4 mb-6 justify-center">
                  <svg width="140" height="140" className="-rotate-90">
                    <circle cx="70" cy="70" r="48" fill="none" stroke="#e5e3d8" strokeWidth="28" />
                    {(() => {
                      let cum = 0;
                      const colors = ['#1f644e', '#2d8a6e', '#3ba88a', '#5cbfa6', '#7ed6c2'];
                      return currentCategories.slice(0, 5).map((cat, i) => {
                        const pct = cat.total / total;
                        const circ = 2 * Math.PI * 48;
                        const dash = circ * pct;
                        const offset = -circ * cum;
                        cum += pct;
                        return (
                          <circle
                            key={cat.categoryId || i}
                            cx="70"
                            cy="70"
                            r="48"
                            fill="none"
                            stroke={colors[i]}
                            strokeWidth="28"
                            strokeDasharray={`${dash} ${circ - dash}`}
                            strokeDashoffset={offset}
                            className="transition-all duration-700"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="space-y-1.5">
                    {currentCategories.slice(0, 5).map((cat, i) => {
                      const colors = [
                        'bg-[#1f644e]',
                        'bg-[#2d8a6e]',
                        'bg-[#3ba88a]',
                        'bg-[#5cbfa6]',
                        'bg-[#7ed6c2]',
                      ];
                      return (
                        <div key={cat.categoryId || i} className="flex items-center gap-2 text-xs">
                          <div className={`w-2.5 h-2.5 rounded-full ${colors[i]}`} />
                          <span className="text-[#7c8e88] w-16 truncate">{cat.name}</span>
                          <span className="font-bold">
                            {((cat.total / total) * 100).toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category Bars */}
              <div className="space-y-3">
                {currentCategories.map((cat, i) => {
                  const pct = ((cat.total / total) * 100).toFixed(2);
                  return (
                    <div key={cat.categoryId || i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#1f644e] flex items-center justify-center text-white">
                            <IconRenderer name={cat.icon} className="w-3 h-3" />
                          </div>
                          <span className="text-sm font-bold">{cat.name}</span>
                        </div>
                        <span className="text-sm font-bold text-[#c94c4c]">
                          -₹{cat.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#e5e3d8] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1f644e] rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#7c8e88] w-10 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expense Flow */}
          {viewMode === 'Expense flow' && (
            <div className="px-4">
              <div className="h-48 mb-2 border-b border-[#e5e3d8] pb-2">
                <div className="h-full flex items-end gap-1">
                  {dailyEntries.map(([date, data], i) => {
                    const height = (data.expense / maxDaily) * 100;
                    return (
                      <div
                        key={date}
                        className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                      >
                        <div className="absolute -top-6 text-[9px] font-bold text-[#c94c4c] opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                          ₹{data.expense.toFixed(0)}
                        </div>
                        <div
                          className="w-full bg-[#c94c4c]/80 rounded-t hover:bg-[#c94c4c] transition-all"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-[#e5e3d8] pt-2 text-[10px] font-bold text-[#1f644e] text-center mb-2">
                {formatPeriodRange()}
              </div>
              <div className="flex text-center text-xs text-[#7c8e88] border-b border-[#e5e3d8] pb-1">
                {dailyEntries.map(([date]) => (
                  <div key={date} className="flex-1">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                ))}
              </div>
              <div className="flex text-center text-[10px] pt-1 text-[#7c8e88]">
                {dailyEntries.map(([date, data]) => (
                  <div key={date} className="flex-1 border-l border-[#e5e3d8] first:border-0">
                    <div>{new Date(date).getDate()}</div>
                    <div className={data.expense > 0 ? 'text-[#c94c4c] font-bold' : '.'}>
                      {data.expense > 0 ? `-₹${(data.expense / 1000).toFixed(1)}k` : '.'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Analysis */}
          {viewMode === 'Account analysis' && (
            <div className="px-4">
              <div className="flex justify-end mb-2 text-[10px] font-bold items-center gap-3 text-[#7c8e88]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#c94c4c]" /> Expense
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#5cb85c]" /> Income
                </div>
              </div>
              <div className="h-48 mb-6 border-b border-[#e5e3d8] pb-2">
                <div className="h-full flex items-end gap-2">
                  {Object.values(accountData).map((account, i) => (
                    <div key={i} className="flex-1 flex gap-0.5 items-end h-full">
                      <div
                        className="flex-1 bg-[#c94c4c]/60 rounded-t transition-all duration-700"
                        style={{ height: `${(account.expense / maxAccountValue) * 100}%` }}
                      />
                      <div
                        className="flex-1 bg-[#5cb85c]/60 rounded-t transition-all duration-700"
                        style={{ height: `${(account.income / maxAccountValue) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {Object.values(accountData).map((account, i) => (
                  <div
                    key={i}
                    className="border border-[#e5e3d8] bg-[#faf9ed] rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <IconRenderer name={account.icon} className="w-5 h-5 text-[#7c8e88]" />
                      <span className="font-bold text-sm">{account.name}</span>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-[#c94c4c]">-₹{account.expense.toLocaleString()}</div>
                      <div className="text-[#5cb85c]">+₹{account.income.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
