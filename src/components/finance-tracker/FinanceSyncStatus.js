'use client';

import { useEffect, useMemo, useState } from 'react';
import { CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useMoney } from '@/context/MoneyContext';

function formatRelativeSyncTime(timestamp) {
  if (!timestamp) return 'Not synced yet';

  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMin < 1) return 'Synced just now';
  if (diffMin < 60) return `Synced ${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Synced ${diffHr}h ago`;

  return `Synced ${new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;
}

export default function FinanceSyncStatus() {
  const { pendingSyncCount, lastRemoteSyncAt, fetchData, isLoading } = useMoney();
  const [isOnline, setIsOnline] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setIsOnline(typeof navigator === 'undefined' ? true : navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const status = useMemo(() => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        label: pendingSyncCount > 0 ? `${pendingSyncCount} pending offline` : 'Offline',
        detail: 'Changes will sync when connection returns',
        tone: 'border-amber-200 bg-amber-50 text-amber-900',
      };
    }

    if (pendingSyncCount > 0) {
      return {
        icon: CloudOff,
        label: `${pendingSyncCount} pending sync`,
        detail: 'Queued local changes waiting to upload',
        tone: 'border-[#d6dfd9] bg-[#eef6f1] text-[#1f644e]',
      };
    }

    return {
      icon: Wifi,
      label: 'Synced',
      detail: formatRelativeSyncTime(lastRemoteSyncAt),
      tone: 'border-[#d6dfd9] bg-white text-[#1e3a34]',
    };
  }, [isOnline, lastRemoteSyncAt, pendingSyncCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${status.tone}`}>
        <StatusIcon className="h-3.5 w-3.5" />
        <div className="leading-none">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em]">{status.label}</p>
          <p className="mt-1 text-[11px] font-medium opacity-80">{status.detail}</p>
        </div>
      </div>
      <button
        onClick={handleRefresh}
        disabled={isLoading || isRefreshing}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d6dfd9] bg-white text-[#1f644e] transition hover:bg-[#f0f5f2] disabled:cursor-default disabled:opacity-60"
        aria-label="Refresh and sync finance data"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
