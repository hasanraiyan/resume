'use client';

import { useState, useEffect, useCallback } from 'react';

export function BalanceBadge({ balance, loading, className = '' }) {
  if (loading && !balance) {
    return (
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0f5f2] border border-[#d4e6de] animate-pulse ${className}`}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#b5c4be]" />
        <div className="w-12 h-2 bg-[#b5c4be] rounded-full" />
      </div>
    );
  }

  if (!balance) return null;

  const isDepleted = balance.status === 'depleted';
  const isError =
    balance.status === 'error' ||
    balance.status === 'no_api_key' ||
    balance.status === 'invalid_api_key';

  if (isError) return null;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
        isDepleted || isError
          ? 'bg-red-50 text-red-600 border border-red-100'
          : 'bg-[#f0f5f2] text-[#1f644e] border border-[#d4e6de]'
      } ${className}`}
      title={balance.message}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          isDepleted || isError ? 'bg-red-500 animate-pulse' : 'bg-[#1f644e]'
        }`}
      />
      {isDepleted ? (
        <span>Zero Balance • Resets in {balance.resetIn}</span>
      ) : (
        <div className="flex flex-col">
          <span>
            AI Credits:{' '}
            {balance.balanceINR
              ? `₹${Number(balance.balanceINR).toFixed(2)}`
              : `$${Number(balance.balance || 0).toFixed(2)}`}
          </span>
          {balance.dailyStats && (
            <span className="text-[8px] text-[#7c8e88] -mt-0.5">
              Today: {(balance.dailyStats.totalTokens / 1000).toFixed(1)}k tokens ($
              {(balance.dailyStats.totalCostUSD || 0).toFixed(3)})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function useBalance() {
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/coursify/balance');
      const data = await res.json();
      setBalance(data);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setBalance({ status: 'error', message: 'Network or server error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, isLoading, refresh: fetchBalance };
}
