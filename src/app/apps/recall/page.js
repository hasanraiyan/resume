'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, Loader2, Sparkles, Pencil, Check, X } from 'lucide-react';
import { SkeletonProvider, SkeletonWrapper } from 'react-skeletonify';
import 'react-skeletonify/dist/index.css';
import Link from 'next/link';

export default function RecallApp() {
  return (
    <SkeletonProvider
      config={{
        animation: 'animation-1',
        borderRadius: '12px',
        animationSpeed: 2,
        exceptTags: ['button', 'svg', 'img'],
        background: '#e5e3d8',
      }}
    >
      <RecallContent />
    </SkeletonProvider>
  );
}

function RecallContent() {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const [captureText, setCaptureText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const captureInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch recent memories on load
  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/recall/memories?limit=20');
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
        // Clear search if active to see the new memory
        if (searchQuery) {
          setSearchQuery('');
          await fetchMemories();
        } else {
          setMemories((prev) => [data.memory, ...prev]);
        }
        setCaptureText('');
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
    setIsLoading(true); // Trigger skeleton for results
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
    // Optimistic update
    const previous = [...memories];
    setMemories(memories.filter((m) => m._id !== id));

    try {
      const res = await fetch(`/api/recall/memories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    } catch (error) {
      console.error('Failed to delete memory:', error);
      // Revert optimistic update
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

  const clearSearch = () => {
    setSearchQuery('');
    fetchMemories();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12">
      {/* Header */}
      <header className="mb-10 text-center flex flex-col items-center">
        <Link
          href="/apps"
          className="self-start text-[#7c8e88] hover:text-[#1f644e] mb-4 flex items-center gap-2 transition-colors text-sm font-bold"
        >
          ← Back to Apps
        </Link>
        <h1 className="font-[family-name:var(--font-logo)] text-5xl text-[#1f644e] mb-3">ReCall</h1>
        <p className="text-[#7c8e88] font-medium text-lg">
          Your external memory. Throw it in, find it later.
        </p>
      </header>

      {/* Capture Section */}
      <section className="mb-12">
        <form onSubmit={handleCapture} className="relative shadow-sm rounded-2xl">
          <textarea
            ref={captureInputRef}
            value={captureText}
            onChange={(e) => setCaptureText(e.target.value)}
            placeholder="Throw in a thought, link, or idea instantly..."
            className="w-full rounded-2xl border border-[#e5e3d8] bg-white p-5 pr-16 text-lg outline-none transition placeholder:text-[#a0b2ac] focus:border-[#1f644e] focus:ring-4 focus:ring-[#1f644e]/10 resize-none min-h-[120px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCapture(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!captureText.trim() || isCapturing}
            className="absolute bottom-4 right-4 bg-[#1f644e] text-white p-3 rounded-xl hover:bg-[#17503e] disabled:opacity-50 disabled:hover:bg-[#1f644e] transition-all cursor-pointer shadow-md"
          >
            {isCapturing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </form>
      </section>

      {/* Search Section */}
      <section className="mb-8">
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
            className="w-full rounded-xl border-2 border-[#1f644e]/20 bg-white py-4 pl-12 pr-12 text-base font-medium outline-none transition placeholder:text-[#7c8e88] focus:border-[#1f644e] focus:ring-4 focus:ring-[#1f644e]/10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#7c8e88] hover:text-[#1e3a34] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </form>
      </section>

      {/* Feed / Results Section */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#7c8e88]">
            {searchQuery ? 'Search Results' : 'Recent Memories'}
          </h2>
          <span className="text-xs font-bold text-[#b0bfba]">{memories.length} items</span>
        </div>

        <SkeletonWrapper loading={isLoading && memories.length === 0}>
          <div className="space-y-4">
            {!isLoading && memories.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-[#e5e3d8] rounded-2xl bg-white/50">
                <Sparkles className="w-8 h-8 mx-auto text-[#c8d8d0] mb-3" />
                <p className="text-[#7c8e88] font-medium">
                  {searchQuery
                    ? 'No memories match that thought.'
                    : 'Your memory bank is empty. Start capturing above!'}
                </p>
              </div>
            ) : (
              memories.map((memory) => (
                <div
                  key={memory._id}
                  className="group border border-[#e5e3d8] bg-white rounded-2xl p-5 hover:border-[#c8d8d0] hover:shadow-sm transition-all"
                >
                  {editingId === memory._id ? (
                    <div className="flex flex-col gap-3">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] p-3 text-[#1e3a34] outline-none focus:border-[#1f644e] min-h-[100px] resize-y"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdate(memory._id)}
                          disabled={isUpdating || !editText.trim()}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e] disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="whitespace-pre-wrap text-[#1e3a34] leading-relaxed mb-4 text-[15px]">
                        {memory.text}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f0f5f2]">
                        <span className="text-xs font-semibold text-[#a0b2ac]">
                          {formatDate(memory.createdAt)}
                          {memory.score && ` • ${(memory.score * 100).toFixed(0)}% match`}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditing(memory)}
                            className="p-2 text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(memory._id)}
                            className="p-2 text-[#7c8e88] hover:text-[#c94c4c] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </SkeletonWrapper>
      </section>
    </div>
  );
}
