'use client';

import { useFinance } from '@/context/FinanceContext';
import { Card } from '@/components/ui';
import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { PurseSVG } from '@/components/pocketly-tracker/IconRenderer';

export default function SummaryCards() {
  const { balance, totalIncome, totalExpenses, monthlyBudget } = useFinance();

  const budgetRemaining = monthlyBudget - totalExpenses;

  const cards = [
    {
      title: 'Total Balance',
      value: balance,
      icon: PurseSVG,
      isNegative: balance < 0,
      accent: 'border-black',
    },
    {
      title: 'Total Income',
      value: totalIncome,
      icon: TrendingUp,
      isNegative: false,
      accent: 'border-neutral-400',
    },
    {
      title: 'Total Expenses',
      value: totalExpenses,
      icon: TrendingDown,
      isNegative: true,
      accent: 'border-neutral-400',
    },
    {
      title: 'Budget Remaining',
      value: budgetRemaining,
      icon: PiggyBank,
      isNegative: budgetRemaining < 0,
      accent: budgetRemaining < 0 ? 'border-neutral-400' : 'border-black',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card) => (
        <Card
          key={card.title}
          variant="bordered"
          className={`p-5 sm:p-6 rounded-2xl border-l-4 ${card.accent} hover-target`}
        >
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
              {card.title}
            </span>
            <card.icon className="w-5 h-5 text-neutral-400" strokeWidth={1.5} />
          </div>
          <div
            className={`text-2xl sm:text-3xl font-bold font-['Playfair_Display'] ${
              card.isNegative ? 'text-neutral-500' : 'text-black'
            }`}
          >
            {card.value < 0 ? '-' : ''}$
            {Math.abs(card.value).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
