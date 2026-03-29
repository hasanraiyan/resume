'use client';

import { AlertTriangle } from 'lucide-react';
import { useMoney } from '@/context/MoneyContext';

export default function FinanceConflictBanner() {
  const { syncConflict, setActiveTab } = useMoney();

  if (!syncConflict) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-medium">
            Finance reset conflict detected. This device has offline changes after a remote
            clear-all.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('settings')}
          className="rounded-full bg-amber-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-950"
        >
          Review
        </button>
      </div>
    </div>
  );
}
