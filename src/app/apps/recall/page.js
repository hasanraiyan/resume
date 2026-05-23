'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sparkles, Plus, Trash2, Loader2, Pencil, Check, BookOpen } from 'lucide-react';
import { SkeletonProvider, SkeletonWrapper } from 'react-skeletonify';
import 'react-skeletonify/dist/index.css';
import SessionProvider from '@/components/SessionProvider';
import AppLayout from '@/components/layout/AppLayout';

const tabs = [
  { id: 'memories', label: 'Memories', icon: BookOpen },
  { id: 'search', label: 'Search', icon: Sparkles },
];

export default function RecallApp() {
  return (
    <SessionProvider>
      <SkeletonProvider
        config={{
          animation: 'animation-1',
          borderRadius: '8px',
          animationSpeed: 2,
          exceptTags: ['button', 'svg', 'img'],
          background: '#e5e3d8',
        }}
      >
        <RecallContent />
      </SkeletonProvider>
    </SessionProvider>
  );
}

function RecallContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeTab, setActiveTab] = useState('memories');

  const [captureText, setCaptureText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const captureInputRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/login?callbackUrl=/apps/recall');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session && session.user.role === 'admin') {
      fetchMemories();
    }
  }, [session]);

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
    e.preventDefault();
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
        if (searchQuery) {
          setSearchQuery('');
          await fetchMemories();
        } else {
          setMemories((prev) => [data.memory, ...prev]);
        }
        setCaptureText('');
        setActiveTab('memories');
      }
    } catch (error) {
      console.error('Failed to capture memory:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchMemories();
      return;
    }

    setIsSearching(true);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/recall/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const previous = [...memories];
    setMemories(memories.filter((m) => m._id !== id));

    try {
      const res = await fetch(`/api/recall/memories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch (error) {
      console.error('Failed to delete memory:', error);
      setMemories(previous);
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
        setMemories((prev) =>
          prev.map((m) => (m._id === id ? { ...m, text: data.memory.text } : m))
        );
        setEditingId(null);
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
    memories: 'Your Memories',
    search: 'Search Memories',
  };

  const renderContent = () => {
    if (activeTab === 'memories') {
      return (
        <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
          {/* Capture Section - Enhanced */}
          <div className="bg-gradient-to-br from-white to-[#fcfbf5] rounded-xl border border-[#e5e3d8] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-[#1f644e]/10 rounded-lg">
                <Plus className="w-5 h-5 text-[#1f644e]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1e3a34]">Capture New Memory</h2>
                <p className="text-xs text-[#7c8e88] mt-0.5">
                  Save thoughts, ideas, and links for later
                </p>
              </div>
            </div>
            <form onSubmit={handleCapture} className="relative">
              <textarea
                ref={captureInputRef}
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                placeholder="Throw in a thought, link, or idea instantly..."
                className="w-full rounded-lg border border-[#e5e3d8] bg-white p-4 text-base outline-none transition placeholder:text-[#a0b2ac] focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20 resize-none min-h-[110px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleCapture(e);
                  }
                }}
              />
              <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-[#a0b2ac]">Press Ctrl+Enter to save</p>
                <button
                  type="submit"
                  disabled={!captureText.trim() || isCapturing}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1f644e] text-white text-sm font-bold rounded-lg hover:bg-[#17503e] disabled:opacity-50 disabled:hover:bg-[#1f644e] transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  {isCapturing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Save Memory
                </button>
              </div>
            </form>
          </div>

          {/* Memories List - Enhanced */}
          <div>
            <div className="flex items-center justify-between mb-5 px-1">
              <div>
                <h2 className="text-sm font-bold text-[#1e3a34]">Recent Memories</h2>
                <p className="text-xs text-[#7c8e88] mt-1">
                  {memories.length} {memories.length === 1 ? 'memory' : 'memories'} saved
                </p>
              </div>
            </div>

            <SkeletonWrapper loading={isLoading && memories.length === 0}>
              <div className="space-y-3">
                {!isLoading && memories.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-[#e5e3d8] rounded-lg bg-gradient-to-b from-[#fcfbf5] to-white">
                    <div className="inline-flex p-3 bg-[#1f644e]/5 rounded-full mb-4">
                      <Sparkles className="w-8 h-8 text-[#1f644e]" />
                    </div>
                    <p className="text-[#1e3a34] font-semibold mb-1">No memories yet</p>
                    <p className="text-[#7c8e88] text-sm">
                      Start by capturing your first memory above
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
                    />
                  ))
                )}
              </div>
            </SkeletonWrapper>
          </div>
        </div>
      );
    }

    if (activeTab === 'search') {
      return (
        <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
          {/* Search Section - Enhanced */}
          <div className="bg-gradient-to-br from-white to-[#fcfbf5] rounded-xl border border-[#e5e3d8] p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-[#1f644e]/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-[#1f644e]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1e3a34]">Find Memories</h2>
                <p className="text-xs text-[#7c8e88] mt-0.5">
                  Search through your memory bank with AI
                </p>
              </div>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {isSearching ? (
                  <Loader2 className="w-5 h-5 text-[#1f644e] animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[#1f644e]" />
                )}
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="I remember the idea vaguely..."
                className="w-full rounded-lg border border-[#e5e3d8] bg-white py-3 pl-12 pr-4 text-base outline-none transition placeholder:text-[#7c8e88] focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20"
              />
              <button
                type="submit"
                disabled={!searchQuery.trim() || isSearching}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#7c8e88] hover:text-[#1f644e] disabled:opacity-50 cursor-pointer font-bold text-sm transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Search Results - Enhanced */}
          <div>
            <div className="flex items-center justify-between mb-5 px-1">
              <div>
                <h2 className="text-sm font-bold text-[#1e3a34]">
                  {searchQuery ? 'Search Results' : 'Ready to search'}
                </h2>
                {searchQuery && (
                  <p className="text-xs text-[#7c8e88] mt-1">
                    {memories.length} {memories.length === 1 ? 'result' : 'results'} found
                  </p>
                )}
                {!searchQuery && (
                  <p className="text-xs text-[#7c8e88] mt-1">Enter a query to find memories</p>
                )}
              </div>
            </div>

            <SkeletonWrapper loading={isLoading && memories.length === 0 && searchQuery}>
              <div className="space-y-3">
                {!isLoading && memories.length === 0 && searchQuery ? (
                  <div className="text-center py-16 border-2 border-dashed border-[#e5e3d8] rounded-lg bg-gradient-to-b from-[#fcfbf5] to-white">
                    <div className="inline-flex p-3 bg-[#1f644e]/5 rounded-full mb-4">
                      <Sparkles className="w-8 h-8 text-[#1f644e]" />
                    </div>
                    <p className="text-[#1e3a34] font-semibold mb-1">No matches found</p>
                    <p className="text-[#7c8e88] text-sm">Try a different search term</p>
                  </div>
                ) : !searchQuery ? (
                  <div className="text-center py-16 border-2 border-dashed border-[#e5e3d8] rounded-lg bg-gradient-to-b from-[#fcfbf5] to-white">
                    <div className="inline-flex p-3 bg-[#1f644e]/5 rounded-full mb-4">
                      <Sparkles className="w-8 h-8 text-[#1f644e]" />
                    </div>
                    <p className="text-[#1e3a34] font-semibold mb-1">Start searching</p>
                    <p className="text-[#7c8e88] text-sm">Type a keyword to find memories</p>
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
                    />
                  ))
                )}
              </div>
            </SkeletonWrapper>
          </div>
        </div>
      );
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#1f644e] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-[#7c8e88] font-medium">Loading ReCall...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return (
    <AppLayout
      appName="ReCall"
      appLogo="/images/apps/recall.png"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabTitles={tabTitles}
    >
      <div className="pt-2 lg:pt-6 pb-20 lg:pb-0">{renderContent()}</div>
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
}) {
  return (
    <div className="group border border-[#e5e3d8] bg-white rounded-lg p-4 hover:border-[#1f644e]/30 hover:shadow-md transition-all duration-200">
      {editingId === memory._id ? (
        <div className="flex flex-col gap-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full rounded-lg border border-[#e5e3d8] bg-[#fcfbf5] p-3 text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20 min-h-[100px] resize-y text-sm"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelEditing}
              className="px-3 py-1.5 text-xs font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleUpdate(memory._id)}
              disabled={isUpdating || !editText.trim()}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-[#1f644e] text-white rounded-lg hover:bg-[#17503e] disabled:opacity-50 transition-colors cursor-pointer"
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
          <div className="whitespace-pre-wrap text-[#1e3a34] leading-relaxed mb-3 text-sm font-medium">
            {memory.text}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#f0f5f2]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#a0b2ac]">
                {formatDate(memory.createdAt)}
              </span>
              {memory.score && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1f644e]/5 text-[#1f644e] rounded-full text-xs font-semibold">
                  <Sparkles className="w-3 h-3" />
                  {(memory.score * 100).toFixed(0)}% match
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEditing(memory)}
                className="p-1.5 text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(memory._id)}
                className="p-1.5 text-[#7c8e88] hover:text-[#c94c4c] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
