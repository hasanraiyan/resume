'use client';

import { useState } from 'react';
import { RefreshCw, Trash2, Database, Shield, Info } from 'lucide-react';
import { useMoney } from '@/context/MoneyContext';

export default function FinanceSettingsTab() {
  const { clearFinanceData, fetchData, isSyncing, accounts, transactions, categories } = useMoney();
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
    <div className="mb-6 pb-4 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          {/* Data Overview */}
          <div className="bg-white border border-[#e5e3d8] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#1f644e]/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-[#1f644e]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1e3a34]">Data Overview</h3>
                <p className="text-xs text-[#7c8e88]">Your current finance data</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#f0f5f2] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#1f644e]">{accounts.length}</p>
                <p className="text-xs text-[#7c8e88] mt-1 font-bold uppercase tracking-wider">
                  Accounts
                </p>
              </div>
              <div className="bg-[#f0f5f2] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#1f644e]">{transactions.length}</p>
                <p className="text-xs text-[#7c8e88] mt-1 font-bold uppercase tracking-wider">
                  Transactions
                </p>
              </div>
              <div className="bg-[#f0f5f2] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#1f644e]">{categories.length}</p>
                <p className="text-xs text-[#7c8e88] mt-1 font-bold uppercase tracking-wider">
                  Categories
                </p>
              </div>
            </div>
          </div>

          {/* Sync & Refresh */}
          <div className="bg-white border border-[#e5e3d8] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#4a86e8]/10 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-[#4a86e8]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1e3a34]">Sync & Refresh</h3>
                <p className="text-xs text-[#7c8e88]">Pull the latest data from the server</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#f7faf7] border border-[#d6dfd9] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#1f644e]" />
                <div>
                  <p className="text-sm font-bold text-[#1e3a34]">Refresh Data</p>
                  <p className="text-xs text-[#7c8e88]">Sync with the latest server records</p>
                </div>
              </div>
              <button
                onClick={fetchData}
                disabled={isSyncing}
                className="flex items-center gap-2 rounded-lg bg-[#1f644e] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#17503e] disabled:opacity-60 cursor-pointer shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* About */}
          <div className="bg-white border border-[#e5e3d8] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center">
                <Info className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1e3a34]">About</h3>
                <p className="text-xs text-[#7c8e88]">App information</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#e5e3d8]/50">
                <span className="text-sm text-[#7c8e88]">App</span>
                <span className="text-sm font-bold text-[#1e3a34]">MyMoney</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#e5e3d8]/50">
                <span className="text-sm text-[#7c8e88]">Storage</span>
                <span className="text-sm font-bold text-[#1e3a34]">Local + Server</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#7c8e88]">Status</span>
                <span className="text-sm font-bold text-[#1f644e]">Active</span>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-[#fef2f2] border border-[#f0d2d2] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#c94c4c]/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-[#c94c4c]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#c94c4c]">Danger Zone</h3>
                <p className="text-xs text-[#c94c4c]/70">Irreversible actions</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white border border-[#f0d2d2] rounded-xl p-4">
              <div>
                <p className="text-sm font-bold text-[#1e3a34]">Clear All Data</p>
                <p className="text-xs text-[#7c8e88] mt-0.5">
                  Permanently delete all accounts, transactions, categories, and budgets
                </p>
              </div>
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="flex items-center gap-2 rounded-lg bg-[#c94c4c] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#b24040] disabled:opacity-60 cursor-pointer shrink-0"
              >
                <Trash2 className="h-4 w-4" />
                {isClearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
