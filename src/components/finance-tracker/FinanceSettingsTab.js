'use client';

import { useState } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { useMoney } from '@/context/MoneyContext';

function formatSyncTime(timestamp) {
  if (!timestamp) return 'Not synced yet';
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function FinanceSettingsTab() {
  const {
    pendingSyncCount,
    lastRemoteSyncAt,
    syncConflict,
    financeResetVersion,
    clearFinanceData,
    clearLocalCache,
    acceptRemoteReset,
    fetchData,
  } = useMoney();
  const [isClearing, setIsClearing] = useState(false);
  const [isClearingLocal, setIsClearingLocal] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      'Clear all finance data on this account across synced devices? This cannot be undone.'
    );
    if (!confirmed) return;

    setIsClearing(true);
    try {
      await clearFinanceData();
    } finally {
      setIsClearing(false);
    }
  };

  const handleAcceptRemoteReset = async () => {
    setIsResolving(true);
    try {
      await acceptRemoteReset();
    } finally {
      setIsResolving(false);
    }
  };

  const handleClearLocalCache = async () => {
    const confirmed = window.confirm(
      'Clear this device only? Local finance cache and pending offline changes will be removed, but synced server data will remain.'
    );
    if (!confirmed) return;

    setIsClearingLocal(true);
    try {
      await clearLocalCache();
    } finally {
      setIsClearingLocal(false);
    }
  };

  return (
    <div className="px-4 pb-6 pt-4 space-y-4">
      <div className="rounded-2xl border border-[#e5e3d8] bg-white p-4">
        <h3 className="text-sm font-bold text-[#1e3a34] mb-3">Sync Status</h3>
        <div className="space-y-2 text-sm text-[#5f7069]">
          <p>Pending changes: {pendingSyncCount}</p>
          <p>Last synced: {formatSyncTime(lastRemoteSyncAt)}</p>
          <p>Reset version: {financeResetVersion}</p>
        </div>
        <button
          onClick={fetchData}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#d6dfd9] bg-[#f7faf7] px-4 py-2 text-sm font-bold text-[#1f644e] transition hover:bg-[#eef6f1]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Sync
        </button>
      </div>

      {syncConflict && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">Remote Reset Conflict</h3>
              <p className="mt-2 text-sm text-amber-900/80">
                Another device cleared all finance data while this device still had offline changes.
                Review this before syncing again.
              </p>
              <button
                onClick={handleAcceptRemoteReset}
                disabled={isResolving}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-950 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {isResolving
                  ? 'Discarding Local Changes...'
                  : 'Discard Local Changes and Accept Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#d6dfd9] bg-white p-4">
        <h3 className="text-sm font-bold text-[#1e3a34] mb-2">Local Device Cache</h3>
        <p className="text-sm text-[#5f7069]">
          Clear only this device&apos;s local finance cache and pending offline changes. Synced
          finance data on the server and other devices will remain untouched.
        </p>
        <button
          onClick={handleClearLocalCache}
          disabled={isClearingLocal}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#d6dfd9] bg-[#f7faf7] px-4 py-2 text-sm font-bold text-[#1f644e] transition hover:bg-[#eef6f1] disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          {isClearingLocal ? 'Clearing Local Cache...' : 'Clear Local Cache Only'}
        </button>
      </div>

      <div className="rounded-2xl border border-[#f0d2d2] bg-[#fff8f8] p-4">
        <h3 className="text-sm font-bold text-[#8f2f2f] mb-2">Danger Zone</h3>
        <p className="text-sm text-[#8f2f2f]/80">
          Clear all finance records across synced devices. Offline devices with unsynced changes
          will be forced into reset conflict handling when they reconnect.
        </p>
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
  );
}
