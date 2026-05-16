'use client';

import { useState } from 'react';
import {
  MessageCircle,
  Plus,
  Edit2,
  Trash2,
  Webhook,
  Copy,
  Check,
  RotateCcw,
  X,
} from 'lucide-react';
import { Card } from '@/components/custom-ui';
import { useSmallClaw } from '@/context/SmallClawContext';

export default function ChannelsTab() {
  const { integrations, agents, refreshIntegrations, searchQuery } = useSmallClaw();

  const [savingIntegration, setSavingIntegration] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [copiedAccessCodeKey, setCopiedAccessCodeKey] = useState('');

  const filteredIntegrations = integrations.filter(
    (i) =>
      i.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.platform?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTelegramAccessCommand = (code) => (code ? `auth:${code}` : '');

  const handleCopyAccessCode = async (command, key) => {
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopiedAccessCodeKey(key);
      setTimeout(() => setCopiedAccessCodeKey(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleAddIntegration = () => {
    setEditingIntegration({
      id: 'new',
      platform: 'telegram',
      name: '',
      agentId: '',
      isActive: true,
      credentials: {
        botToken: '',
        responseMode: 'all',
      },
    });
  };

  const handleEditIntegration = (integration) => {
    const copy = {
      regenerateTelegramAuthToken: false,
      ...integration,
      id: integration.integrationId,
    };
    if (copy.credentials) {
      const creds = { ...copy.credentials };
      const sensitiveFields = [
        'botToken',
        'telegramAuthToken',
        'accessToken',
        'phoneNumberId',
        'verifyToken',
        'accountSid',
        'authToken',
      ];
      sensitiveFields.forEach((f) => {
        if (creds[f]) creds[f] = '';
      });
      copy.credentials = creds;
    }
    setEditingIntegration(copy);
  };

  const handleSaveIntegration = async () => {
    if (!editingIntegration.name || !editingIntegration.platform || !editingIntegration.agentId)
      return;

    setSavingIntegration(true);
    try {
      const isNew = editingIntegration.id === 'new';
      const url = isNew
        ? '/api/admin/integrations'
        : `/api/admin/integrations/${editingIntegration.integrationId}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = { ...editingIntegration };
      if (!isNew && payload.credentials) {
        const sensitiveFields = [
          'botToken',
          'telegramAuthToken',
          'accessToken',
          'phoneNumberId',
          'verifyToken',
          'accountSid',
          'authToken',
        ];
        sensitiveFields.forEach((f) => {
          if (!payload.credentials[f]) delete payload.credentials[f];
        });
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingIntegration(null);
        refreshIntegrations();
      } else {
        alert('Failed to save integration.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingIntegration(false);
    }
  };

  const handleDeleteIntegration = async (integrationId) => {
    if (!confirm('Are you sure you want to delete this Channel Integration?')) return;
    try {
      const res = await fetch(`/api/admin/integrations/${integrationId}`, { method: 'DELETE' });
      if (res.ok) refreshIntegrations();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-[#1e3a34]">
            External Channels
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Connect your AI agents to external platforms like Telegram or WhatsApp.
          </p>
        </div>
        <button
          onClick={handleAddIntegration}
          className="px-5 py-2.5 bg-[#1f644e] hover:bg-[#164d3c] transition-colors text-white rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Channel
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <Card
            key={integration.integrationId}
            interactive
            className="p-6 border-2 border-neutral-100 hover:border-[#1f644e] transition-all bg-white rounded-xl flex flex-col h-full cursor-pointer relative"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-neutral-200/60">
                  <MessageCircle className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-neutral-900 leading-tight">
                    {integration.name}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium capitalize mt-1">
                    Platform:{' '}
                    <span className="font-semibold text-neutral-800">{integration.platform}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditIntegration(integration);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-[#1e3a34] hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteIntegration(integration.integrationId);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-6">
              <p className="text-xs text-neutral-500">
                Routing to Agent:{' '}
                <span className="font-semibold px-2 py-0.5 bg-neutral-100 rounded text-neutral-700">
                  {integration.agentId}
                </span>
              </p>
              {integration.platform === 'telegram' && integration.telegramAuthCode && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 mt-1">
                  <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-neutral-500">
                    Access Command
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="min-w-0 flex-1 text-xs font-semibold text-neutral-800 font-mono truncate">
                      {getTelegramAccessCommand(integration.telegramAuthCode)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAccessCode(
                          getTelegramAccessCommand(integration.telegramAuthCode),
                          `card-${integration.integrationId}`
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-[11px] font-medium text-neutral-700 hover:border-[#1f644e] hover:text-[#1e3a34] transition-colors cursor-pointer shrink-0"
                    >
                      {copiedAccessCodeKey === `card-${integration.integrationId}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-neutral-100">
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-1.5 flex justify-between">
                <span>Webhook URL</span>
                {integration.isActive ? (
                  <span className="text-green-500 font-bold">Active</span>
                ) : (
                  <span className="text-neutral-400">Inactive</span>
                )}
              </p>
              <div className="text-xs bg-neutral-50 text-neutral-600 px-3 py-2 rounded-lg font-mono tracking-wider border border-neutral-100 truncate flex items-center gap-2">
                <Webhook className="w-3.5 h-3.5 text-neutral-400" />
                <span className="truncate">/api/webhooks/{integration.platform}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {integrations.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50 flex flex-col items-center justify-center">
          <MessageCircle className="w-12 h-12 text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700">No Channels Found</h3>
          <p className="text-sm text-neutral-500 mt-2 max-w-md">
            Connect your AI Agents to external platforms like Telegram bots to interact with users
            directly.
          </p>
          <button
            onClick={handleAddIntegration}
            className="mt-6 px-6 py-2.5 bg-white border border-neutral-300 hover:border-[#1f644e] transition-colors rounded-xl text-sm font-medium text-[#1e3a34] cursor-pointer"
          >
            Add a Channel
          </button>
        </div>
      ) : filteredIntegrations.length === 0 && searchQuery ? (
        <div className="text-center p-12 border border-dashed rounded-2xl bg-neutral-50 text-neutral-500">
          No channels match your search for "{searchQuery}".
        </div>
      ) : null}

      {/* Integration Edit Modal */}
      {editingIntegration && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-[family-name:var(--font-playfair)]">
                {editingIntegration.id === 'new' ? 'New Channel' : 'Edit Channel'}
              </h3>
              <button
                onClick={() => setEditingIntegration(null)}
                className="text-neutral-400 hover:text-[#1e3a34]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                    Platform
                  </label>
                  <select
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-xl text-sm outline-none"
                    value={editingIntegration.platform}
                    onChange={(e) =>
                      setEditingIntegration({ ...editingIntegration, platform: e.target.value })
                    }
                    disabled={editingIntegration.id !== 'new'}
                  >
                    <option value="telegram">Telegram Bot API</option>
                    <option value="whatsapp">WhatsApp Cloud API (Meta)</option>
                    <option value="twilio">WhatsApp (Twilio)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-2 h-[42px]">
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${editingIntegration.isActive ? 'text-green-600' : 'text-neutral-400'}`}
                    >
                      {editingIntegration.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <input
                      type="checkbox"
                      checked={editingIntegration.isActive ?? true}
                      onChange={(e) =>
                        setEditingIntegration({ ...editingIntegration, isActive: e.target.checked })
                      }
                      className="rounded border-neutral-300 text-[#1e3a34] focus:ring-[#1f644e] h-5 w-5"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                  Channel Name
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-xl text-sm outline-none"
                  value={editingIntegration.name}
                  onChange={(e) =>
                    setEditingIntegration({ ...editingIntegration, name: e.target.value })
                  }
                  placeholder="My Support Bot"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                  Target AI Agent
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-xl text-sm outline-none"
                  value={editingIntegration.agentId}
                  onChange={(e) =>
                    setEditingIntegration({ ...editingIntegration, agentId: e.target.value })
                  }
                >
                  <option value="">Select an Agent...</option>
                  {agents.map((a) => (
                    <option key={a.agentId} value={a.agentId}>
                      {a.name} ({a.agentId})
                    </option>
                  ))}
                </select>
              </div>

              {editingIntegration.platform === 'telegram' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                      Bot Token
                    </label>
                    <input
                      className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-xl text-sm outline-none font-mono"
                      type="password"
                      value={editingIntegration.credentials?.botToken || ''}
                      onChange={(e) =>
                        setEditingIntegration({
                          ...editingIntegration,
                          credentials: {
                            ...editingIntegration.credentials,
                            botToken: e.target.value,
                          },
                        })
                      }
                      placeholder="123456789:ABCDEF..."
                    />
                  </div>
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">
                        Telegram Auth Code
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingIntegration({
                            ...editingIntegration,
                            regenerateTelegramAuthToken:
                              !editingIntegration.regenerateTelegramAuthToken,
                          })
                        }
                        className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                          editingIntegration.regenerateTelegramAuthToken
                            ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-white border-neutral-200 text-neutral-500 hover:border-[#1f644e] hover:text-[#1e3a34]'
                        }`}
                      >
                        <RotateCcw size={12} />
                        {editingIntegration.regenerateTelegramAuthToken
                          ? 'New code on save'
                          : 'Regenerate code'}
                      </button>
                    </div>
                    {editingIntegration.telegramAuthCode && (
                      <div className="bg-white rounded-xl border border-neutral-200 p-3 flex items-center justify-between gap-3">
                        <span className="font-mono text-xs font-bold text-[#1e3a34]">
                          {getTelegramAccessCommand(editingIntegration.telegramAuthCode)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyAccessCode(
                              getTelegramAccessCommand(editingIntegration.telegramAuthCode),
                              'modal'
                            )
                          }
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          {copiedAccessCodeKey === 'modal' ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-neutral-400 italic">
                      Authorized Chats: {editingIntegration.metadata?.authorizedChats?.length || 0}
                    </p>
                  </div>
                </div>
              )}

              {/* Add WhatsApp / Twilio fields here if needed similarly */}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditingIntegration(null)}
                className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveIntegration}
                disabled={savingIntegration}
                className="flex-1 py-3 rounded-xl bg-[#1f644e] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#164d3c] transition-all cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed shadow-md"
              >
                {savingIntegration ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
