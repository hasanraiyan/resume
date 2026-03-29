'use client';

import { useFinance } from '@/context/FinanceContext';
import { Card } from '@/components/ui';
import { BarChart3 } from 'lucide-react';

export default function SpendingChart() {
  const { transactions } = useFinance();

  const getMonthlyData = () => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      const income = transactions
        .filter((t) => t.type === 'income' && t.date.startsWith(monthKey))
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = transactions
        .filter((t) => t.type === 'expense' && t.date.startsWith(monthKey))
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({ monthName, income, expense });
    }

    return months;
  };

  const data = getMonthlyData();
  const maxValue = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 100);

  return (
    <Card variant="bordered" className="rounded-2xl overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-['Playfair_Display'] text-black">
            Monthly Overview
          </h2>
          <BarChart3 className="w-5 h-5 text-neutral-400" strokeWidth={1.5} />
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Legend */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-black" />
            <span className="text-xs font-medium text-neutral-500">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-neutral-300" />
            <span className="text-xs font-medium text-neutral-500">Expenses</span>
          </div>
        </div>

        {/* Chart */}
        <div className="flex items-end justify-between gap-2 sm:gap-4 h-48">
          {data.map((month, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              {/* Bars */}
              <div className="flex items-end gap-1 w-full h-full">
                {/* Income bar */}
                <div
                  className="flex-1 bg-black rounded-t transition-all duration-700 ease-out hover:bg-neutral-800 cursor-pointer relative group"
                  style={{
                    height: `${(month.income / maxValue) * 100}%`,
                    minHeight: month.income > 0 ? '4px' : '0',
                  }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    ${month.income.toFixed(0)}
                  </div>
                </div>
                {/* Expense bar */}
                <div
                  className="flex-1 bg-neutral-300 rounded-t transition-all duration-700 ease-out hover:bg-neutral-400 cursor-pointer relative group"
                  style={{
                    height: `${(month.expense / maxValue) * 100}%`,
                    minHeight: month.expense > 0 ? '4px' : '0',
                  }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    ${month.expense.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* Label */}
              <span className="text-xs font-medium text-neutral-500">{month.monthName}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
