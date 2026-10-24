'use client';

import { useState, useEffect, useRef } from 'react';
import AdminGuard from '@/components/AdminGuard';
import {
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  Check,
  BookOpen,
  Search,
  Copy,
  ExternalLink,
  Calendar,
  Tag,
} from 'lucide-react';
import { SkeletonProvider, SkeletonWrapper } from 'react-skeletonify';
import 'react-skeletonify/dist/index.css';
import SessionProvider from '@/components/SessionProvider';
import AppLayout from '@/components/layout/AppLayout';

const tabs = [
  { id: 'memories', label: 'Memories', icon: BookOpen },
  { id: 'search', label: 'AI Search', icon: Sparkles },
];

export default function RecallApp() {
  return (
    <SessionProvider>
      <AdminGuard appName="ReCall">
        <SkeletonProvider
          config={{
            animation: 'animation-1',
            borderRadius: '12px',
            animationSpeed: 1.5,
            exceptTags: ['button', 'svg', 'img'],
            background: '#e5e5ea',
          }}
        >
          <RecallContent />
        </SkeletonProvider>
      </AdminGuard>
    </SessionProvider>
  );
}

function RecallContent() {
  const [memories, setMemories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeTab, setActiveTab] = useState('memories');

  const [captureText, setCaptureText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const captureInputRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchMemories();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/recall/memories?limit=50');
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapture = async (e) => {
    if (e) e.preventDefault();
    if (!captureText.trim() || isCapturing) return;

    setIsCapturing(true);
    try {
      const res = await fetch('/api/recall/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: captureText }),
      });

      if (res.ok) {
        const data = await res.json();
        setMemories((prev) => [data.memory, ...prev]);
        setCaptureText('');
        showToast('Memory captured successfully');
        setActiveTab('memories');
      }
    } catch (error) {
      console.error('Failed to capture memory:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/recall/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.memories || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (id) => {
    const previousMemories = [...memories];
    const previousSearch = [...searchResults];

    setMemories(memories.filter((m) => m._id !== id));
    setSearchResults(searchResults.filter((m) => m._id !== id));

    try {
      const res = await fetch(`/api/recall/memories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      showToast('Memory deleted');
    } catch (error) {
      console.error('Failed to delete memory:', error);
      setMemories(previousMemories);
      setSearchResults(previousSearch);
    }
  };

  const startEditing = (memory) => {
    setEditingId(memory._id);
    setEditText(memory.text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleUpdate = async (id) => {
    if (!editText.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/recall/memories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText }),
      });

      if (res.ok) {
        const data = await res.json();
        const updateFn = (m) => (m._id === id ? { ...m, text: data.memory.text } : m);
        setMemories((prev) => prev.map(updateFn));
        setSearchResults((prev) => prev.map(updateFn));
        setEditingId(null);
        showToast('Memory updated');
      }
    } catch (error) {
      console.error('Failed to update memory:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const tabTitles = {
    memories: 'Your Memory Bank',
    search: 'Semantic AI Search',
  };

  return (
    <AppLayout
      appName="ReCall"
      appLogo="/images/apps/recall.png"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabTitles={tabTitles}
    >
      <div className="pt-2 lg:pt-6 pb-24 lg:pb-12 max-w-3xl mx-auto px-4 sm:px-6 relative">
        {/* Apple Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1d1d1f]/90 text-white px-4 py-2.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-lg transition-all animate-fade-in flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-[#30d158]" />
            {toastMessage}
          </div>
        )}

        {activeTab === 'memories' ? (
          <div className="space-y-6">
            {/* Apple HIG Capture Card */}
            <div className="bg-white rounded-2xl border border-[#d2d2d7]/60 p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#0071e3]/10 rounded-xl text-[#0071e3]">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#1d1d1f]">Capture Thought</h2>
                    <p className="text-[11px] text-[#86868b]">Instant external memory buffer</p>
                  </div>
                </div>
                <span className="hidden sm:inline-block text-[11px] font-medium text-[#86868b] bg-[#f5f5f7] px-2.5 py-1 rounded-full border border-[#d2d2d7]/40">
                  ⌘ + Enter to save
                </span>
              </div>
              <form onSubmit={handleCapture} className="relative">
                <textarea
                  ref={captureInputRef}
                  value={captureText}
                  onChange={(e) => setCaptureText(e.target.value)}
                  placeholder="Throw in an idea, link, or insight..."
                  className="w-full rounded-xl border border-[#d2d2d7]/60 bg-[#fbfbfd] p-4 text-[14px] text-[#1d1d1f] outline-none transition placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:ring-4 focus:ring-[#0071e3]/10 resize-none min-h-[120px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleCapture(e);
                    }
                  }}
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-2 text-[11px] text-[#86868b]">
                    <Tag className="w-3 h-3" /> Auto-structured for retrieval
                  </div>
                  <button
                    type="submit"
                    disabled={!captureText.trim() || isCapturing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] text-white text-xs font-semibold rounded-xl hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                  >
                    {isCapturing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Save Memory
                  </button>
                </div>
              </form>
            </div>

            {/* Memories List */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                  Recent Bank ({memories.length})
                </h3>
              </div>

              <SkeletonWrapper loading={isLoading && memories.length === 0}>
                <div className="space-y-3">
                  {!isLoading && memories.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-[#d2d2d7] rounded-2xl bg-[#fbfbfd]">
                      <div className="inline-flex p-3 bg-[#0071e3]/10 rounded-full mb-3 text-[#0071e3]">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-[#1d1d1f]">No memories recorded</p>
                      <p className="text-xs text-[#86868b] mt-1">
                        Capture your first thought above
                      </p>
                    </div>
                  ) : (
                    memories.map((memory) => (
                      <MemoryCard
                        key={memory._id}
                        memory={memory}
                        editingId={editingId}
                        editText={editText}
                        setEditText={setEditText}
                        isUpdating={isUpdating}
                        formatDate={formatDate}
                        startEditing={startEditing}
                        cancelEditing={cancelEditing}
                        handleUpdate={handleUpdate}
                        handleDelete={handleDelete}
                        showToast={showToast}
                      />
                    ))
                  )}
                </div>
              </SkeletonWrapper>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Apple HIG Search Card */}
            <div className="bg-white rounded-2xl border border-[#d2d2d7]/60 p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#30d158]/10 rounded-xl text-[#30d158]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#1d1d1f]">Semantic Search</h2>
                  <p className="text-[11px] text-[#86868b]">
                    Retrieve memories by conceptual meaning
                  </p>
                </div>
              </div>
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#86868b]">
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#0071e3]" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., that concept about database indexing..."
                  className="w-full rounded-xl border border-[#d2d2d7]/60 bg-[#fbfbfd] py-3 pl-11 pr-24 text-[14px] text-[#1d1d1f] outline-none transition placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:ring-4 focus:ring-[#0071e3]/10"
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || isSearching}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#0071e3] text-white text-xs font-semibold rounded-lg hover:bg-[#0077ed] disabled:opacity-40 transition cursor-pointer"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Search Results List */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                  {searchQuery ? `Results (${searchResults.length})` : 'Type a query above'}
                </h3>
              </div>

              <SkeletonWrapper loading={isSearching}>
                <div className="space-y-3">
                  {searchResults.length === 0 && searchQuery && !isSearching ? (
                    <div className="text-center py-16 border border-dashed border-[#d2d2d7] rounded-2xl bg-[#fbfbfd]">
                      <Search className="w-6 h-6 text-[#86868b] mx-auto mb-3" />
                      <p className="text-sm font-semibold text-[#1d1d1f]">No matching memories</p>
                      <p className="text-xs text-[#86868b] mt-1">
                        Try phrasing your query differently
                      </p>
                    </div>
                  ) : !searchQuery ? (
                    <div className="text-center py-16 border border-dashed border-[#d2d2d7] rounded-2xl bg-[#fbfbfd]">
                      <Sparkles className="w-6 h-6 text-[#0071e3] mx-auto mb-3" />
                      <p className="text-sm font-semibold text-[#1d1d1f]">AI Index Ready</p>
                      <p className="text-xs text-[#86868b] mt-1">
                        Search through thoughts naturally
                      </p>
                    </div>
                  ) : (
                    searchResults.map((memory) => (
                      <MemoryCard
                        key={memory._id}
                        memory={memory}
                        editingId={editingId}
                        editText={editText}
                        setEditText={setEditText}
                        isUpdating={isUpdating}
                        formatDate={formatDate}
                        startEditing={startEditing}
                        cancelEditing={cancelEditing}
                        handleUpdate={handleUpdate}
                        handleDelete={handleDelete}
                        showToast={showToast}
                      />
                    ))
                  )}
                </div>
              </SkeletonWrapper>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function MemoryCard({
  memory,
  editingId,
  editText,
  setEditText,
  isUpdating,
  formatDate,
  startEditing,
  cancelEditing,
  handleUpdate,
  handleDelete,
  showToast,
}) {
  const isEditing = editingId === memory._id;

  const handleCopy = () => {
    navigator.clipboard.writeText(memory.text);
    showToast('Copied to clipboard');
  };

  const renderTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0071e3] hover:underline inline-flex items-center gap-1 font-medium"
          >
            {part} <ExternalLink className="w-3 h-3" />
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="group bg-white rounded-2xl border border-[#d2d2d7]/60 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-[#0071e3]/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all">
      {isEditing ? (
        <div className="flex flex-col gap-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full rounded-xl border border-[#d2d2d7]/60 bg-[#fbfbfd] p-3 text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 min-h-[100px] resize-y"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelEditing}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#86868b] hover:bg-[#f5f5f7] rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleUpdate(memory._id)}
              disabled={isUpdating || !editText.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#0071e3] text-white rounded-lg hover:bg-[#0077ed] disabled:opacity-40 transition"
            >
              {isUpdating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="whitespace-pre-wrap text-[#1d1d1f] text-[14px] leading-relaxed mb-3">
            {renderTextWithLinks(memory.text)}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#f5f5f7] text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-[#86868b] flex items-center gap-1 font-medium">
                <Calendar className="w-3 h-3" /> {formatDate(memory.createdAt)}
              </span>
              {memory.score !== undefined && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#30d158]/10 text-[#248a3d] rounded-full font-semibold text-[11px]">
                  <Sparkles className="w-3 h-3" />
                  {(memory.score * 100).toFixed(0)}% match
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-2 text-[#86868b] hover:text-[#0071e3] hover:bg-[#f5f5f7] rounded-lg transition"
                title="Copy text"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => startEditing(memory)}
                className="p-2 text-[#86868b] hover:text-[#0071e3] hover:bg-[#f5f5f7] rounded-lg transition"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(memory._id)}
                className="p-2 text-[#86868b] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-lg transition"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
