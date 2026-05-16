'use client';

import { useState } from 'react';
import { Server, Plus, Edit2, Trash2, Globe2, X, Activity } from 'lucide-react';
import { Card } from '@/components/custom-ui';
import { useSmallClaw } from '@/context/SmallClawContext';
import Switch from '@/components/admin/Switch';

export default function McpTab() {
  const { mcpServers, refreshMcpServers, searchQuery } = useSmallClaw();

  const [savingMcp, setSavingMcp] = useState(false);
  const [editingMcp, setEditingMcp] = useState(null);

  const filteredMcpServers = mcpServers.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMcp = () => {
    setEditingMcp({
      id: 'new',
      name: '',
      description: '',
      type: 'sse',
      url: '',
      icon: 'Server',
      color: 'blue-500',
      isActive: true,
      adminOnly: false,
      isDefault: false,
    });
  };

  const handleEditMcp = (server) => {
    setEditingMcp({ ...server, id: server._id });
  };

  const handleSaveMcp = async () => {
    if (!editingMcp.name || !editingMcp.url) return;

    setSavingMcp(true);
    try {
      const isNew = editingMcp.id === 'new';
      const url = isNew ? '/api/admin/mcp-servers' : `/api/admin/mcp-servers/${editingMcp.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMcp),
      });

      if (res.ok) {
        setEditingMcp(null);
        refreshMcpServers();
      } else {
        alert('Failed to save MCP server.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingMcp(false);
    }
  };

  const handleDeleteMcp = async (serverId) => {
    if (!confirm('Are you sure you want to delete this MCP Server?')) return;
    try {
      const res = await fetch(`/api/admin/mcp-servers/${serverId}`, { method: 'DELETE' });
      if (res.ok) refreshMcpServers();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-[#1e3a34]">
            MCP Infrastructure
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Connect Model Context Protocol (MCP) servers to give agents tool-use capabilities.
          </p>
        </div>
        <button
          onClick={handleAddMcp}
          className="px-5 py-2.5 bg-[#1f644e] hover:bg-[#164d3c] transition-colors text-white rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95 border-2 border-[#1f644e]"
        >
          <Plus className="w-4 h-4" /> Add MCP Server
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMcpServers.map((server) => (
          <Card
            key={server._id}
            interactive
            className="p-6 border-2 border-neutral-100 hover:border-[#1f644e] transition-all bg-white rounded-xl flex flex-col h-full cursor-pointer relative group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-neutral-200/60 group-hover:bg-neutral-200/50 transition-colors">
                  <Server className={`w-5 h-5 text-${server.color || 'blue-500'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-neutral-900 leading-tight">
                    {server.name}
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-mono mt-1 uppercase tracking-widest">
                    Type: {server.type}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditMcp(server);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMcp(server._id);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {server.description && (
              <p className="text-sm text-neutral-600 mb-4 line-clamp-2 leading-relaxed">
                {server.description}
              </p>
            )}

            <div className="mt-auto pt-4 border-t border-neutral-100">
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-1.5 flex justify-between items-center">
                <span>Endpoint URL</span>
                <span
                  className={`inline-flex items-center gap-1.5 ${server.isActive ? 'text-green-600' : 'text-neutral-400'}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${server.isActive ? 'bg-green-500' : 'bg-neutral-300'}`}
                  ></span>
                  {server.isActive ? 'Active' : 'Offline'}
                </span>
              </p>
              <div
                className="text-xs bg-neutral-50 text-neutral-600 px-3 py-2 rounded-lg font-mono tracking-wider border border-neutral-100 truncate flex items-center gap-2 group-hover:bg-neutral-100/50 transition-colors"
                title={server.url}
              >
                <Globe2 className="w-3.5 h-3.5 text-neutral-400" />
                <span className="truncate">{server.url}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {mcpServers.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50 flex flex-col items-center justify-center">
          <Activity className="w-12 h-12 text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700">No MCP Servers Configured</h3>
          <p className="text-sm text-neutral-500 mt-2 max-w-md">
            MCP servers allow agents to interact with search engines, file systems, and other
            external tools.
          </p>
          <button
            onClick={handleAddMcp}
            className="mt-6 px-6 py-2.5 bg-white border border-neutral-300 hover:border-black transition-colors rounded-xl text-sm font-medium text-black cursor-pointer"
          >
            Configure Local SSE Server
          </button>
        </div>
      ) : filteredMcpServers.length === 0 && searchQuery ? (
        <div className="text-center p-12 border border-dashed rounded-2xl bg-neutral-50 text-neutral-500">
          No MCP servers match your search for "{searchQuery}".
        </div>
      ) : null}

      {/* MCP Edit Modal */}
      {editingMcp && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#1f644e]" />
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-[family-name:var(--font-playfair)]">
                {editingMcp.id === 'new' ? 'Register MCP Server' : 'Configure Server'}
              </h3>
              <button
                onClick={() => setEditingMcp(null)}
                className="text-neutral-400 hover:text-[#1e3a34] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                    Friendly Name
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-[#1f644e] rounded-xl outline-none text-sm"
                    value={editingMcp.name}
                    onChange={(e) => setEditingMcp({ ...editingMcp, name: e.target.value })}
                    placeholder="Search Tools"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                    Connection Type
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-[#1f644e] rounded-xl text-sm outline-none cursor-pointer"
                    value={editingMcp.type}
                    onChange={(e) => setEditingMcp({ ...editingMcp, type: e.target.value })}
                  >
                    <option value="sse">SSE (HTTP/Events)</option>
                    <option value="stdio" disabled>
                      stdio (Local Process)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                  Endpoint URL
                </label>
                <input
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-[#1f644e] rounded-xl font-mono text-sm outline-none"
                  value={editingMcp.url}
                  onChange={(e) => setEditingMcp({ ...editingMcp, url: e.target.value })}
                  placeholder="http://localhost:3001/sse"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                  Short Description
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-[#1f644e] rounded-xl text-sm min-h-[100px] outline-none resize-none"
                  value={editingMcp.description}
                  onChange={(e) => setEditingMcp({ ...editingMcp, description: e.target.value })}
                  placeholder="Describe what capabilities this server adds..."
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <div>
                  <p className="text-sm font-bold text-neutral-900">Active Status</p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">
                    Toggle availability to agents
                  </p>
                </div>
                <Switch
                  checked={editingMcp.isActive}
                  onCheckedChange={(val) => setEditingMcp({ ...editingMcp, isActive: val })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditingMcp(null)}
                className="flex-1 py-3.5 rounded-xl border-2 border-neutral-100 hover:bg-neutral-50 text-xs font-black uppercase tracking-widest text-neutral-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMcp}
                disabled={savingMcp}
                className="flex-1 py-3.5 rounded-xl bg-[#1f644e] hover:bg-[#164d3c] text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed shadow-lg"
              >
                {savingMcp ? 'Syncing...' : 'Save Server'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
