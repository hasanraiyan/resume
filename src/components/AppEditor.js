'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { Card } from '@/components/custom-ui';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
  ArrowUp,
  ChevronUp,
  ChevronDown,
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

  // Screen state - for AI mode, start with input screen
  const [showInputScreen, setShowInputScreen] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState('preview');

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const loading = isGenerating || isSaving;
  const [isGenerated, setIsGenerated] = useState(false);

  // Form state
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [content, setContent] = useState(initialData.content || '');
  const [type, setType] = useState(initialData.type || 'manual');

  // AI specific
  const [appId, setAppId] = useState(initialData._id || null);
  const [aiPreviewContent, setAiPreviewContent] = useState(null);
  const [aiTodoList, setAiTodoList] = useState([]);
  const [agentStream, setAgentStream] = useState([]);
  const streamEndRef = useRef(null);

  // Plan approval flow
  const [showPlanApproval, setShowPlanApproval] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [showAiSidebar, setShowAiSidebar] = useState(true);
  const [isTodoCollapsed, setIsTodoCollapsed] = useState(false);
  const [sidebarChatInput, setSidebarChatInput] = useState('');
  const [hasDraft, setHasDraft] = useState(false);

  // Initialize with initial data
  useEffect(() => {
    if (initialData._id) setAppId(initialData._id);
    if (initialData.name) setName(initialData.name);
    if (initialData.description) setDescription(initialData.description);
    if (initialData.content) setContent(initialData.content);
    if (initialData.type) setType(initialData.type || 'manual');
    if (initialData.threadId) setThreadId(initialData.threadId);
  }, [initialData]);

  // Handle Draft Persistence
  useEffect(() => {
    const draftKey = `app_draft_${isEdit ? initialData?._id : 'new'}`;
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      setHasDraft(true);
    }
  }, [isEdit, initialData?._id]);

  useEffect(() => {
    if (loading || !name) return; // Don't save empty/initial or during loading
    const draftKey = `app_draft_${isEdit ? initialData?._id : 'new'}`;
    const timeout = setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ name, description, content, type }));
    }, 30000); // 30s debounce
    return () => clearTimeout(timeout);
  }, [name, description, content, type, isEdit, initialData?._id, loading]);

  useEffect(() => {
    if (!appId || !name || loading) return;

    const timeout = setTimeout(async () => {
      try {
        await fetch(`/api/admin/apps/${appId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, content, threadId }),
        });
        console.log('Metadata auto-saved');
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 10000); // 10s debounce for metadata

    return () => clearTimeout(timeout);
  }, [name, description, appId, loading, content, threadId]);

  const restoreDraft = () => {
    const draftKey = `app_draft_${isEdit ? initialData?._id : 'new'}`;
    const draft = JSON.parse(localStorage.getItem(draftKey));
    if (draft) {
      setName(draft.name);
      setDescription(draft.description);
      setContent(draft.content);
      setType(draft.type);
      setHasDraft(false);
    }
  };

  const clearDraft = () => {
    const draftKey = `app_draft_${isEdit ? initialData?._id : 'new'}`;
    localStorage.removeItem(draftKey);
    setHasDraft(false);
  };

  useEffect(() => {
    if (streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentStream]);

  const handleGenerate = async (e, query = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const finalDescription = query || description;
    if (!name || !finalDescription) return alert('Name and description are required.');

    // Move to generation screen
    setShowInputScreen(false);
    setShowAiSidebar(true);

    setIsGenerating(true);
    setIsGenerated(false);
    setAiPreviewContent(null);
    setAiTodoList([]);
    // Only reset threadId if starting a completely new flow without an appId
    if (!appId) setThreadId(null);
    setAgentStream([{ type: 'human', message: finalDescription }]);
    // Use the description as well for context
    const currentCode = content || undefined;
    if (!content) {
      setContent('');
    }
    setActiveTab('preview');
    setShowPlanApproval(false);
    setGeneratedPlan([]);
    setThreadId(null);

    try {
      const res = await fetch('/api/admin/apps/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: finalDescription,
          initialCode: currentCode,
          appId: appId,
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

          if (data.type === 'metadata') {
            // AUTO-SAVE: Update local state and URL when draft is created
            if (data.appId && !appId) {
              setAppId(data.appId);
              setThreadId(data.threadId);
              // Update URL without reloading
              window.history.replaceState(null, '', `/admin/apps/${data.appId}/edit`);
            }
          } else if (data.type === 'thought') {
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
            setAgentStream((prev) => {
              // Mark any previous running entry as complete
              const updatedStream = prev.map((s) =>
                s.type === 'tool' && s.status === 'running' ? { ...s, status: 'complete' } : s
              );
              return [...updatedStream, { type: 'tool', message: data.message, status: 'running' }];
            });
          } else if (data.type === 'plan_ready' || data.type === 'interrupted') {
            // Plan generated - show approval UI
            pendingThought = '';
            setGeneratedPlan(data.plan || []);
            setThreadId(data.threadId);
            setShowPlanApproval(true);
            setIsGenerating(false);
            setAgentStream((prev) => {
              // Mark any 'running' tool as complete before adding the plan
              const updatedStream = prev.map((s) =>
                s.type === 'tool' && s.status === 'running' ? { ...s, status: 'complete' } : s
              );
              return [...updatedStream, { type: 'plan', message: data.message, plan: data.plan }];
            });
          } else if (data.type === 'tool_result') {
            pendingThought = ''; // Reset thought buffer
            setAgentStream((prev) =>
              prev.map((s, i, arr) => {
                // Find the last running tool and mark it complete
                const isLastRunningTool =
                  s.type === 'tool' &&
                  s.status === 'running' &&
                  !arr
                    .slice(i + 1)
                    .some((other) => other.type === 'tool' && other.status === 'running');
                return isLastRunningTool ? { ...s, status: 'complete' } : s;
              })
            );
            // Update the live preview/code with the current state of the document
            if (data.content !== undefined) {
              setContent(data.content);
              setAiPreviewContent(data.content);
            }
            if (data.plan) {
              setAiTodoList(data.plan);
              // Update the latest plan in the stream to keep it current
              setAgentStream((prev) =>
                prev.map((s) => (s.type === 'plan' ? { ...s, plan: data.plan } : s))
              );
            }
          } else if (data.type === 'done') {
            setAiPreviewContent(data.content);
            setContent(data.content);
            setAiTodoList(data.todoList || []);
            setActiveTab('preview'); // Keep preview active
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
      setIsGenerating(false);
    }
  };

  const handleApprovePlan = async (approved = true) => {
    setIsGenerating(true);
    setShowPlanApproval(false);

    setAgentStream((prev) => [
      ...prev,
      {
        type: 'human',
        message:
          approved === true
            ? 'Approved! Build the app.'
            : approved === false
              ? 'Rejected. Rethink the plan.'
              : approved,
      },
    ]);

    try {
      const res = await fetch('/api/admin/apps/approve-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          approved: typeof approved === 'string' ? approved : approved,
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
            setAgentStream((prev) => {
              // Mark any previous running entry as complete
              const updatedStream = prev.map((s) =>
                s.type === 'tool' && s.status === 'running' ? { ...s, status: 'complete' } : s
              );
              return [...updatedStream, { type: 'tool', message: data.message, status: 'running' }];
            });
          } else if (data.type === 'tool_result') {
            pendingThought = '';
            setAgentStream((prev) =>
              prev.map((s, i, arr) => {
                const isLastRunningTool =
                  s.type === 'tool' &&
                  s.status === 'running' &&
                  !arr
                    .slice(i + 1)
                    .some((other) => other.type === 'tool' && other.status === 'running');
                return isLastRunningTool ? { ...s, status: 'complete' } : s;
              })
            );
            if (data.content !== undefined) {
              setContent(data.content);
              setAiPreviewContent(data.content);
            }
            if (data.plan) {
              setAiTodoList(data.plan);
              // Update the latest plan in the stream to keep it current
              setAgentStream((prev) =>
                prev.map((s) => (s.type === 'plan' ? { ...s, plan: data.plan } : s))
              );
            }
          } else if (data.type === 'interrupted') {
            pendingThought = '';
            setGeneratedPlan(data.plan || []);
            setShowPlanApproval(true);
            setIsGenerating(false);
            setAgentStream((prev) => {
              const updatedStream = prev.map((s) =>
                s.type === 'tool' && s.status === 'running' ? { ...s, status: 'complete' } : s
              );
              return [...updatedStream, { type: 'plan', message: data.message, plan: data.plan }];
            });
          } else if (data.type === 'done') {
            setAiPreviewContent(data.content);
            setContent(data.content);
            setAiTodoList(data.todoList || []);
            setActiveTab('preview'); // Keep preview active
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
      setIsGenerating(false);
    }
  };

  const handleSidebarChatSend = () => {
    if (!sidebarChatInput.trim() || loading) return;

    const message = sidebarChatInput.trim();
    setSidebarChatInput('');
    setShowAiSidebar(true);

    if (showPlanApproval && threadId) {
      // User is refining the plan
      handleApprovePlan(message);
    } else if (threadId) {
      // User is refining the finished app or adding more features
      handleApprovePlan(message);
    } else {
      // Starting a fresh generation with this message
      if (!name) setName('My New App');
      // Pass the message directly to handleGenerate as a query
      // This way the app description remains stable
      handleGenerate(null, message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name || !description || !content) {
      return alert('All fields including content are required.');
    }

    setIsSaving(true);
    try {
      await onSave({
        name,
        description,
        content,
        type: mode || type,
        threadId: threadId,
      });
      clearDraft();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSaving(false);
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
          {hasDraft && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                Unsaved Draft Found
              </span>
              <button
                onClick={restoreDraft}
                className="text-[10px] font-black text-black underline underline-offset-2 hover:text-neutral-600 transition-colors uppercase"
              >
                Restore
              </button>
              <button
                onClick={clearDraft}
                className="text-[10px] font-bold text-neutral-400 hover:text-red-500 transition-colors"
                title="Discard Draft"
              >
                Discard
              </button>
            </div>
          )}
          <p className="text-neutral-500 mt-1">
            {isEdit
              ? 'Modify your app details and code.'
              : mode === 'ai'
                ? 'AI will generate your app code.'
                : 'Write your app code manually.'}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                className="w-full px-4 py-2 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all font-medium text-black placeholder:text-neutral-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Application Name"
              />
            </div>
            <button
              onClick={() => setShowAiSidebar(!showAiSidebar)}
              className={`p-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                showAiSidebar
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-neutral-50 border-neutral-100 text-neutral-500 hover:border-black hover:text-black'
              }`}
              title="AI Assistant"
            >
              <Bot className="w-5 h-5" />
            </button>
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
        </div>
      </div>

      {/* Input Screen - Only for AI mode, shown initially */}
      {mode === 'ai' && showInputScreen && (
        <div className="flex items-center justify-center min-h-[600px]">
          <Card className="w-full max-w-2xl p-12 border-2 border-neutral-100 bg-white rounded-2xl">
            <div className="text-center mb-8">
              <Cpu className="w-16 h-16 mx-auto mb-4 text-black" />
              <h2 className="text-3xl font-bold text-black mb-2">What do you want to build?</h2>
              <p className="text-neutral-500">Describe your app and AI will generate it for you</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                  Application Name
                </label>
                <input
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all font-medium text-black placeholder:text-neutral-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Todo List, Calculator, Weather App"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all min-h-[150px] resize-none leading-relaxed text-black placeholder:text-neutral-400"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what the app should do, its features, and how it should work..."
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !name || !description}
                className="w-full py-4 bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Starting Generation...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate App
                  </>
                )}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Generation/Editor Screen - Show when not on input screen */}
      {(!showInputScreen || mode !== 'ai') && (
        <div className="space-y-6">
          {/* Description Row */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block">
              Description
            </label>
            <textarea
              className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all min-h-[100px] resize-none leading-relaxed text-black placeholder:text-neutral-400"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                mode === 'ai'
                  ? 'Describe what the app should do...'
                  : 'Brief description of the tool...'
              }
            />
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!isGenerated && !content && (
              <button
                onClick={handleGenerate}
                disabled={loading || !name || !description}
                className="flex-1 py-4 bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate with AI
                  </>
                )}
              </button>
            )}
            {(isGenerated || content || isEdit) && (
              <button
                onClick={handleSave}
                disabled={loading || !name || !description || !content}
                className="flex-1 py-4 bg-black hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : isEdit ? (
                  'Save Changes'
                ) : (
                  'Save to Dashboard'
                )}
              </button>
            )}
          </div>

          {/* Editor/Preview Column */}
          <div className="space-y-6">
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
                  {/* Agent Activity Sidebar - visible if toggled or if AI build in progress */}
                  {showAiSidebar && (
                    <div className="w-[400px] md:w-[500px] border-r border-neutral-100 bg-neutral-50/50 flex flex-col h-full shrink-0 z-10 relative overflow-hidden transition-all duration-300">
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
                                <div className="w-8 h-8 rounded-xl bg-black border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mt-0.5">
                                  <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white p-4 rounded-2xl rounded-tl-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-neutral-800 w-full leading-relaxed text-[13.5px] prose prose-sm max-w-none">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                      h1: ({ children }) => (
                                        <h1 className="text-lg font-black uppercase tracking-tight mb-4 border-b-2 border-black pb-1">
                                          {children}
                                        </h1>
                                      ),
                                      h2: ({ children }) => (
                                        <h2 className="text-base font-black uppercase tracking-tight mb-3">
                                          {children}
                                        </h2>
                                      ),
                                      h3: ({ children }) => (
                                        <h3 className="text-sm font-black uppercase tracking-tight mb-2">
                                          {children}
                                        </h3>
                                      ),
                                      p: ({ children }) => (
                                        <p className="mb-3 last:mb-0 text-neutral-800 leading-relaxed">
                                          {children}
                                        </p>
                                      ),
                                      strong: ({ children }) => (
                                        <strong className="font-black text-black">
                                          {children}
                                        </strong>
                                      ),
                                      blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-black pl-4 py-1 my-4 italic bg-neutral-50 font-medium">
                                          {children}
                                        </blockquote>
                                      ),
                                      code: ({ inline, className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                          <div className="my-4 border-2 border-black rounded-lg overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="bg-black px-3 py-1 flex items-center justify-between">
                                              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                                {match[1]}
                                              </span>
                                            </div>
                                            <SyntaxHighlighter
                                              style={vscDarkPlus}
                                              language={match[1]}
                                              PreTag="div"
                                              customStyle={{
                                                margin: 0,
                                                padding: '1rem',
                                                fontSize: '12px',
                                                background: '#1e1e1e',
                                              }}
                                              {...props}
                                            >
                                              {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                          </div>
                                        ) : (
                                          <code
                                            className={`${inline ? 'px-1.5 py-0.5 rounded bg-neutral-100 text-black font-bold text-xs' : 'block p-3 rounded-lg bg-neutral-900 text-white text-xs font-mono overflow-x-auto my-3'}`}
                                            {...props}
                                          >
                                            {children}
                                          </code>
                                        );
                                      },
                                      ul: ({ children }) => (
                                        <ul className="list-none mb-4 space-y-2">{children}</ul>
                                      ),
                                      li: ({ children }) => (
                                        <li className="flex gap-2 items-start">
                                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                                          <span className="text-[13.5px]">{children}</span>
                                        </li>
                                      ),
                                      ol: ({ children }) => (
                                        <ol className="list-decimal pl-6 mb-4 space-y-2 font-bold">
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
                            {event.type === 'human' && (
                              <div className="flex gap-3 justify-end">
                                <div className="bg-white p-4 rounded-2xl rounded-tr-sm border-2 border-black shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] text-black w-fit max-w-[85%] leading-relaxed font-bold text-[13.5px] uppercase tracking-tight">
                                  {event.message}
                                </div>
                              </div>
                            )}
                            {event.type === 'plan' &&
                              (() => {
                                const isNewestPlan = !agentStream
                                  .slice(idx + 1)
                                  .some((e) => e.type === 'plan');

                                if (!isNewestPlan) {
                                  return (
                                    <div className="ml-9 border border-neutral-200 rounded-xl bg-neutral-50 px-3 py-2 text-[11px] text-neutral-500 flex items-center justify-between opacity-70 mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold">📋 Outdated Plan</span>
                                        <span className="italic">
                                          ({event.plan?.length || 0} steps)
                                        </span>
                                      </div>
                                      <span className="text-[9px] uppercase font-bold tracking-tight bg-neutral-200 px-1.5 py-0.5 rounded text-neutral-600">
                                        Archived
                                      </span>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="ml-11 border-2 border-black rounded-2xl bg-blue-50 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300 mb-2">
                                    <div className="px-4 py-2.5 bg-blue-600 border-b-2 border-black flex items-center justify-between">
                                      <span className="font-black text-[11px] uppercase tracking-widest text-white flex items-center gap-2">
                                        <span className="text-sm">📋</span> Implementation Plan
                                      </span>
                                      {showPlanApproval && (
                                        <span className="text-[9px] uppercase font-black tracking-widest bg-yellow-300 px-2 py-1 rounded-lg border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                                          WAITING
                                        </span>
                                      )}
                                    </div>
                                    <div className="p-3 space-y-2">
                                      {event.plan &&
                                        event.plan.map((step, i) => {
                                          const stepTask =
                                            typeof step === 'string' ? step : step.task;
                                          return (
                                            <div
                                              key={i}
                                              className="flex gap-4 text-xs leading-relaxed p-3 bg-white rounded-xl border-2 border-black/5 group/step hover:border-blue-400 transition-all duration-300"
                                            >
                                              <div className="flex flex-col items-center shrink-0">
                                                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px] border-2 border-blue-100 group-hover/step:bg-blue-600 group-hover/step:text-white group-hover/step:border-blue-600 transition-all">
                                                  {i + 1}
                                                </div>
                                                {i < event.plan.length - 1 && (
                                                  <div className="w-0.5 h-full bg-blue-50 mt-1" />
                                                )}
                                              </div>
                                              <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-blue-900 group-hover/step:text-blue-700 transition-colors">
                                                  {stepTask}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      {showPlanApproval && (
                                        <div className="flex flex-col gap-3 pt-3 border-t border-blue-200 mt-3">
                                          <p className="text-[10px] text-blue-700 italic">
                                            Review the plan above. Use the chat at the bottom to
                                            suggest changes, or approve to start building.
                                          </p>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => handleApprovePlan(true)}
                                              disabled={loading}
                                              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
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
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            {event.type === 'tool' && (
                              <div className="ml-11 border-2 border-black rounded-xl bg-white overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                <div className="flex items-center gap-3 px-4 py-2.5 bg-neutral-50 border-b-2 border-black">
                                  {event.status === 'running' ? (
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin shrink-0"></div>
                                  ) : (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                  )}
                                  <span className="font-black text-[11px] uppercase tracking-wider text-black truncate italic">
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

                      {/* Persistent TODO Tracker - Above Input */}
                      {aiTodoList && aiTodoList.length > 0 && (
                        <div className="mx-4 mb-4 border-2 border-black rounded-xl bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
                          <div className="px-3 py-1.5 bg-black text-white flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${isTodoCollapsed ? 'bg-green-400' : 'bg-white animate-pulse'}`}
                              ></span>
                              {isTodoCollapsed ? 'Build Progress' : 'In-Progress Plan'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                                {aiTodoList.filter((t) => t.status === 'completed').length}/
                                {aiTodoList.length}
                              </span>
                              <button
                                onClick={() => setIsTodoCollapsed(!isTodoCollapsed)}
                                className="p-1 hover:bg-neutral-800 rounded-md transition-colors text-white"
                              >
                                {isTodoCollapsed ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                          {!isTodoCollapsed && (
                            <div className="p-2 space-y-1.5 max-h-[160px] overflow-y-auto custom-chat-scrollbar animate-in slide-in-from-top-1">
                              {aiTodoList.map((todo, i) => (
                                <div
                                  key={i}
                                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg border-2 border-transparent transition-all ${
                                    todo.status === 'completed'
                                      ? 'bg-green-50/50 opacity-70'
                                      : todo.status === 'in-progress'
                                        ? 'bg-blue-50 border-blue-600'
                                        : 'bg-neutral-50'
                                  }`}
                                >
                                  {todo.status === 'completed' ? (
                                    <div className="w-4 h-4 rounded-md bg-green-500 text-white flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </div>
                                  ) : todo.status === 'in-progress' ? (
                                    <div className="w-4 h-4 rounded-md bg-yellow-300 flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                      <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 rounded-md bg-white border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0" />
                                  )}
                                  <span
                                    className={`text-[11px] font-bold truncate ${todo.status === 'completed' ? 'line-through text-green-700' : 'text-neutral-900'}`}
                                  >
                                    {todo.task}
                                  </span>
                                  {todo.status === 'in-progress' && (
                                    <span className="ml-auto text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                      Live
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Agent Chat Input Bar */}
                      <div className="p-4 border-t-2 border-black bg-white shrink-0">
                        <div className="rounded-2xl border-2 border-black focus-within:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col bg-neutral-50 overflow-hidden">
                          <textarea
                            value={sidebarChatInput}
                            onChange={(e) => {
                              setSidebarChatInput(e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                            }}
                            placeholder="Ask your assistant anything..."
                            rows={1}
                            className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-[13px] leading-relaxed outline-none placeholder:text-neutral-400 disabled:opacity-50 max-h-40 overflow-y-auto text-black font-medium"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSidebarChatSend();
                              }
                            }}
                            disabled={isGenerating}
                            style={{ height: '44px' }}
                          />
                          <div className="flex justify-end items-center px-2 pb-2">
                            <button
                              onClick={handleSidebarChatSend}
                              disabled={isGenerating || !sidebarChatInput.trim()}
                              className="w-8 h-8 rounded-xl flex items-center justify-center bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95"
                            >
                              {isGenerating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ArrowUp className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
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
      )}
    </div>
  );
}
