'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { Card } from '@/components/ui';
import ReactMarkdown from 'react-markdown';
import {
  TerminalSquare,
  Cpu,
  PenTool,
  ArrowLeft,
  Loader2,
  Sparkles,
  Eye,
  Code2,
  Bot,
  Wrench,
  CheckCircle2,
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
  const [isGenerated, setIsGenerated] = useState(false);

  // Form state
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [content, setContent] = useState(initialData.content || '');
  const [type, setType] = useState(initialData.type || 'manual');

  // AI specific
  const [aiPreviewContent, setAiPreviewContent] = useState(null);
  const [aiTodoList, setAiTodoList] = useState([]);
  const [agentStream, setAgentStream] = useState([]);
  const streamEndRef = useRef(null);

  // Plan approval flow
  const [showPlanApproval, setShowPlanApproval] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState([]);
  const [threadId, setThreadId] = useState(null);

  // Initialize with initial data
  useEffect(() => {
    if (initialData.name) setName(initialData.name);
    if (initialData.description) setDescription(initialData.description);
    if (initialData.content) setContent(initialData.content);
    if (initialData.type) setType(initialData.type);
  }, [initialData]);

  useEffect(() => {
    if (streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentStream]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!name || !description) return alert('Name and description are required.');

    setLoading(true);
    setIsGenerated(false);
    setAiPreviewContent(null);
    setAiTodoList([]);
    setAgentStream([]);
    setContent('');
    setActiveTab('preview');
    setShowPlanApproval(false);
    setGeneratedPlan([]);
    setThreadId(null);

    try {
      const res = await fetch('/api/admin/apps/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let pendingThought = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          let data;
          try {
            data = JSON.parse(line);
          } catch (e) {
            console.warn('Failed to parse stream line:', line);
            continue;
          }

          if (data.type === 'error') {
            throw new Error(data.message);
          }

          if (data.type === 'thought') {
            pendingThought += data.message;
            setAgentStream((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.type === 'thought') {
                return [...prev.slice(0, -1), { ...last, message: pendingThought }];
              }
              return [...prev, { type: 'thought', message: pendingThought }];
            });
          } else if (data.type === 'status') {
            pendingThought = ''; // Reset thought buffer
            setAgentStream((prev) => [
              ...prev,
              { type: 'tool', message: data.message, status: 'running' },
            ]);
          } else if (data.type === 'plan_ready' || data.type === 'interrupted') {
            // Plan generated - show approval UI
            pendingThought = '';
            setGeneratedPlan(data.plan || []);
            setThreadId(data.threadId);
            setShowPlanApproval(true);
            setLoading(false);
            setAgentStream((prev) => [
              ...prev,
              { type: 'plan', message: data.message, plan: data.plan },
            ]);
          } else if (data.type === 'tool_result') {
            pendingThought = ''; // Reset thought buffer
            setAgentStream((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.type === 'tool' && last.status === 'running') {
                return [...prev.slice(0, -1), { ...last, status: 'complete' }];
              }
              return prev;
            });
            // Update the live preview/code with the current state of the document
            if (data.content !== undefined) {
              setContent(data.content);
              setAiPreviewContent(data.content);
            }
          } else if (data.type === 'done') {
            setAiPreviewContent(data.content);
            setContent(data.content);
            setAiTodoList(data.todoList || []);
            setActiveTab('code'); // Switch back to code when done
            setIsGenerated(true);
            setShowPlanApproval(false);
            setAgentStream((prev) => [
              ...prev,
              { type: 'success', message: 'App built successfully!' },
            ]);
          }
        }
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
      setAgentStream((prev) => [
        ...prev,
        { type: 'error', message: `Generation failed: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePlan = async (approved = true) => {
    if (!threadId) return;

    setLoading(true);
    setShowPlanApproval(false);

    try {
      const res = await fetch('/api/admin/apps/approve-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          approved,
          name, // Pass name for system prompt
          description, // Pass description for system prompt
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let pendingThought = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          let data;
          try {
            data = JSON.parse(line);
          } catch (e) {
            console.warn('Failed to parse stream line:', line);
            continue;
          }

          if (data.type === 'error') {
            throw new Error(data.message);
          }

          if (data.type === 'thought') {
            pendingThought += data.message;
            setAgentStream((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.type === 'thought') {
                return [...prev.slice(0, -1), { ...last, message: pendingThought }];
              }
              return [...prev, { type: 'thought', message: pendingThought }];
            });
          } else if (data.type === 'status') {
            pendingThought = '';
            setAgentStream((prev) => [
              ...prev,
              { type: 'tool', message: data.message, status: 'running' },
            ]);
          } else if (data.type === 'tool_result') {
            pendingThought = '';
            setAgentStream((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.type === 'tool' && last.status === 'running') {
                return [...prev.slice(0, -1), { ...last, status: 'complete' }];
              }
              return prev;
            });
            if (data.content !== undefined) {
              setContent(data.content);
              setAiPreviewContent(data.content);
            }
          } else if (data.type === 'done') {
            setAiPreviewContent(data.content);
            setContent(data.content);
            setAiTodoList(data.todoList || []);
            setActiveTab('code');
            setIsGenerated(true);
            setAgentStream((prev) => [
              ...prev,
              { type: 'success', message: 'App built successfully!' },
            ]);
          }
        }
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
      setAgentStream((prev) => [
        ...prev,
        { type: 'error', message: `Build failed: ${error.message}` },
      ]);
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

              <div className="pt-6 border-t border-neutral-100 flex flex-col gap-3">
                {mode === 'ai' && !isEdit ? (
                  <>
                    <button
                      onClick={handleGenerate}
                      disabled={loading || !name || !description}
                      className={`w-full py-4 ${isGenerated ? 'bg-white border-2 border-neutral-200 text-black hover:border-black' : 'bg-black text-white hover:bg-neutral-800'} disabled:bg-neutral-200 disabled:text-white disabled:border-transparent rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />{' '}
                          {isGenerated ? 'Regenerate App' : 'Generate App'}
                        </>
                      )}
                    </button>
                    {isGenerated && (
                      <button
                        onClick={handleSave}
                        disabled={loading || !name || !description || !content}
                        className="w-full py-4 bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                          </>
                        ) : (
                          'Save to Dashboard'
                        )}
                      </button>
                    )}
                  </>
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
              <div className="flex-1 flex h-full relative">
                {/* Agent Activity Sidebar (Only visible during AI generation or viewing AI generated app state) */}
                {mode === 'ai' && (loading || agentStream.length > 0) && (
                  <div className="w-full md:w-80 border-r border-neutral-100 bg-neutral-50/50 flex flex-col h-full shrink-0 z-10 absolute md:relative overflow-hidden transition-all duration-300">
                    <div className="p-4 border-b border-neutral-100 bg-white flex items-center gap-3 shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-inner">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900">Code Assistant</h4>
                        <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-widest flex items-center gap-1.5">
                          {loading ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                              Running
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              Idle
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-chat-scrollbar">
                      {agentStream.map((event, idx) => (
                        <div
                          key={idx}
                          className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-sm"
                        >
                          {event.type === 'thought' && (
                            <div className="flex gap-3">
                              <div className="w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                                <Bot className="w-3.5 h-3.5 text-neutral-500" />
                              </div>
                              <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-neutral-200 shadow-sm text-neutral-700 w-full leading-relaxed text-[13px] prose prose-sm max-w-none">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => (
                                      <p className="mb-2 last:mb-0">{children}</p>
                                    ),
                                    code: ({ inline, children }) =>
                                      inline ? (
                                        <code className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 text-xs font-mono">
                                          {children}
                                        </code>
                                      ) : (
                                        <code className="block px-2 py-1 rounded bg-neutral-100 text-neutral-800 text-xs font-mono overflow-x-auto">
                                          {children}
                                        </code>
                                      ),
                                    ul: ({ children }) => (
                                      <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
                                    ),
                                    ol: ({ children }) => (
                                      <ol className="list-decimal pl-4 mb-2 space-y-1">
                                        {children}
                                      </ol>
                                    ),
                                  }}
                                >
                                  {event.message}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                          {event.type === 'plan' && (
                            <div className="ml-9 border-2 border-blue-200 rounded-xl bg-blue-50 overflow-hidden shadow-sm">
                              <div className="px-3 py-2 bg-blue-100/80 border-b border-blue-200/60">
                                <span className="font-bold text-xs text-blue-900">
                                  📋 Generated Plan
                                </span>
                              </div>
                              <div className="p-3 space-y-2">
                                {event.plan &&
                                  event.plan.map((step, i) => (
                                    <div key={i} className="flex gap-2 text-xs text-blue-900">
                                      <span className="font-bold">{i + 1}.</span>
                                      <span>{step}</span>
                                    </div>
                                  ))}
                                {showPlanApproval && (
                                  <div className="flex gap-2 pt-3 border-t border-blue-200 mt-3">
                                    <button
                                      onClick={() => handleApprovePlan(true)}
                                      disabled={loading}
                                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      ✓ Approve & Build
                                    </button>
                                    <button
                                      onClick={() => handleApprovePlan(false)}
                                      disabled={loading}
                                      className="flex-1 py-2 px-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      ✗ Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {event.type === 'tool' && (
                            <div className="ml-9 border border-neutral-200 rounded-xl bg-white overflow-hidden shadow-sm">
                              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50/80 border-b border-neutral-200/60">
                                {event.status === 'running' ? (
                                  <div className="w-3.5 h-3.5 border-[1.5px] border-neutral-200 border-t-neutral-800 border-r-neutral-800 rounded-full animate-spin shrink-0"></div>
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                )}
                                <span className="font-bold text-xs text-neutral-700 truncate">
                                  {event.message}
                                </span>
                              </div>
                            </div>
                          )}
                          {event.type === 'error' && (
                            <div className="ml-9 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-medium">
                              {event.message}
                            </div>
                          )}
                          {event.type === 'success' && (
                            <div className="ml-9 p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-medium flex items-center gap-2">
                              <Sparkles className="w-4 h-4 shrink-0" />
                              {event.message}
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={streamEndRef} />
                    </div>
                  </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 h-full relative bg-white overflow-hidden">
                  {activeTab === 'code' ? (
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
                        readOnly: loading, // Prevent user edits while AI is generating
                      }}
                    />
                  ) : content || aiPreviewContent ? (
                    <iframe
                      srcDoc={content || aiPreviewContent}
                      title="App Preview"
                      sandbox="allow-scripts allow-forms allow-modals allow-popups"
                      className="w-full h-full border-none absolute inset-0 bg-white"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-50/30 p-8 text-center">
                      <div className="max-w-sm">
                        <div className="w-20 h-20 bg-neutral-100 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-inner">
                          {mode === 'ai' ? (
                            <Cpu className="w-8 h-8 text-neutral-400" />
                          ) : (
                            <TerminalSquare className="w-8 h-8 text-neutral-400" />
                          )}
                        </div>
                        <p className="text-neutral-900 font-bold text-lg mb-2">
                          {mode === 'ai' ? 'Awaiting Generation' : 'Empty Canvas'}
                        </p>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                          {mode === 'ai'
                            ? 'Fill out the app details on the left and click Generate to see your app built live.'
                            : 'Switch to the Code tab and start writing HTML/JS to see it rendered here.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
