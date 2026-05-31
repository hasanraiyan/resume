'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Plug,
  RefreshCw,
  ShieldOff,
  SlidersHorizontal,
  Trash2,
  Wrench,
} from 'lucide-react';
import { Card } from '@/components/custom-ui';
import { useSmallClaw } from '@/context/SmallClawContext';
import { toast } from 'sonner';

function Toggle({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-label={label}
      aria-pressed={checked}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? 'bg-[#1f644e]' : 'bg-neutral-300'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:shadow-sm'}`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

function StatusPill({ status }) {
  const styles = {
    enabled: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    partial: 'bg-amber-50 text-amber-700 border-amber-100',
    disabled: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  const labels = {
    enabled: 'Enabled',
    partial: 'Partially disabled',
    disabled: 'Disabled',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${
        styles[status] || styles.enabled
      }`}
    >
      {labels[status] || 'Enabled'}
    </span>
  );
}

function formatDate(value) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function ServerMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">{label}</p>
      <p className="mt-1 text-lg font-black text-neutral-900">{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/70 p-8 text-center">
      <Icon className="h-8 w-8 text-neutral-300" />
      <p className="mt-3 text-sm font-bold text-neutral-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
    </div>
  );
}

export default function McpTab() {
  const { searchQuery } = useSmallClaw();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState(null);
  const [cardTabs, setCardTabs] = useState({});

  const fetchServers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/mcp');
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load MCP servers');
      }

      setServers(data.servers || []);
    } catch (error) {
      console.error('[McpTab] Failed to fetch MCP servers:', error);
      toast.error(error.message || 'Failed to load MCP servers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const filteredServers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return servers;

    return servers.filter((server) => {
      const haystack = [
        server.name,
        server.key,
        server.description,
        ...(server.tools || []).map((tool) => `${tool.name} ${tool.title} ${tool.description}`),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [servers, searchQuery]);

  const updateServer = async (serverKey, body) => {
    setBusyKey(`server:${serverKey}`);
    try {
      const res = await fetch(`/api/admin/mcp/${serverKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update MCP server');
      toast.success('MCP server updated');
      await fetchServers();
    } catch (error) {
      toast.error(error.message || 'Failed to update MCP server');
    } finally {
      setBusyKey(null);
    }
  };

  const updateTool = async (serverKey, toolName, isEnabled) => {
    setBusyKey(`tool:${serverKey}:${toolName}`);
    try {
      const res = await fetch(`/api/admin/mcp/${serverKey}/tools/${toolName}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update MCP tool');
      toast.success(isEnabled ? 'Tool enabled' : 'Tool disabled');
      await fetchServers();
    } catch (error) {
      toast.error(error.message || 'Failed to update MCP tool');
    } finally {
      setBusyKey(null);
    }
  };

  const revokeAllConnections = async (serverKey) => {
    setBusyKey(`revoke:${serverKey}`);
    try {
      const res = await fetch(`/api/admin/mcp/${serverKey}/revoke-connections`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to revoke connections');
      toast.success(`Revoked ${data.revokedConnections || 0} connection(s)`);
      await fetchServers();
    } catch (error) {
      toast.error(error.message || 'Failed to revoke connections');
    } finally {
      setBusyKey(null);
    }
  };

  const revokeConnection = async (serverKey, connectionId) => {
    setBusyKey(`connection:${connectionId}`);
    try {
      const res = await fetch(`/api/admin/mcp/${serverKey}/connections/${connectionId}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to revoke connection');
      toast.success('Connection revoked');
      await fetchServers();
    } catch (error) {
      toast.error(error.message || 'Failed to revoke connection');
    } finally {
      setBusyKey(null);
    }
  };

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1f644e]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-neutral-900">MCP Servers</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Manage server availability, exposed tools, OAuth clients, and active access tokens.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchServers}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-bold text-neutral-700 transition hover:border-[#1f644e]/30 hover:text-[#1f644e]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {filteredServers.length === 0 ? (
        <EmptyState
          icon={Plug}
          title="No MCP servers found"
          description="Add an MCP server definition and it will appear here automatically."
        />
      ) : (
        <div className="grid gap-5">
          {filteredServers.map((server) => {
            const activeTab = cardTabs[server.key] || 'overview';
            const isServerBusy = busyKey === `server:${server.key}`;
            const tabs = [
              { id: 'overview', label: 'Overview', icon: SlidersHorizontal },
              { id: 'tools', label: 'Tools', icon: Wrench },
              { id: 'connections', label: 'Connections', icon: KeyRound },
            ];

            return (
              <Card
                key={server.key}
                className="overflow-hidden border border-neutral-200 bg-white p-0"
              >
                <div className="flex flex-col gap-5 border-b border-neutral-100 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f644e] text-white">
                        <Plug className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-neutral-900">{server.name}</h3>
                        <p className="font-mono text-xs text-neutral-400">{server.key}</p>
                      </div>
                      <StatusPill status={server.status} />
                    </div>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
                      {server.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {isServerBusy ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#1f644e]" />
                    ) : (
                      <Toggle
                        checked={server.isEnabled}
                        label={`${server.isEnabled ? 'Disable' : 'Enable'} ${server.name}`}
                        onChange={() =>
                          updateServer(server.key, {
                            isEnabled: !server.isEnabled,
                            revokeConnections: server.isEnabled,
                          })
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-b border-neutral-100 px-5 py-3">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const selected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCardTabs((prev) => ({ ...prev, [server.key]: tab.id }))}
                        className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold transition ${
                          selected
                            ? 'bg-[#1f644e] text-white'
                            : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-5">
                  {activeTab === 'overview' && (
                    <div className="space-y-5">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <ServerMetric label="Tools" value={server.toolsCount} />
                        <ServerMetric label="Enabled" value={server.enabledToolsCount} />
                        <ServerMetric label="Disabled" value={server.disabledToolsCount} />
                        <ServerMetric label="Connections" value={server.activeConnections} />
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-black uppercase tracking-wider text-neutral-400">
                              MCP endpoint
                            </p>
                            <button
                              type="button"
                              onClick={() => copyText(server.resource, 'Endpoint')}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-white hover:text-[#1f644e]"
                              aria-label="Copy MCP endpoint"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="mt-2 break-all font-mono text-sm text-neutral-700">
                            {server.resource}
                          </p>
                        </div>

                        <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-black uppercase tracking-wider text-neutral-400">
                              OAuth authorize URL
                            </p>
                            <button
                              type="button"
                              onClick={() => copyText(server.authUrl, 'Authorize URL')}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-white hover:text-[#1f644e]"
                              aria-label="Copy OAuth authorize URL"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="mt-2 break-all font-mono text-sm text-neutral-700">
                            {server.authUrl}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(server.scopes || []).map((scope) => (
                          <span
                            key={scope}
                            className="rounded-lg border border-neutral-100 bg-neutral-50 px-2.5 py-1 font-mono text-xs font-bold text-neutral-600"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'tools' && (
                    <div className="space-y-3">
                      {(server.tools || []).length === 0 ? (
                        <EmptyState
                          icon={Wrench}
                          title="No tools registered"
                          description="This server does not currently expose any MCP tools."
                        />
                      ) : (
                        server.tools.map((tool) => {
                          const toolBusy = busyKey === `tool:${server.key}:${tool.name}`;
                          return (
                            <div
                              key={tool.name}
                              className="flex flex-col gap-4 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 md:flex-row md:items-start md:justify-between"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  {tool.isEnabled ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                  )}
                                  <p className="font-bold text-neutral-900">
                                    {tool.title || tool.name}
                                  </p>
                                  <span className="rounded bg-white px-2 py-0.5 font-mono text-xs text-neutral-500">
                                    {tool.name}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-neutral-500">
                                  {tool.description || 'No description provided.'}
                                </p>
                                {tool.annotations && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {Object.entries(tool.annotations)
                                      .filter(([, value]) => typeof value === 'boolean')
                                      .map(([key, value]) => (
                                        <span
                                          key={key}
                                          className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                                            value
                                              ? 'bg-emerald-50 text-emerald-700'
                                              : 'bg-neutral-100 text-neutral-500'
                                          }`}
                                        >
                                          {key}: {String(value)}
                                        </span>
                                      ))}
                                  </div>
                                )}
                              </div>
                              {toolBusy ? (
                                <Loader2 className="h-5 w-5 animate-spin text-[#1f644e]" />
                              ) : (
                                <Toggle
                                  checked={tool.isEnabled}
                                  disabled={!server.isEnabled}
                                  label={`${tool.isEnabled ? 'Disable' : 'Enable'} ${tool.name}`}
                                  onChange={() =>
                                    updateTool(server.key, tool.name, !tool.isEnabled)
                                  }
                                />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {activeTab === 'connections' && (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => revokeAllConnections(server.key)}
                          disabled={
                            server.activeConnections === 0 || busyKey === `revoke:${server.key}`
                          }
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyKey === `revoke:${server.key}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldOff className="h-4 w-4" />
                          )}
                          Revoke all
                        </button>
                      </div>

                      {(server.connections || []).length === 0 ? (
                        <EmptyState
                          icon={KeyRound}
                          title="No active clients"
                          description="OAuth and generated MCP clients will appear here after they connect."
                        />
                      ) : (
                        <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-100">
                          {server.connections.map((connection) => (
                            <div
                              key={connection.id}
                              className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-neutral-900">
                                  {connection.clientName || 'MCP Client'}
                                </p>
                                <p className="mt-1 break-all font-mono text-xs text-neutral-400">
                                  {connection.clientId || connection.id}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-500">
                                  <span>Type: {connection.connectionType}</span>
                                  <span>Last used: {formatDate(connection.lastUsedAt)}</span>
                                  <span>Created: {formatDate(connection.createdAt)}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => revokeConnection(server.key, connection.id)}
                                disabled={busyKey === `connection:${connection.id}`}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-bold text-neutral-600 transition hover:border-rose-200 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {busyKey === `connection:${connection.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                Revoke
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
