'use client';

import { useState } from 'react';
import { useMoney } from '@/context/MoneyContext';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import dynamic from 'next/dynamic';

const IconRenderer = dynamic(() => import('./IconRenderer'), { ssr: false });

export default function RecordsTab() {
  const { transactions, totalExpense, totalIncome, periodStart, periodEnd, setPeriod } = useMoney();
  const [showFilter, setShowFilter] = useState(false);

  const navigateWeek = (direction) => {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    start.setDate(start.getDate() + direction * 7);
    end.setDate(end.getDate() + direction * 7);
    setPeriod(start.toISOString(), end.toISOString());
  };

  const formatPeriodRange = () => {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const opts = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
  };

  const grouped = transactions.reduce((groups, t) => {
    const dateKey = new Date(t.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'long',
    });
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(t);
    return groups;
  }, {});

  const formatAmount = (amount, type) => {
    const formatted = Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    if (type === 'transfer') return `₹${formatted}`;
    return `${type === 'expense' ? '-' : '+'}₹${formatted}`;
  };

  const getAmountClass = (type) => {
    if (type === 'expense') return 'text-[#c94c4c]';
    if (type === 'income') return 'text-[#5cb85c]';
    return 'text-[#1e3a34]';
  };

  const netBalance = totalIncome - totalExpense;

  return (
    <div className="pb-4">
      {/* Period Header - Full width, left-aligned */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <button
          onClick={() => navigateWeek(-1)}
          className="text-[#1f644e] hover:bg-[#1f644e]/10 p-1 rounded transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-[#1f644e]">{formatPeriodRange()}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateWeek(1)}
            className="text-[#1f644e] hover:bg-[#1f644e]/10 p-1 rounded transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="text-[#1f644e] hover:bg-[#1f644e]/10 p-1 rounded transition"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content - Centered horizontally */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          {/* Summary Bar */}
          <div className="flex text-center border-b border-[#e5e3d8] pb-2 mb-4 px-4">
            <div className="flex-1">
              <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1">
                Expense
              </div>
              <div className="text-sm font-bold text-[#c94c4c]">
                ₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1">
                Income
              </div>
              <div className="text-sm font-bold text-[#5cb85c]">
                ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1">
                Balance
              </div>
              <div
                className={`text-sm font-bold ${netBalance < 0 ? 'text-[#c94c4c]' : 'text-[#1e3a34]'}`}
              >
                {netBalance < 0 ? '-' : ''}₹
                {Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Transaction Groups */}
          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-[#7c8e88] text-sm">No transactions for this period</p>
            </div>
          ) : (
            Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel} className="px-4 mb-4">
                <div className="border-b-2 border-[#1e3a34] text-xs font-bold pb-1 mb-2">
                  {dateLabel}
                </div>
                {items.map((t) => {
                  const isExpense = t.type === 'expense';
                  const isTransfer = t.type === 'transfer';
                  const catIcon = t.category?.icon || 'category';
                  const catName = t.category?.name || 'Uncategorized';

                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-3 border-b border-[#e5e3d8]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${
                            isTransfer
                              ? 'bg-[#4a86e8]'
                              : isExpense
                                ? 'bg-[#1f644e]'
                                : 'bg-[#5cb85c]'
                          }`}
                        >
                          <IconRenderer
                            name={isTransfer ? 'arrow-left-right' : catIcon}
                            className="w-[18px] h-[18px]"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            {isTransfer ? 'Transfer' : catName}
                          </div>
                          <div className="text-[11px] text-[#7c8e88] flex items-center gap-1 mt-0.5">
                            {isTransfer ? (
                              <>
                                {t.account?.name || 'Account'}
                                <span className="material-icons-outlined text-[10px]">
                                  arrow_forward
                                </span>
                                {t.toAccount?.name || 'Account'}
                              </>
                            ) : (
                              t.account?.name || 'Account'
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold text-sm tabular-nums ${getAmountClass(t.type)}`}>
                        {formatAmount(t.amount, t.type)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
