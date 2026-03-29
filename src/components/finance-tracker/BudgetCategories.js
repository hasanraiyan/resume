'use client';

import { useFinance } from '@/context/FinanceContext';
import { Card } from '@/components/ui';
import { Target } from 'lucide-react';

export default function BudgetCategories() {
  const { categorySpending, totalExpenses } = useFinance();

  return (
    <Card variant="bordered" className="rounded-2xl overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-['Playfair_Display'] text-black">
            Budget Overview
          </h2>
          <Target className="w-5 h-5 text-neutral-400" strokeWidth={1.5} />
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {categorySpending.map((cat) => {
          const percentage = Math.min((cat.spent / cat.budget) * 100, 100);
          const isOverBudget = cat.spent > cat.budget;

          return (
            <div key={cat.id} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-black">{cat.name}</span>
                <div className="text-right">
                  <span
                    className={`text-sm font-bold ${isOverBudget ? 'text-neutral-500' : 'text-black'}`}
                  >
                    ${cat.spent.toFixed(0)}
                  </span>
                  <span className="text-xs text-neutral-400 ml-1">/ ${cat.budget}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                    isOverBudget ? 'bg-neutral-400' : 'bg-black'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-neutral-400">{percentage.toFixed(0)}% used</span>
                <span
                  className={`text-xs font-medium ${
                    cat.remaining < 0 ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                >
                  {cat.remaining < 0 ? '-' : ''}${Math.abs(cat.remaining).toFixed(0)}{' '}
                  {cat.remaining < 0 ? 'over' : 'left'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
