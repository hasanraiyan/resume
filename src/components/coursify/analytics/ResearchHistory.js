'use client';

import { useState, useEffect } from 'react';
import {
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
  Zap,
  Coins,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  Eye,
  Activity,
  Box,
  Share2,
  X,
  MoreVertical,
  Trash2,
  Pencil,
  PanelLeft,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/custom-ui';
import { cn } from '@/utils/classNames';
import { CoursifyBlockRenderer } from '../reader/CoursifyBlockRenderer';

export function ResearchHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openMenu, setOpenMenu] = useState(null);

  // Artifact View State
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Handle search debouncing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCopyLink = () => {
    if (!selectedArtifact) return;
    const url = `${window.location.origin}/coursify/r/${selectedArtifact.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchHistory = async (p = page, s = debouncedSearch) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/coursify/history?page=${p}&search=${s}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtifactDetail = async (id) => {
    setIsDetailLoading(true);
    setShowDialog(true);
    setCopied(false);
    setEditMode(false);
    setShowSidebar(true);
    try {
      const res = await fetch(`/api/admin/coursify/history?id=${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedArtifact(data.artifact);
        setEditedContent(data.artifact.content || '');
        setEditedTitle(data.artifact.title || '');
      }
    } catch (err) {
      console.error('Failed to fetch artifact detail:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedArtifact) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/coursify/history?id=${selectedArtifact._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editedContent,
          title: editedTitle,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedArtifact({
          ...selectedArtifact,
          content: editedContent,
          title: editedTitle,
        });
        setEditMode(false);
        toast.success('Artifact saved successfully');
      } else {
        toast.error('Failed to save artifact: ' + data.error);
      }
    } catch (err) {
      console.error('Failed to save artifact:', err);
      toast.error('Error saving artifact');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteArtifact = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this artifact?')) return;

    try {
      const res = await fetch(`/api/admin/coursify/history?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setLogs((prev) => prev.filter((log) => log._id !== id));
        setPagination((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
      } else {
        alert('Failed to delete artifact: ' + data.error);
      }
    } catch (err) {
      console.error('Failed to delete artifact:', err);
      alert('Error deleting artifact');
    }
  };

  useEffect(() => {
    fetchHistory(page, debouncedSearch);
  }, [page, debouncedSearch]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1e3a34] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1f644e]" />
            All Artifacts
          </h2>
          <p className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest mt-1">
            View, manage, and delete all generated research artifacts
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5c4be]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
            placeholder="Search topics..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#e5e3d8] rounded-xl text-xs outline-none focus:border-[#1f644e] transition-colors"
          />
        </div>
      </div>

      {/* Logs Table */}
      <Card className="p-0 border-[#e5e3d8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Topic</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Tokens</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-8">
                      <div className="h-4 bg-gray-100 animate-pulse rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#7c8e88]">
                    No research logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-[#f0f5f2]/20 transition-colors cursor-pointer group"
                    onClick={() => fetchArtifactDetail(log._id)}
                  >
                    <td className="px-6 py-4">
                      {log.status === 'success' ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-bold whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Success
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-full text-xs font-bold whitespace-nowrap">
                          <XCircle className="w-3.5 h-3.5" />
                          Failed
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1e3a34] line-clamp-1 group-hover:text-[#1f644e] transition-all max-w-xs">
                        {log.displayTopic}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-[#7c8e88]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#7c8e88]">
                      <span className="font-semibold">{(log.durationMs / 1000).toFixed(2)}s</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1e3a34] flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          {(log.usage?.totalTokens / 1000).toFixed(1)}k
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#1f644e] flex items-center gap-1">
                        <Coins className="w-3 h-3" />${log.costUSD.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === log._id ? null : log._id);
                          }}
                          className="p-1.5 text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2] rounded-lg transition-all"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenu === log._id && (
                          <div className="absolute right-0 mt-1 bg-white border border-[#e5e3d8] rounded-lg shadow-lg z-10 min-w-[150px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/coursify/r/${log.outputSlug}`, '_blank');
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#1f644e] hover:bg-[#f0f5f2] first:rounded-t-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              onClick={(e) => deleteArtifact(log._id, e)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 last:rounded-b-lg transition-colors border-t border-[#e5e3d8]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-gray-50/50 border-t border-[#e5e3d8] flex items-center justify-between">
          <p className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest">
            Showing {(page - 1) * pagination.limit + 1} to{' '}
            {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="h-8 w-8 p-0 flex items-center justify-center border border-[#e5e3d8] rounded-lg text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-xs font-bold text-[#1f644e]">{page}</span>
              <span className="text-xs text-[#7c8e88]">/</span>
              <span className="text-xs text-[#7c8e88]">{pagination.pages}</span>
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.pages || loading}
              className="h-8 w-8 p-0 flex items-center justify-center border border-[#e5e3d8] rounded-lg text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Artifact Detail Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          size="3xl"
          className="p-0 border-none overflow-hidden max-w-[95vw] lg:max-w-7xl flex flex-col h-[90vh] bg-white"
        >
          {isDetailLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-3 border-[#f0f5f2] border-t-[#1f644e] rounded-full animate-spin" />
              <p className="text-xs font-bold text-[#7c8e88] uppercase tracking-widest">
                Retrieving Artifact...
              </p>
            </div>
          ) : selectedArtifact ? (
            <>
              {/* Header */}
              <div className="bg-white border-b border-[#e5e3d8] p-4 lg:px-8 lg:py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 relative z-20">
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className={cn(
                      'p-2 rounded-lg transition-colors hidden lg:flex items-center justify-center border',
                      showSidebar
                        ? 'bg-[#f0f5f2] border-[#d4e6de] text-[#1f644e]'
                        : 'bg-white border-[#e5e3d8] text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2]'
                    )}
                    title={showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
                  >
                    <PanelLeft size={16} />
                  </button>
                  <div className="min-w-0 flex-1">
                    {editMode ? (
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="text-lg lg:text-xl font-bold text-[#1e3a34] bg-transparent border-b-2 border-[#1f644e] outline-none w-full mb-0.5"
                        placeholder="Artifact Title"
                      />
                    ) : (
                      <DialogTitle className="text-lg lg:text-xl font-bold text-[#1e3a34] truncate mb-0.5">
                        {selectedArtifact.title}
                      </DialogTitle>
                    )}
                    <DialogDescription className="text-[10px] text-[#7c8e88] uppercase font-bold tracking-wider truncate">
                      Topic: {selectedArtifact.topic}
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:mr-10">
                  {!editMode ? (
                    <>
                      <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#d4e6de] text-[#1f644e] rounded-lg text-[10px] font-bold hover:bg-[#f0f5f2] transition-all"
                      >
                        <Pencil size={12} /> <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() =>
                          window.open(`/coursify/r/${selectedArtifact.slug}`, '_blank')
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#d4e6de] text-[#1f644e] rounded-lg text-[10px] font-bold hover:bg-[#f0f5f2] transition-all"
                      >
                        <Eye size={12} /> <span className="hidden sm:inline">Live</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditMode(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e5e3d8] text-[#7c8e88] rounded-lg text-[10px] font-bold hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f644e] text-white border border-[#1f644e] rounded-lg text-[10px] font-bold hover:bg-[#184d3c] transition-all disabled:opacity-50"
                      >
                        {isSaving ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={12} />
                        )}
                        <span>Save</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleCopyLink}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all',
                      copied
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-[#1f644e] text-white border border-[#1f644e] hover:bg-[#184d3c]'
                    )}
                  >
                    {copied ? <CheckCircle2 size={12} /> : <Share2 size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
                {/* Left: Artifact Rendering or Editor */}
                <div
                  className={cn(
                    'flex-1 overflow-y-auto overflow-x-auto custom-scrollbar bg-[#fcfbf5] flex justify-center transition-all duration-300 min-w-0',
                    showSidebar ? 'p-6 lg:p-12' : 'p-6 lg:p-20'
                  )}
                >
                  <div
                    className={cn(
                      'w-full transition-all duration-300',
                      showSidebar ? 'max-w-3xl' : 'max-w-5xl'
                    )}
                  >
                    <div className="artifact-renderer w-full overflow-hidden">
                      {editMode ? (
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="w-full h-full min-h-[65vh] p-8 rounded-2xl border border-[#e5e3d8] bg-white text-sm font-mono focus:ring-2 focus:ring-[#1f644e] outline-none resize-none leading-relaxed text-[#1e3a34] shadow-sm"
                          placeholder="Write your markdown here..."
                        />
                      ) : (
                        <CoursifyBlockRenderer content={selectedArtifact.content} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Metadata Panel */}
                {showSidebar && (
                  <div className="w-full lg:w-[300px] h-full bg-white border-t lg:border-t-0 lg:border-l border-[#e5e3d8] p-5 space-y-5 overflow-y-auto custom-scrollbar shrink-0 z-10 animate-in fade-in duration-300">
                    {/* System Info */}
                    <section>
                      <h4 className="text-[10px] font-bold text-[#b5c4be] uppercase tracking-widest mb-3.5 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" /> System Info
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#7c8e88] font-medium">Agent</span>
                          <Badge className="bg-[#f0f5f2] text-[#1f644e] border-none text-[10px] font-bold px-2 py-0.5">
                            {selectedArtifact.metadata?.agentId || 'coursify_search_flash'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#7c8e88] font-medium">Provider</span>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                            {selectedArtifact.metadata?.provider || 'pollinations'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#7c8e88] font-medium">Status</span>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Success
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="border-t border-[#f0f0f0]" />

                    {/* Execution Metrics */}
                    <section>
                      <h4 className="text-[10px] font-bold text-[#b5c4be] uppercase tracking-widest mb-3.5 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Execution
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#7c8e88] font-medium">Duration</span>
                          <span className="text-[11px] font-bold text-[#1e3a34]">
                            {(selectedArtifact.metadata?.durationMs / 1000).toFixed(2)}s
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#7c8e88] font-medium">Created</span>
                          <span className="text-[11px] font-bold text-[#1e3a34]">
                            {new Date(selectedArtifact.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </section>

                    <div className="border-t border-[#f0f0f0]" />

                    {/* Resource Usage */}
                    <section>
                      <h4 className="text-[10px] font-bold text-[#b5c4be] uppercase tracking-widest mb-3.5 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" /> Resources
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#7c8e88] font-medium">
                            Total Tokens
                          </span>
                          <span className="text-[11px] font-bold text-[#1e3a34]">
                            {(selectedArtifact.usage?.totalTokens / 1000).toFixed(1)}k
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#7c8e88] font-medium">Prompt</span>
                            <span className="font-bold text-[#1e3a34]">
                              {(selectedArtifact.usage?.promptTokens / 1000).toFixed(1)}k
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1f644e]"
                              style={{
                                width: `${(selectedArtifact.usage?.promptTokens / selectedArtifact.usage?.totalTokens) * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#7c8e88] font-medium">Completion</span>
                            <span className="font-bold text-[#1e3a34]">
                              {(selectedArtifact.usage?.completionTokens / 1000).toFixed(1)}k
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{
                                width: `${(selectedArtifact.usage?.completionTokens / selectedArtifact.usage?.totalTokens) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="border-t border-[#f0f0f0]" />

                    {/* Cost */}
                    <section>
                      <h4 className="text-[10px] font-bold text-[#b5c4be] uppercase tracking-widest mb-3.5 flex items-center gap-2">
                        <Coins className="w-3.5 h-3.5" /> Cost
                      </h4>
                      <div className="flex items-center justify-between p-2.5 bg-[#f0f5f2] rounded-xl border border-[#d4e6de]">
                        <span className="text-[10px] text-[#1f644e] font-bold uppercase tracking-wider">
                          Total
                        </span>
                        <span className="text-base font-bold text-[#1f644e]">
                          ${selectedArtifact.usage?.estimatedCostUSD.toFixed(3)}
                        </span>
                      </div>
                    </section>

                    <div className="border-t border-[#f0f0f0]" />

                    {/* Metadata */}
                    <section>
                      <h4 className="text-[10px] font-bold text-[#b5c4be] uppercase tracking-widest mb-2.5 flex items-center gap-2">
                        <Box className="w-3.5 h-3.5" /> Reference
                      </h4>
                      <p className="text-[9px] font-mono text-[#7c8e88] break-all bg-gray-50 p-2 rounded-lg border border-[#e5e3d8]">
                        {selectedArtifact.slug}
                      </p>
                    </section>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-[#7c8e88]">Failed to load artifact details.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
