'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import {
  TerminalSquare,
  ArrowLeft,
  Loader2,
  Save,
  Settings2,
  Eye,
  Code2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, Skeleton } from '@/components/ui';

export default function EditAppPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [designSchema, setDesignSchema] = useState('modern');
  const [content, setContent] = useState('');
  const [type, setType] = useState('manual');
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'preview'

  const fetchApp = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/apps/${appId}`);
      if (!res.ok) throw new Error('Failed to fetch app');
      const data = await res.json();

      setName(data.app.name);
      setDescription(data.app.description);
      setContent(data.app.content);
      setDesignSchema(data.app.designSchema || 'modern');
      setType(data.app.type);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    if (appId) fetchApp();
  }, [appId, fetchApp]);

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    if (!name || !description || !content) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/apps/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, content, designSchema }),
      });

      if (res.ok) {
        setHasUnsavedChanges(false);
        // Optional: show a toast notification here
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update app');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut for saving (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleUpdate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [name, description, content, designSchema]);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-12 w-1/3 bg-neutral-100 animate-pulse rounded-lg" />
        <div className="grid lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-8 h-[700px] rounded-2xl" />
          <Skeleton className="lg:col-span-4 h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Sticky Header - Flush with layout edges */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200 -mx-6 lg:-mx-8 -mt-6 px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/apps')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-500 group-hover:text-black" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-black">{name || 'Untitled App'}</h1>
                {hasUnsavedChanges && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider border border-amber-100">
                    Unsaved
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-medium">App ID: {appId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab(activeTab === 'code' ? 'preview' : 'code')}
              className={`px-4 py-2 text-sm font-semibold transition-all flex items-center gap-2 rounded-xl ${
                activeTab === 'preview'
                  ? 'bg-black text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {activeTab === 'preview' ? (
                <Code2 className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {activeTab === 'preview' ? 'View Code' : 'Live Preview'}
            </button>
            <button
              onClick={() => handleUpdate()}
              disabled={saving || !hasUnsavedChanges}
              className="px-6 py-2.5 bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-black/5 active:scale-95"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Editor/Preview Section */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'code'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  Code
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'preview'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  Preview
                </button>
              </div>
              <div className="text-[11px] text-neutral-400 font-mono italic">
                {activeTab === 'code' ? 'HTML • JS • Tailwind' : 'Sandbox Environment'}
              </div>
            </div>

            <Card className="overflow-hidden border-2 border-neutral-200 shadow-xl rounded-2xl bg-[#1e1e1e]">
              <div className="h-[850px] w-full bg-white relative">
                {activeTab === 'code' ? (
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    theme="vs-dark"
                    value={content}
                    onChange={(val) => {
                      setContent(val || '');
                      setHasUnsavedChanges(true);
                    }}
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: true,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 20 },
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      cursorSmoothCaretAnimation: 'on',
                      smoothScrolling: true,
                      formatOnPaste: true,
                      formatOnType: true,
                      wordWrap: 'on',
                      bracketPairColorization: { enabled: true },
                      suggestOnTriggerCharacters: true,
                      autoClosingBrackets: 'always',
                      autoClosingQuotes: 'always',
                      folding: true,
                    }}
                  />
                ) : (
                  <iframe
                    srcDoc={content}
                    title="Live App Preview"
                    sandbox="allow-scripts allow-forms allow-modals allow-popups"
                    className="w-full h-full border-none"
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar Settings */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2 px-2">
              <Settings2 className="w-4 h-4 text-neutral-500" />
              <h3 className="font-bold text-sm tracking-tight text-neutral-700">Configuration</h3>
            </div>

            <Card className="p-6 border-2 border-neutral-100 bg-white rounded-2xl shadow-sm space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 mb-2 block">
                  Application Name
                </label>
                <input
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-black focus:ring-4 focus:ring-black/5 rounded-xl outline-none text-sm transition-all font-semibold"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="e.g. Sales Dashboard"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 mb-2 block">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-black focus:ring-4 focus:ring-black/5 rounded-xl outline-none text-sm transition-all min-h-[120px] resize-none leading-relaxed"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="What does this app do?"
                />
              </div>

              {type === 'ai' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 mb-2 block">
                    Design System
                  </label>
                  <div className="relative group">
                    <select
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 focus:border-black rounded-xl outline-none text-sm transition-all appearance-none cursor-pointer font-medium"
                      value={designSchema}
                      onChange={(e) => {
                        setDesignSchema(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <option value="modern">Modern Minimalist</option>
                      <option value="dashboard">Dashboard Utility</option>
                      <option value="playful">Playful & Colorful</option>
                      <option value="corporate">Corporate Professional</option>
                      <option value="brutalism">Swiss Brutalism</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 group-hover:text-black transition-colors">
                      <Settings2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-4 border-2 border-neutral-100 bg-neutral-50/50 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-neutral-200">
                  <AlertCircle className="w-4 h-4 text-neutral-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-700">Quick Tip</h4>
                  <p className="text-[11px] text-neutral-500 leading-relaxed mt-1">
                    Press{' '}
                    <kbd className="px-1 py-0.5 bg-white border border-neutral-300 rounded text-[9px]">
                      ⌘
                    </kbd>{' '}
                    +{' '}
                    <kbd className="px-1 py-0.5 bg-white border border-neutral-300 rounded text-[9px]">
                      S
                    </kbd>{' '}
                    to save your progress at any time.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
