'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { Card } from '@/components/ui';
import {
  TerminalSquare,
  Cpu,
  PenTool,
  ArrowLeft,
  Loader2,
  Sparkles,
  Eye,
  Code2,
} from 'lucide-react';

export default function AppEditor({
  isEdit = false,
  initialData = {},
  onSave,
  showModeSelection = false,
}) {
  const router = useRouter();

  // Mode selection for create
  const [mode, setMode] = useState(showModeSelection ? null : 'manual');

  // Tab state
  const [activeTab, setActiveTab] = useState('preview');

  // Loading states
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [designSchema, setDesignSchema] = useState(initialData.designSchema || 'modern');
  const [content, setContent] = useState(initialData.content || '');
  const [type, setType] = useState(initialData.type || 'manual');

  // AI specific
  const [aiPreviewContent, setAiPreviewContent] = useState(null);
  const [aiTodoList, setAiTodoList] = useState([]);

  // Initialize with initial data
  useEffect(() => {
    if (initialData.name) setName(initialData.name);
    if (initialData.description) setDescription(initialData.description);
    if (initialData.content) setContent(initialData.content);
    if (initialData.designSchema) setDesignSchema(initialData.designSchema);
    if (initialData.type) setType(initialData.type);
  }, [initialData]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!name || !description) return alert('Name and description are required.');

    setLoading(true);
    setAiPreviewContent(null);
    setAiTodoList([]);
    setActiveTab('preview');

    try {
      const res = await fetch('/api/admin/apps/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, designSchema }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate app');

      setAiPreviewContent(data.content);
      setContent(data.content);
      setAiTodoList(data.todoList);
      setActiveTab('code');
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name || !description || !content) {
      return alert('All fields including content are required.');
    }

    setLoading(true);
    try {
      await onSave({
        name,
        description,
        content,
        type: mode || type,
        designSchema,
      });
    } catch (error) {
      console.error(error);
      alert(error.message);
      setLoading(false);
    }
  };

  // Mode selection UI
  if (!mode) {
    return (
      <div className="w-full space-y-8 pb-24 animate-in fade-in">
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={() => router.push('/admin/apps')}
            className="p-2.5 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-500 hover:text-black"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold font-['Playfair_Display'] text-black">
              Create New App
            </h1>
            <p className="text-neutral-500 mt-1">Select an assembly method for your new tool.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card
            interactive
            onClick={() => setMode('ai')}
            className="p-10 border-2 border-neutral-100 hover:border-black transition-all cursor-pointer group flex flex-col items-center text-center h-80 justify-center bg-white rounded-2xl relative overflow-hidden"
          >
            <div className="w-20 h-20 rounded-2xl bg-black text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <Cpu className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-neutral-900 group-hover:text-black">
              Generate with AI
            </h2>
            <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
              Describe what you need. The LangGraph agent will architect and build a complete
              HTML/JS tool autonomously.
            </p>
          </Card>

          <Card
            interactive
            onClick={() => setMode('manual')}
            className="p-10 border-2 border-neutral-100 hover:border-black transition-all cursor-pointer group flex flex-col items-center text-center h-80 justify-center bg-white rounded-2xl relative overflow-hidden"
          >
            <div className="w-20 h-20 rounded-2xl bg-neutral-100 text-neutral-600 border border-neutral-200/60 flex items-center justify-center mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-all">
              <PenTool className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-neutral-900 group-hover:text-black">
              Add Manually
            </h2>
            <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
              Write your own HTML/JS/CSS code directly in the professional code editor.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Main editor UI
  return (
    <div className="w-full space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-neutral-200 pb-8">
        <button
          onClick={() => {
            if (showModeSelection) {
              setMode(null);
              setAiPreviewContent(null);
            } else {
              router.push('/admin/apps');
            }
          }}
          className="p-2.5 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-500 hover:text-black"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold font-['Playfair_Display'] flex items-center gap-3 text-black">
            {isEdit ? (
              <>
                <Code2 className="w-8 h-8 md:w-10 md:h-10 text-black" />
                Edit App
              </>
            ) : mode === 'ai' ? (
              <>
                <Cpu className="w-8 h-8 md:w-10 md:h-10 text-black" />
                AI App Generator
              </>
            ) : (
              <>
                <PenTool className="w-8 h-8 md:w-10 md:h-10 text-black" />
                Manual App Creator
              </>
            )}
          </h1>
          <p className="text-neutral-500 mt-1">
            {isEdit
              ? 'Modify your app details and code.'
              : mode === 'ai'
                ? 'AI will generate your app code.'
                : 'Write your app code manually.'}
          </p>
        </div>
        {!isEdit && (
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
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Configuration Column */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-8 border-2 border-neutral-100 bg-white rounded-2xl">
            <h2 className="text-xl font-bold mb-6 text-black">App Configuration</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                  Application Name
                </label>
                <input
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all font-medium text-black placeholder:text-neutral-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sales Dashboard"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all min-h-[120px] resize-none leading-relaxed text-black placeholder:text-neutral-400"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    mode === 'ai'
                      ? 'Describe what the app should do...'
                      : 'Brief description of the tool...'
                  }
                />
              </div>

              {mode === 'ai' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                    Design System
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all appearance-none cursor-pointer font-medium text-black"
                    value={designSchema}
                    onChange={(e) => setDesignSchema(e.target.value)}
                  >
                    <option value="modern">Modern Minimalist</option>
                    <option value="dashboard">Dashboard Utility</option>
                    <option value="playful">Playful & Colorful</option>
                    <option value="corporate">Corporate Professional</option>
                    <option value="brutalism">Swiss Brutalism</option>
                  </select>
                </div>
              )}

              <div className="pt-6 border-t border-neutral-100">
                {mode === 'ai' && !isEdit ? (
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !name || !description}
                    className="w-full py-4 bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Generate App
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={loading || !name || !description || !content}
                    className="w-full py-4 bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{' '}
                        {isEdit ? 'Saving...' : 'Saving...'}
                      </>
                    ) : isEdit ? (
                      'Save Changes'
                    ) : (
                      'Save to Dashboard'
                    )}
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Editor/Preview Column */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-0 border-2 border-neutral-100 bg-white overflow-hidden flex flex-col h-[800px] rounded-2xl">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-200/50 flex items-center justify-center">
                  <TerminalSquare className="w-4 h-4 text-neutral-600" />
                </div>
                <h3 className="font-bold text-neutral-900">
                  {activeTab === 'code' ? 'Code Editor' : 'Live Preview'}
                </h3>
              </div>
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
            </div>

            <div
              className="flex-1 h-full w-full bg-white relative"
              onMouseEnter={() => {
                const cursor = document.querySelector('.cursor');
                const follower = document.querySelector('.cursor-follower');
                if (cursor) cursor.style.display = 'none';
                if (follower) follower.style.display = 'none';
              }}
              onMouseLeave={() => {
                const cursor = document.querySelector('.cursor');
                const follower = document.querySelector('.cursor-follower');
                if (cursor) cursor.style.display = '';
                if (follower) follower.style.display = '';
              }}
            >
              {activeTab === 'code' ? (
                mode === 'ai' && loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 text-center space-y-6">
                    <div className="w-16 h-16 border-4 border-neutral-100 border-t-black rounded-full animate-spin"></div>
                    <div>
                      <p className="text-neutral-900 font-bold text-lg">Architecting Your App...</p>
                      <p className="text-sm text-neutral-500 mt-2">
                        The LangGraph agent is planning and writing code. This takes 15-30s.
                      </p>
                    </div>
                  </div>
                ) : (
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    theme="vs-dark"
                    value={content}
                    onChange={(val) => setContent(val || '')}
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: true,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 20 },
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      cursorSmoothCaretAnimation: 'off',
                      cursorBlinking: 'smooth',
                      cursorWidth: 2,
                      smoothScrolling: false,
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
                )
              ) : mode === 'ai' ? (
                aiPreviewContent ? (
                  <div className="flex-1 flex flex-col md:flex-row relative h-full">
                    <div className="flex-1 h-full w-full bg-white relative">
                      <iframe
                        srcDoc={aiPreviewContent}
                        title="App Preview"
                        sandbox="allow-scripts allow-forms allow-modals allow-popups"
                        className="w-full h-full border-none absolute inset-0"
                      />
                    </div>
                    {aiTodoList.length > 0 && (
                      <div className="w-full md:w-72 bg-neutral-50 border-t md:border-t-0 md:border-l border-neutral-200 p-6 overflow-y-auto shrink-0 z-10">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-5">
                          Agent Execution Plan
                        </h4>
                        <ul className="space-y-4">
                          {aiTodoList.map((item, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-neutral-700 flex gap-3 leading-relaxed"
                            >
                              <span className="text-black font-black shrink-0">{idx + 1}.</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-neutral-50/30 p-8 text-center">
                    <div className="max-w-sm">
                      <div className="w-20 h-20 bg-neutral-100 rounded-2xl mx-auto flex items-center justify-center mb-6">
                        <TerminalSquare className="w-8 h-8 text-neutral-400" />
                      </div>
                      <p className="text-neutral-900 font-bold text-lg mb-2">Awaiting Generation</p>
                      <p className="text-sm text-neutral-500 leading-relaxed">
                        Fill out the app details on the left and click Generate to see your app
                        built in real-time.
                      </p>
                    </div>
                  </div>
                )
              ) : content ? (
                <iframe
                  srcDoc={content}
                  title="Manual App Preview"
                  sandbox="allow-scripts allow-forms allow-modals allow-popups"
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-neutral-50/30 p-8 text-center">
                  <div className="max-w-sm">
                    <div className="w-20 h-20 bg-neutral-100 rounded-2xl mx-auto flex items-center justify-center mb-6">
                      <TerminalSquare className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-900 font-bold text-lg mb-2">Live Preview</p>
                    <p className="text-sm text-neutral-500 leading-relaxed">
                      Switch to the Code tab and start writing HTML/JS to see it rendered here in
                      real-time.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
