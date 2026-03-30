'use client';

import { useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useMoney } from '@/context/MoneyContext';

export default function FinanceSettingsTab() {
  const { clearFinanceData, fetchData } = useMoney();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAll = async () => {
    const confirmed = window.confirm('Clear all finance data? This cannot be undone.');
    if (!confirmed) return;

    setIsClearing(true);
    try {
      await clearFinanceData();
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="pb-4">
      {/* Content - Centered horizontally */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl px-4 pt-4 space-y-4">
          <div className="rounded-2xl border border-[#e5e3d8] bg-white p-4">
            <h3 className="text-sm font-bold text-[#1e3a34] mb-3">Finance Settings</h3>
            <p className="text-sm text-[#5f7069]">
              Refresh the latest finance data from the server or clear all finance records.
            </p>
            <button
              onClick={fetchData}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#d6dfd9] bg-[#f7faf7] px-4 py-2 text-sm font-bold text-[#1f644e] transition hover:bg-[#eef6f1]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Sync
            </button>
          </div>

          <div className="rounded-2xl border border-[#f0d2d2] bg-[#fff8f8] p-4">
            <h3 className="text-sm font-bold text-[#8f2f2f] mb-2">Danger Zone</h3>
            <p className="text-sm text-[#8f2f2f]/80">Clear all finance records from the server.</p>
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#c94c4c] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#b24040] disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {isClearing ? 'Clearing Data...' : 'Clear All Finance Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
