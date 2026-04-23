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
  ExternalLink,
} from 'lucide-react';
import { useMoney } from '@/context/MoneyContext';
import ExportModal from './ExportModal';

export default function FinanceSettingsTab() {
  const { clearFinanceData, fetchData, isSyncing, accounts, categories, stats } = useMoney();
  const [isClearing, setIsClearing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [baseUrl, setBaseUrl] = useState('');
  const [mcpUrl, setMcpUrl] = useState('');

  // Connected apps state
  const [connectedApps, setConnectedApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin.replace(/\/$/, '');
      setBaseUrl(origin);
      setMcpUrl(`${origin}/api/mcp`);
    }
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
                <p className="text-2xl font-bold text-[#1f644e]">{stats.totalTransactionCount}</p>
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

          {/* Export Data */}
          <div className="bg-white border border-[#e5e3d8] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1e3a34]">Export Data</h3>
                <p className="text-xs text-[#7c8e88]">Download your transaction history</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#f7faf7] border border-[#d6dfd9] rounded-xl p-4">
              <div>
                <p className="text-sm font-bold text-[#1e3a34]">Export as PDF</p>
                <p className="text-xs text-[#7c8e88] mt-0.5">
                  Generate a report of your transactions
                </p>
              </div>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-[#1f644e] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#17503e] cursor-pointer shrink-0"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* MCP Server */}
          <div className="bg-white border border-[#e5e3d8] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center">
                <Plug className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1e3a34]">MCP Server</h3>
                <p className="text-xs text-[#7c8e88]">
                  Connect Pocketly to ChatGPT and other AI assistants via MCP
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">MCP Endpoint</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={mcpUrl}
                    className="w-full p-2.5 border rounded-lg bg-neutral-50 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(mcpUrl);
                      alert('MCP endpoint copied');
                    }}
                    className="px-4 py-2 bg-[#1f644e] text-white rounded-lg text-sm font-bold hover:bg-[#17503e] transition cursor-pointer shrink-0"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-[#7c8e88]">
                  To connect ChatGPT or Claude, provide this URL with OAuth 2.0 authentication.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Well-Known Endpoints
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={`${baseUrl}/.well-known/oauth-authorization-server`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-[#e5e3d8] bg-neutral-50 hover:bg-neutral-100 transition text-xs font-mono text-[#1f644e]"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    OAuth Authorization Server
                  </a>
                  <a
                    href={`${baseUrl}/.well-known/openapi.json`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-[#e5e3d8] bg-neutral-50 hover:bg-neutral-100 transition text-xs font-mono text-[#1f644e]"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    OpenAPI Spec
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Apps */}
          <div className="bg-white border border-[#e5e3d8] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#4a86e8]/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#4a86e8]" />
              </div>
              <div>
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
                <p className="text-xs text-[#a0a0a0] mt-1">
                  Connect Pocketly to ChatGPT or Claude via MCP
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connectedApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between bg-[#f7faf7] border border-[#d6dfd9] rounded-xl p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1e3a34] truncate">{app.clientName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#1f644e]/10 text-[#1f644e]">
                          {app.scope || 'pocketly'}
                        </span>
                        <span className="text-[10px] text-[#7c8e88]">
                          Last used{' '}
                          {app.lastUsedAt ? new Date(app.lastUsedAt).toLocaleDateString() : 'never'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevoke(app.id)}
                      disabled={revokingId === app.id}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0 disabled:opacity-60"
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
                <span className="text-sm font-bold text-[#1e3a34]">Pocketly</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#e5e3d8]/50">
                <span className="text-sm text-[#7c8e88]">Storage</span>
                <span className="text-sm font-bold text-[#1e3a34]">Server</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#7c8e88]">MCP Version</span>
                <span className="text-sm font-bold text-[#1f644e]">2.0.0</span>
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
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </div>
  );
}
