'use client';

import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Trash2,
  Database,
  Shield,
  Info,
  Download,
  Plug,
  Unlink,
  Loader2,
  Smartphone,
  QrCode,
  Bell,
  Save,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useMoney } from '@/context/MoneyContext';
import ExportModal from './ExportModal';

const getConnectionLabel = (app) => {
  if (app.channel === 'android') return 'Mobile';
  return app.channel?.toUpperCase() || 'App';
};

export default function FinanceSettingsTab() {
  const { clearFinanceData, fetchData, isSyncing, accounts, categories, stats } = useMoney();
  const [isClearing, setIsClearing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [baseUrl, setBaseUrl] = useState('');
  const [isReminderLoading, setIsReminderLoading] = useState(true);
  const [isReminderSaving, setIsReminderSaving] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({});
  const [reminderStatus, setReminderStatus] = useState(null);
  const [loadingApps, setLoadingApps] = useState(false);
  const [connectedApps, setConnectedApps] = useState([]);
  const [revokingId, setRevokingId] = useState(null);
  const [mobileQr, setMobileQr] = useState(null);
  const [mobileQrLoading, setMobileQrLoading] = useState(false);
  const [mobileQrExpiry, setMobileQrExpiry] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin.replace(/\/$/, '');
      setBaseUrl(origin);
    }
  }, []);

  useEffect(() => {
    async function loadReminderSettings() {
      setIsReminderLoading(true);
      try {
        const res = await fetch('/api/money/reminder-settings');
        const data = await res.json();
        if (!res.ok || data.success === false) {
          throw new Error(data.message || 'Failed to load reminder settings');
        }
        setReminderSettings((prev) => ({ ...prev, ...(data.settings || {}) }));
      } catch (error) {
        console.error('Failed to load reminder settings:', error);
        setReminderStatus({ type: 'error', message: error.message || 'Failed to load reminder' });
      } finally {
        setIsReminderLoading(false);
      }
    }

    loadReminderSettings();
  }, []);

  // Load connected apps
  useEffect(() => {
    async function loadApps() {
      setLoadingApps(true);
      try {
        const res = await fetch('/api/user/connected-apps');
        if (res.ok) {
          const data = await res.json();
          setConnectedApps(data);
        }
      } catch (e) {
        console.error('Failed to load connected apps:', e);
      } finally {
        setLoadingApps(false);
      }
    }
    loadApps();
  }, []);

  const handleRevoke = async (appId) => {
    if (!appId) return;
    setRevokingId(appId);
    try {
      const res = await fetch(`/api/user/connected-apps/${appId}`, { method: 'DELETE' });
      if (res.ok) {
        setConnectedApps((prev) => prev.filter((a) => a.id !== appId));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to revoke access');
      }
    } catch (e) {
      console.error('Revoke error:', e);
      alert('Failed to revoke access');
    } finally {
      setRevokingId(null);
    }
  };

  const handleGenerateMobileQr = async () => {
    setMobileQrLoading(true);
    setMobileQr(null);
    try {
      const res = await fetch('/api/mobile/token');
      const data = await res.json();
      if (data.success) {
        setMobileQr(JSON.stringify({ baseUrl: data.baseUrl, token: data.token }));
        setMobileQrExpiry(data.expiresAt);
        const appsRes = await fetch('/api/user/connected-apps');
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setConnectedApps(appsData);
        }
      }
    } catch (e) {
      console.error('Failed to generate mobile QR:', e);
    } finally {
      setMobileQrLoading(false);
    }
  };

  const handleReminderChange = (key, value) => {
    setReminderStatus(null);
    setReminderSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveReminderSettings = async () => {
    setIsReminderSaving(true);
    setReminderStatus(null);
    try {
      const res = await fetch('/api/money/reminder-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: reminderSettings.isEnabled,
          reminderTime: reminderSettings.reminderTime,
          timezone: reminderSettings.timezone,
          reminderMode: reminderSettings.reminderMode,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to save reminder settings');
      }
      setReminderSettings((prev) => ({ ...prev, ...(data.settings || {}) }));
      setReminderStatus({ type: 'success', message: 'Reminder settings saved' });
    } catch (error) {
      console.error('Failed to save reminder settings:', error);
      setReminderStatus({ type: 'error', message: error.message || 'Failed to save reminder' });
    } finally {
      setIsReminderSaving(false);
    }
  };

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
    <div className="mb-6 pb-4 pt-3 sm:pt-6">
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* Data Overview */}
          <div className="bg-white border border-[#e5e3d8] rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1f644e]/10 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-[#1f644e]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#1e3a34]">Data Overview</h3>
                <p className="text-xs text-[#7c8e88]">Your current finance data</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-[#f0f5f2] rounded-xl px-2 py-3 text-center min-w-0 sm:p-4">
                <p className="text-xl sm:text-2xl font-bold text-[#1f644e]">{accounts.length}</p>
                <p className="mt-1 break-words text-[10px] font-bold uppercase leading-tight tracking-normal text-[#7c8e88] sm:text-xs sm:tracking-wider">
                  Accounts
                </p>
              </div>
              <div className="bg-[#f0f5f2] rounded-xl px-2 py-3 text-center min-w-0 sm:p-4">
                <p className="text-xl sm:text-2xl font-bold text-[#1f644e]">
                  {stats.totalTransactionCount}
                </p>
                <p className="mt-1 break-words text-[10px] font-bold uppercase leading-tight tracking-normal text-[#7c8e88] sm:text-xs sm:tracking-wider">
                  Transactions
                </p>
              </div>
              <div className="bg-[#f0f5f2] rounded-xl px-2 py-3 text-center min-w-0 sm:p-4">
                <p className="text-xl sm:text-2xl font-bold text-[#1f644e]">{categories.length}</p>
                <p className="mt-1 break-words text-[10px] font-bold uppercase leading-tight tracking-normal text-[#7c8e88] sm:text-xs sm:tracking-wider">
                  Categories
                </p>
              </div>
            </div>
          </div>

          {/* Sync & Refresh */}
          <div className="bg-white border border-[#e5e3d8] rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#4a86e8]/10 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-[#4a86e8]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#1e3a34]">Sync & Refresh</h3>
                <p className="text-xs text-[#7c8e88]">Pull the latest data from the server</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-[#f7faf7] border border-[#d6dfd9] rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <Shield className="w-5 h-5 text-[#1f644e] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1e3a34]">Refresh Data</p>
                  <p className="text-xs text-[#7c8e88]">Sync with the latest server records</p>
                </div>
              </div>
              <button
                onClick={fetchData}
                disabled={isSyncing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f644e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17503e] disabled:opacity-60 cursor-pointer sm:w-auto sm:shrink-0 sm:py-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Daily Reminder */}
          <div className="bg-white border border-[#e5e3d8] rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1f644e]/10 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-[#1f644e]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#1e3a34]">Daily Reminder</h3>
                <p className="text-xs text-[#7c8e88]">
                  Telegram nudges when you forget to log transactions
                </p>
              </div>
            </div>

            {isReminderLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#7c8e88]" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 bg-[#f7faf7] border border-[#d6dfd9] rounded-xl p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1e3a34]">Telegram reminder</p>
                    <p className="text-xs text-[#7c8e88] mt-0.5">
                      Uses the Telegram bot configured in admin settings
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={reminderSettings.isEnabled}
                      onChange={(event) => handleReminderChange('isEnabled', event.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="h-6 w-11 rounded-full bg-[#d6dfd9] transition peer-checked:bg-[#1f644e]" />
                    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-2">
                      Reminder time
                    </label>
                    <input
                      type="time"
                      value={reminderSettings.reminderTime}
                      onChange={(event) => handleReminderChange('reminderTime', event.target.value)}
                      className="w-full rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] px-3 py-3 text-sm font-bold text-[#1e3a34] outline-none focus:border-[#1f644e] sm:py-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-2">
                      Mode
                    </label>
                    <select
                      value={reminderSettings.reminderMode}
                      onChange={(event) => handleReminderChange('reminderMode', event.target.value)}
                      className="w-full rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] px-3 py-3 text-sm font-bold text-[#1e3a34] outline-none focus:border-[#1f644e] sm:py-2.5"
                    >
                      <option value="if_no_transactions">Only if no transactions today</option>
                      <option value="always">Always remind me daily</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-2">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={reminderSettings.timezone}
                      onChange={(event) => handleReminderChange('timezone', event.target.value)}
                      className="w-full rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] px-3 py-3 text-sm font-bold text-[#1e3a34] outline-none focus:border-[#1f644e] sm:py-2.5"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-[#7c8e88] min-w-0">
                    {reminderSettings.lastReminderSentAt ? (
                      <>
                        Last sent {new Date(reminderSettings.lastReminderSentAt).toLocaleString()}
                      </>
                    ) : (
                      'No reminder has been sent yet'
                    )}
                  </div>
                  <button
                    onClick={handleSaveReminderSettings}
                    disabled={isReminderSaving}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f644e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17503e] disabled:opacity-60 cursor-pointer sm:w-auto sm:py-2"
                  >
                    {isReminderSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isReminderSaving ? 'Saving...' : 'Save Reminder'}
                  </button>
                </div>

                {reminderStatus && (
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                      reminderStatus.type === 'success'
                        ? 'border-[#d9e6df] bg-[#f0f5f2] text-[#1f644e]'
                        : 'border-[#f0d2d2] bg-[#fef2f2] text-[#c94c4c]'
                    }`}
                  >
                    {reminderStatus.message}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export Data */}
          <div className="bg-white border border-[#e5e3d8] rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#1e3a34]">Export Data</h3>
                <p className="text-xs text-[#7c8e88]">Download your transaction history</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-[#f7faf7] border border-[#d6dfd9] rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1e3a34]">Export as PDF</p>
                <p className="text-xs text-[#7c8e88] mt-0.5">
                  Generate a report of your transactions
                </p>
              </div>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f644e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17503e] cursor-pointer sm:w-auto sm:shrink-0 sm:py-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Connected Apps */}
          <div className="bg-white border border-[#e5e3d8] rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#4a86e8]/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-[#4a86e8]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#1e3a34]">Connected Apps</h3>
                <p className="text-xs text-[#7c8e88]">
                  AI assistants and third-party apps with access to your data
                </p>
              </div>
            </div>

            {loadingApps ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#7c8e88]" />
              </div>
            ) : connectedApps.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-[#e5e3d8] rounded-xl bg-neutral-50/30">
                <Plug className="w-8 h-8 text-[#7c8e88] mx-auto mb-2" />
                <p className="text-sm text-[#7c8e88]">No connected apps yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {connectedApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col gap-3 bg-[#f7faf7] border border-[#d6dfd9] rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1e3a34] truncate">{app.clientName}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#1f644e]/10 text-[#1f644e]">
                          {getConnectionLabel(app)}
                        </span>
                        {app.scope ? (
                          <span className="text-[10px] text-[#7c8e88]">{app.scope}</span>
                        ) : null}
                        <span className="text-[10px] text-[#7c8e88]">
                          Last used{' '}
                          {app.lastUsedAt ? new Date(app.lastUsedAt).toLocaleDateString() : 'never'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7c8e88] mt-1">
                        Added {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevoke(app.id)}
                      disabled={revokingId === app.id}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-60 sm:w-auto sm:shrink-0 sm:py-1.5"
                    >
                      {revokingId === app.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Unlink className="w-3.5 h-3.5" />
                      )}
                      {revokingId === app.id ? 'Revoking...' : 'Revoke'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* About */}
          <div className="bg-white border border-[#e5e3d8] rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#1e3a34]">About</h3>
                <p className="text-xs text-[#7c8e88]">App information</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#e5e3d8]/50">
                <span className="text-sm text-[#7c8e88]">App</span>
                <span className="text-sm font-bold text-[#1e3a34]">Pocketly</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#7c8e88]">Storage</span>
                <span className="text-sm font-bold text-[#1e3a34]">Server</span>
              </div>
            </div>
          </div>

          {/* Mobile App */}
          <div className="bg-white border border-[#e5e3d8] rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1f644e]/10 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-[#1f644e]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#1e3a34]">Mobile App</h3>
                <p className="text-xs text-[#7c8e88]">
                  Connect the Pocketly Android app to this server
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-4 bg-[#f7faf7] border border-[#d6dfd9] rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1e3a34]">Generate QR Code</p>
                  <p className="text-xs text-[#7c8e88] mt-0.5">
                    Scan with the Pocketly app to create a revocable Android session
                  </p>
                </div>
                <button
                  onClick={handleGenerateMobileQr}
                  disabled={mobileQrLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f644e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17503e] disabled:opacity-60 cursor-pointer sm:w-auto sm:shrink-0 sm:py-2"
                >
                  {mobileQrLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  {mobileQrLoading ? 'Generating...' : mobileQr ? 'Regenerate' : 'Generate QR'}
                </button>
              </div>

              {mobileQr && (
                <div className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-[#e5e3d8] rounded-xl">
                  <div className="p-3 sm:p-4 bg-white rounded-xl border border-[#e5e3d8]">
                    <QRCode value={mobileQr} size={180} />
                  </div>
                  <p className="text-xs text-[#7c8e88] text-center">
                    Open the Pocketly Android app and tap <strong>Scan QR</strong> to connect.
                    {mobileQrExpiry && (
                      <span className="block mt-1">
                        Session token valid until {new Date(mobileQrExpiry).toLocaleDateString()}.
                      </span>
                    )}
                    <span className="block mt-1">
                      Revoke it anytime from the Connected Apps section above.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-[#fef2f2] border border-[#f0d2d2] rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#c94c4c]/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#c94c4c]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#c94c4c]">Danger Zone</h3>
                <p className="text-xs text-[#c94c4c]/70">Irreversible actions</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-white border border-[#f0d2d2] rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1e3a34]">Clear All Data</p>
                <p className="text-xs text-[#7c8e88] mt-0.5">
                  Permanently delete all accounts, transactions, categories, and budgets
                </p>
              </div>
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#c94c4c] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#b24040] disabled:opacity-60 cursor-pointer sm:w-auto sm:shrink-0 sm:py-2"
              >
                <Trash2 className="h-4 w-4" />
                {isClearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </div>
  );
}
