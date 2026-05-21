'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, Loader2, Sparkles, Pencil, Check, X, ArrowLeft, Brain } from 'lucide-react';
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
        background: '#d6e4dc',
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
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #f7f9f7 0%, #eef3ef 100%)' }}
    >
      {/* Top nav bar */}
      <nav className="sticky top-0 z-10 backdrop-blur-md border-b border-[#dde8e2]/60"
        style={{ background: 'rgba(247,249,247,0.85)' }}>
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link
            href="/apps"
            className="flex items-center gap-2 text-[#5a756e] hover:text-[#1f644e] transition-colors text-sm font-semibold group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Apps</span>
          </Link>

          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: '#1f644e' }}
            >
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-[#1a3530] tracking-tight">ReCall</span>
          </div>

          <div className="w-16" />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-10 lg:py-14">
        {/* Hero header */}
        <header className="mb-12 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 tracking-wide"
            style={{ background: '#e0ede8', color: '#1f644e' }}
          >
            <Sparkles className="w-3 h-3" />
            <span>AI-Powered Memory</span>
          </div>
          <h1
            className="text-5xl lg:text-6xl font-bold mb-4 tracking-tight leading-none"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#0f2922',
            }}
          >
            Re<span style={{ color: '#1f644e' }}>Call</span>
          </h1>
          <p className="text-[#5a756e] text-lg leading-relaxed max-w-md mx-auto">
            Your external memory — throw in a thought, find it later with semantic search.
          </p>
        </header>

        {/* Capture card */}
        <section className="mb-8">
          <div
            className="rounded-2xl border border-[#dde8e2] shadow-sm overflow-hidden"
            style={{ background: '#ffffff' }}
          >
            <form onSubmit={handleCapture}>
              <textarea
                ref={captureInputRef}
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                placeholder="Throw in a thought, link, or idea…"
                className="w-full px-5 pt-5 pb-3 text-base outline-none resize-none min-h-[110px] placeholder:text-[#a8bdb7] text-[#1a3530] leading-relaxed"
                style={{ background: 'transparent' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCapture(e);
                  }
                }}
              />
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f5f2]">
                <p className="text-xs text-[#a8bdb7] font-medium">
                  Press <kbd className="font-semibold">Enter</kbd> to save
                </p>
                <button
                  type="submit"
                  disabled={!captureText.trim() || isCapturing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 cursor-pointer shadow-sm active:scale-95"
                  style={{ background: '#1f644e' }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#17503e'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#1f644e'; }}
                >
                  {isCapturing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Capture
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Search bar */}
        <section className="mb-10">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-[#1f644e] animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#8aaba4]" />
              )}
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories semantically…"
              className="w-full rounded-xl border border-[#dde8e2] bg-white py-3.5 pl-11 pr-12 text-sm font-medium outline-none transition-all placeholder:text-[#a8bdb7] text-[#1a3530]"
              style={{
                boxShadow: '0 1px 3px rgba(31,100,78,0.06)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#1f644e';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31,100,78,0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#dde8e2';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(31,100,78,0.06)';
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#8aaba4] hover:text-[#1f644e] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </section>

        {/* Feed */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#8aaba4]">
              {searchQuery ? 'Search Results' : 'Recent Memories'}
            </h2>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: '#e0ede8', color: '#1f644e' }}
            >
              {memories.length}
            </span>
          </div>

          <SkeletonWrapper loading={isLoading && memories.length === 0}>
            <div className="space-y-3">
              {!isLoading && memories.length === 0 ? (
                <div
                  className="text-center py-16 rounded-2xl border-2 border-dashed border-[#dde8e2]"
                  style={{ background: 'rgba(255,255,255,0.5)' }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: '#e0ede8' }}
                  >
                    <Brain className="w-6 h-6" style={{ color: '#1f644e' }} />
                  </div>
                  <p className="text-[#5a756e] font-medium text-sm">
                    {searchQuery
                      ? 'No memories match that query.'
                      : 'Your memory bank is empty — start capturing above!'}
                  </p>
                </div>
              ) : (
                memories.map((memory, i) => (
                  <article
                    key={memory._id}
                    className="group rounded-xl border border-[#dde8e2] bg-white transition-all hover:border-[#b8d4c8] hover:shadow-md"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {editingId === memory._id ? (
                      <div className="p-5 flex flex-col gap-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full rounded-xl border border-[#dde8e2] px-4 py-3 text-sm text-[#1a3530] outline-none min-h-[100px] resize-y leading-relaxed"
                          style={{
                            background: '#f7fbf9',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#1f644e';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31,100,78,0.1)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#dde8e2';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-2 text-sm font-semibold text-[#5a756e] hover:text-[#1a3530] rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdate(memory._id)}
                            disabled={isUpdating || !editText.trim()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-lg transition-all disabled:opacity-40 cursor-pointer active:scale-95"
                            style={{ background: '#1f644e' }}
                            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#17503e'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#1f644e'; }}
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5">
                        <p className="whitespace-pre-wrap text-[#1a3530] leading-relaxed text-sm mb-5">
                          {memory.text}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t border-[#f0f5f2]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[#a8bdb7]">
                              {formatDate(memory.createdAt)}
                            </span>
                            {memory.score && (
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: '#e0ede8', color: '#1f644e' }}
                              >
                                {(memory.score * 100).toFixed(0)}% match
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditing(memory)}
                              className="p-2 rounded-lg text-[#8aaba4] hover:text-[#1f644e] hover:bg-[#f0f7f4] transition-all cursor-pointer"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(memory._id)}
                              className="p-2 rounded-lg text-[#8aaba4] hover:text-[#b84040] hover:bg-red-50 transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </SkeletonWrapper>
        </section>
      </main>
    </div>
  );
}
