'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Eye, EyeOff, Hash, Smile } from 'lucide-react';
import { toast } from 'sonner';

const MOODS = [
  { value: 1, emoji: '😔', label: 'Sad' },
  { value: 2, emoji: '😐', label: 'Neutral' },
  { value: 3, emoji: '🙂', label: 'Fine' },
  { value: 4, emoji: '😊', label: 'Happy' },
  { value: 5, emoji: '🤩', label: 'Amazing' },
];

export default function ComposeView({ entry, onSave, onClose, availableTags = [] }) {
  const [title, setTitle] = useState(entry?.title || '');
  const [body, setBody] = useState(entry?.body || '');
  const [mood, setMood] = useState(entry?.mood || 3);
  const [tags, setTags] = useState(entry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const autoSaveTimer = useRef(null);

  // Auto-save to localStorage
  useEffect(() => {
    if (!entry) {
      const draft = localStorage.getItem('journaly_draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setTitle(parsed.title || '');
          setBody(parsed.body || '');
          setMood(parsed.mood || 3);
          setTags(parsed.tags || []);
        } catch (e) {}
      }
    }
  }, [entry]);

  useEffect(() => {
    if (!entry) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        localStorage.setItem('journaly_draft', JSON.stringify({ title, body, mood, tags }));
        setLastSaved(new Date());
      }, 2000);
    }
    return () => clearTimeout(autoSaveTimer.current);
  }, [title, body, mood, tags, entry]);

  const handleSave = async () => {
    if (!body.trim()) {
      toast.error('Entry body cannot be empty');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ title, body, mood, tags });
      if (!entry) localStorage.removeItem('journaly_draft');
      onClose();
    } catch (err) {
      toast.error('Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#fcfbf5] flex flex-col font-sans text-[#1e3a34]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#e5e3d8]">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-[#f0f5f2] rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg">{entry ? 'Edit Entry' : 'New Entry'}</h1>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && !entry && (
            <span className="text-xs text-[#7c8e88] hidden sm:block">
              Draft saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1e3a34] transition-all"
          >
            {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">{isPreview ? 'Edit' : 'Preview'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-[#1f644e] text-white rounded-xl text-sm font-bold hover:bg-[#17503e] transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          {/* Title */}
          {!isPreview ? (
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl sm:text-4xl font-bold bg-transparent outline-none placeholder:text-[#7c8e88]/50"
            />
          ) : (
            <h1 className="text-2xl sm:text-4xl font-bold">{title || 'Untitled'}</h1>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-6 py-4 border-y border-[#e5e3d8]/50">
            {/* Mood Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] flex items-center gap-1.5">
                <Smile className="w-3 h-3" /> How are you?
              </label>
              <div className="flex items-center gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`text-2xl p-1.5 rounded-xl transition-all ${
                      mood === m.value ? 'bg-[#1f644e]/10 scale-110' : 'grayscale opacity-40 hover:grayscale-0 hover:opacity-100'
                    }`}
                    title={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Picker */}
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] flex items-center gap-1.5">
                <Hash className="w-3 h-3" /> Tags
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#f0f5f2] text-[#1f644e] rounded-lg text-xs font-bold border border-[#1f644e]/10"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-[#c94c4c]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {!isPreview && (
                  <input
                    type="text"
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    className="bg-transparent outline-none text-xs font-medium min-w-[80px]"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="min-h-[400px]">
            {!isPreview ? (
              <textarea
                placeholder="Write your heart out..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full h-full min-h-[400px] bg-transparent outline-none resize-none text-lg leading-relaxed placeholder:text-[#7c8e88]/50"
              />
            ) : (
              <div className="prose prose-neutral max-w-none prose-p:leading-relaxed prose-p:text-[#1e3a34]">
                {body.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
                {!body && <p className="text-[#7c8e88] italic">No content yet...</p>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Loader2({ className }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
