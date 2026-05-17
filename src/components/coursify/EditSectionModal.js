'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Copy,
  Type,
  PlayCircle,
  ListTree,
  FileText,
  ChevronRight,
  FolderOpen,
  AlertCircle,
  BarChart3,
  Settings,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import QuizEditor from './QuizEditor';
import { parseMarkdownSection, generateFullMarkdown } from '@/utils/coursify-parser';
import { useCoursifyStudio } from '@/context/CoursifyStudioContext';

const RESOURCE_TYPES = ['video', 'article', 'doc', 'other'];
const STATUS_OPTIONS = ['planned', 'draft', 'needs_review', 'complete'];

const BLOCK_TYPES = [
  { type: 'MdBlock', label: 'Markdown', icon: Type },
  { type: 'VideoBlock', label: 'Video', icon: PlayCircle },
  { type: 'StepByStepBlock', label: 'Step-by-Step', icon: ListTree },
  { type: 'AccordionBlock', label: 'Accordion', icon: ChevronDown },
  { type: 'QuizBlock', label: 'Quiz', icon: CheckCircle2 },
  { type: 'ResourceBlock', label: 'Resource', icon: FileText },
  { type: 'TabsBlock', label: 'Tabs', icon: FolderOpen },
  { type: 'CalloutBlock', label: 'Callout', icon: AlertCircle },
  { type: 'ChartBlock', label: 'Chart', icon: BarChart3 },
];

// ─── Injected styles ──────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700&display=swap');

  .esm-root {
    --esm-ink:       #1e3a34;
    --esm-forest:    #1f644e;
    --esm-muted:     #7c8e88;
    --esm-border:    #e5e3d8;
    --esm-parchment: #fcfbf5;
    --esm-hover:     #f0f5f2;
    --esm-danger:    #c94c4c;

    font-family: 'Outfit', sans-serif;
    color: var(--esm-ink);
  }

  /* scrollbar */
  .esm-scroll::-webkit-scrollbar { width: 4px; }
  .esm-scroll::-webkit-scrollbar-track { background: transparent; }
  .esm-scroll::-webkit-scrollbar-thumb {
    background: var(--esm-border);
    border-radius: 99px;
  }
  .esm-scroll::-webkit-scrollbar-thumb:hover { background: var(--esm-muted); }

  /* slide-in panel */
  @keyframes esm-slide-in {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  .esm-panel {
    animation: esm-slide-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  /* backdrop */
  @keyframes esm-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .esm-backdrop {
    animation: esm-fade-in 0.22s ease both;
  }

  /* adder popup */
  @keyframes esm-pop {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.88); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  .esm-adder-popup { animation: esm-pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

  /* block entrance */
  @keyframes esm-block-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .esm-block { animation: esm-block-in 0.2s ease both; }

  /* tool step pill */
  @keyframes esm-pill {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .esm-pill { animation: esm-pill 0.16s ease both; }

  /* tab underline slide */
  .esm-tab-active {
    position: relative;
  }
  .esm-tab-active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0; right: 0;
    height: 2px;
    background: var(--esm-forest);
    border-radius: 2px 2px 0 0;
  }

  /* input focus ring */
  .esm-input:focus {
    border-color: var(--esm-forest);
    box-shadow: 0 0 0 3px rgba(31,100,78,0.08);
    outline: none;
  }

  /* save button shimmer on hover */
  .esm-save-btn {
    position: relative;
    overflow: hidden;
  }
  .esm-save-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 60%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }
  .esm-save-btn:hover:not(:disabled)::after { transform: translateX(100%); }
  .esm-save-btn:active:not(:disabled) { transform: scale(0.985); }

  /* block card */
  .esm-block-card {
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .esm-block-card:hover {
    box-shadow: 0 4px 24px rgba(31,100,78,0.07), 0 1px 4px rgba(0,0,0,0.04);
    border-color: rgba(31,100,78,0.2);
  }

  /* adder button pulse ring */
  .esm-adder-btn {
    position: relative;
  }
  .esm-adder-btn::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid var(--esm-forest);
    opacity: 0;
    transform: scale(0.7);
    transition: opacity 0.2s, transform 0.2s;
  }
  .esm-adder-btn:hover::before {
    opacity: 0.25;
    transform: scale(1);
  }

  /* mono textarea */
  .esm-mono {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    line-height: 1.7;
  }

  /* status badge */
  .esm-status-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--esm-forest);
    box-shadow: 0 0 0 0 rgba(31,100,78,0.4);
    animation: esm-pulse-dot 2.4s ease infinite;
  }
  @keyframes esm-pulse-dot {
    0%, 100% { box-shadow: 0 0 0 0 rgba(31,100,78,0); }
    50%       { box-shadow: 0 0 0 4px rgba(31,100,78,0.18); }
  }

  /* dashed add row */
  .esm-add-row {
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .esm-add-row:hover {
    background: var(--esm-hover);
    border-color: var(--esm-forest);
    color: var(--esm-forest);
  }

  /* Skeleton shimmer */
  @keyframes esm-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .esm-skeleton {
    background: linear-gradient(90deg, #f0f3f1 25%, #e6ebe8 50%, #f0f3f1 75%);
    background-size: 200% 100%;
    animation: esm-shimmer 2s infinite linear;
    border-radius: 8px;
  }
`;

// ─── Skeleton Component ───────────────────────────────────────────────────────
function GenerationSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="space-y-3">
        <div className="esm-skeleton h-8 w-3/4 rounded-lg" />
        <div className="esm-skeleton h-4 w-full" />
        <div className="esm-skeleton h-4 w-5/6" />
        <div className="esm-skeleton h-4 w-4/6" />
      </div>

      <div
        className="p-5 rounded-2xl border border-[#e5e3d8] space-y-4"
        style={{ background: 'var(--esm-parchment)' }}
      >
        <div className="flex items-center gap-3">
          <div className="esm-skeleton h-6 w-6 rounded-full" />
          <div className="esm-skeleton h-4 w-32" />
        </div>
        <div className="space-y-2 pl-9">
          <div className="esm-skeleton h-3 w-full" />
          <div className="esm-skeleton h-3 w-full" />
          <div className="esm-skeleton h-3 w-3/4" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="esm-skeleton h-5 w-40" />
        <div className="grid grid-cols-2 gap-3">
          <div className="esm-skeleton h-24 rounded-xl" />
          <div className="esm-skeleton h-24 rounded-xl" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="esm-skeleton h-4 w-full" />
        <div className="esm-skeleton h-4 w-full" />
        <div className="esm-skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Label({ children, className = '' }) {
  return (
    <span
      className={`block text-[10px] font-semibold uppercase tracking-[0.1em] px-0.5 mb-1.5 ${className}`}
      style={{ color: 'var(--esm-muted)', fontFamily: 'Outfit, sans-serif' }}
    >
      {children}
    </span>
  );
}

function EsmInput({ className = '', ...props }) {
  return (
    <input
      className={`esm-input w-full px-4 py-2.5 rounded-xl border text-sm transition-all ${className}`}
      style={{
        borderColor: 'var(--esm-border)',
        background: 'var(--esm-parchment)',
        color: 'var(--esm-ink)',
        fontFamily: 'Outfit, sans-serif',
      }}
      {...props}
    />
  );
}

function EsmTextarea({ className = '', mono = false, ...props }) {
  return (
    <textarea
      className={`esm-input w-full px-4 py-3 rounded-xl border text-sm resize-none transition-all ${mono ? 'esm-mono' : ''} ${className}`}
      style={{
        borderColor: 'var(--esm-border)',
        background: 'var(--esm-parchment)',
        color: 'var(--esm-ink)',
        fontFamily: mono ? "'DM Mono', monospace" : 'Outfit, sans-serif',
      }}
      {...props}
    />
  );
}

function EsmSelect({ className = '', children, ...props }) {
  return (
    <select
      className={`esm-input w-full px-4 py-2.5 rounded-xl border text-sm capitalize cursor-pointer transition-all ${className}`}
      style={{
        borderColor: 'var(--esm-border)',
        background: 'var(--esm-parchment)',
        color: 'var(--esm-ink)',
        fontFamily: 'Outfit, sans-serif',
      }}
      {...props}
    >
      {children}
    </select>
  );
}

// ─── QuickAdder ───────────────────────────────────────────────────────────────
function QuickAdder({ isOpen, onToggle, onAdd }) {
  return (
    <div className="relative h-5 group/adder z-30 flex items-center justify-center">
      {isOpen && (
        <div
          className="fixed inset-0 z-40 cursor-default"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        />
      )}

      {/* hover line + plus */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover/adder:opacity-100'
        }`}
      >
        <div
          className="w-full h-px"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(31,100,78,0.3) 30%, rgba(31,100,78,0.3) 70%, transparent)',
          }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="esm-adder-btn absolute w-7 h-7 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform z-50"
          style={{ background: 'var(--esm-forest)', color: '#fff' }}
          title="Add content block"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* popup grid */}
      {isOpen && (
        <div
          className="esm-adder-popup absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 p-3 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] min-w-[308px] grid grid-cols-2 gap-1.5"
          style={{
            background: '#fff',
            border: '1px solid var(--esm-border)',
            fontFamily: 'Outfit, sans-serif',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div
            className="col-span-2 flex items-center justify-between pb-2 mb-1"
            style={{ borderBottom: '1px solid var(--esm-border)' }}
          >
            <span
              className="text-[9px] font-bold uppercase tracking-[0.14em]"
              style={{ color: 'var(--esm-muted)' }}
            >
              Insert Block
            </span>
            <button
              onClick={onToggle}
              className="p-1 rounded-lg transition-colors"
              style={{ color: 'var(--esm-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--esm-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              onClick={() => onAdd(bt.type)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors group/btn"
              style={{ color: 'var(--esm-ink)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--esm-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                style={{
                  background: 'var(--esm-parchment)',
                  border: '1px solid var(--esm-border)',
                }}
              >
                <bt.icon className="w-3.5 h-3.5" style={{ color: 'var(--esm-forest)' }} />
              </div>
              <span className="text-xs font-medium">{bt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EditSectionModal({ section, onSave, onClose }) {
  const { course, modules, targetModuleId } = useCoursifyStudio();

  const [title, setTitle] = useState(section?.title || '');
  const [content, setContent] = useState(section?.content || '');
  const [blocks, setBlocks] = useState(section?.blocks || []);
  const [resources, setResources] = useState(section?.resources || []);
  const [summary, setSummary] = useState(section?.summary || '');
  const [learningGoals, setLearningGoals] = useState(section?.learningGoals || []);
  const [estimatedDuration, setEstimatedDuration] = useState(section?.estimatedDuration || '');
  const [status, setStatus] = useState(section?.status || 'draft');
  const [isReferenceEnabled, setIsReferenceEnabled] = useState(true);

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('content');
  const [activeAdderIndex, setActiveAdderIndex] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [toolSteps, setToolSteps] = useState([]);

  useEffect(() => {
    if (section) {
      setTitle(section.title);
      setContent(section.content || '');
      setBlocks(section.blocks || []);
      setResources(section.resources || []);
      setSummary(section.summary || '');
      setLearningGoals(section.learningGoals || []);
      setEstimatedDuration(section.estimatedDuration || '');
      setStatus(section.status || 'draft');
    }
  }, [section]);

  const handleAIGenerate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a section title first');
      return;
    }

    const currentModuleId = section?.moduleId || targetModuleId;
    const currentModule = modules.find((m) => m._id === currentModuleId);

    setIsGenerating(true);
    setStatusMessage('Initializing AI researcher...');
    setToolSteps([]);
    let generatedContent = '';

    try {
      const res = await fetch('/api/coursify/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: course?.title,
          moduleName: currentModule?.title,
          sectionName: title.trim(),
          learningGoals: learningGoals.filter((g) => g.trim()),
          isReferenceEnabled,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          let event;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }

          if (event.type === 'content') {
            generatedContent += event.message;
            setContent(generatedContent);
          } else if (event.type === 'status') {
            setStatusMessage(event.message);
          } else if (event.type === 'tool_call') {
            if (event.status === 'started') {
              setToolSteps((prev) => [
                ...prev,
                { tool: event.tool, status: 'running', input: event.input },
              ]);
            } else if (event.status === 'completed') {
              setToolSteps((prev) => {
                const next = [...prev];
                for (let i = next.length - 1; i >= 0; i--) {
                  if (next[i].tool === event.tool && next[i].status === 'running') {
                    next[i] = { ...next[i], status: 'completed' };
                    break;
                  }
                }
                return next;
              });
            }
          } else if (event.type === 'done') {
            setStatusMessage('Generation complete!');
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        }
      }
      toast.success('Content generated successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'AI generation failed');
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  const handleTabChange = (nextTab) => {
    if (tab === 'content' && nextTab === 'visual') {
      const parsed = parseMarkdownSection(content);
      setBlocks(parsed.blocks);
    } else if (tab === 'visual' && nextTab === 'content') {
      const exported = generateFullMarkdown({
        title,
        summary,
        learningGoals,
        estimatedDuration,
        status,
        blocks,
      });
      setContent(exported);
    }
    setTab(nextTab);
  };

  const addBlock = (type, index = blocks.length) => {
    const newBlock = { type, order: index };
    if (type === 'MdBlock') newBlock.content = '';
    if (type === 'QuizBlock') newBlock.quiz = { questions: [] };
    if (type === 'VideoBlock') newBlock.video = { url: '', title: '', platform: 'youtube' };
    if (type === 'ResourceBlock') newBlock.resource = { url: '', title: '', type: 'other' };
    if (type === 'StepByStepBlock') {
      newBlock.steps = [{ title: '', content: '' }];
      newBlock.showNumbering = true;
      newBlock.title = '';
    }
    if (type === 'AccordionBlock') {
      newBlock.items = [{ title: '', content: '' }];
      newBlock.title = '';
    }
    if (type === 'TabsBlock') {
      newBlock.tabs = [{ title: '', content: '' }];
    }
    if (type === 'CalloutBlock') {
      newBlock.calloutType = 'info';
      newBlock.title = '';
      newBlock.content = '';
    }
    if (type === 'ChartBlock') {
      newBlock.chart = {
        type: 'bar',
        title: '',
        description: '',
        data: {
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [{ label: 'Series 1', data: [10, 20, 15] }],
        },
        options: { showLegend: true, showGrid: true },
      };
    }
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index, 0, newBlock);
      return next.map((b, i) => ({ ...b, order: i }));
    });
    setActiveAdderIndex(null);
    toast.success(`${type.replace('Block', '')} block added`);
  };

  const updateBlock = (i, field, value) =>
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? { ...b, [field]: value } : b)));

  const removeBlock = (i) => setBlocks((prev) => prev.filter((_, idx) => idx !== i));

  const moveBlock = (i, dir) => {
    if (i + dir < 0 || i + dir >= blocks.length) return;
    setBlocks((prev) => {
      const arr = [...prev];
      [arr[i], arr[i + dir]] = [arr[i + dir], arr[i]];
      return arr.map((b, idx) => ({ ...b, order: idx }));
    });
  };

  const addGoal = () => setLearningGoals((prev) => [...prev, '']);
  const updateGoal = (i, val) =>
    setLearningGoals((prev) => prev.map((g, idx) => (idx === i ? val : g)));
  const removeGoal = (i) => setLearningGoals((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!title.trim()) return;
    setLoading(true);
    let finalContent = content;
    let finalBlocks = blocks;
    if (tab === 'visual') {
      finalContent = generateFullMarkdown({
        title,
        summary,
        learningGoals,
        estimatedDuration,
        status,
        blocks,
      });
    } else if (tab === 'content') {
      const parsed = parseMarkdownSection(content);
      finalBlocks = parsed.blocks;
    }
    await onSave({
      _id: section?._id,
      title: title.trim(),
      content: finalContent,
      blocks: finalBlocks.map((b, i) => ({ ...b, order: i })),
      summary: summary.trim(),
      learningGoals: learningGoals.filter((g) => g.trim()),
      estimatedDuration: estimatedDuration.trim(),
      status,
    });
    setLoading(false);
    onClose();
  };

  const TABS = [
    { id: 'content', label: 'Markdown' },
    { id: 'visual', label: 'Visual Editor' },
    { id: 'planning', label: 'Planning' },
  ];

  // ── Inner block field styles ──
  const innerInput = 'esm-input w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all';
  const innerTextarea =
    'esm-input w-full px-3.5 py-2.5 rounded-xl border text-xs resize-y transition-all min-h-[80px]';
  const innerStyle = {
    borderColor: 'var(--esm-border)',
    background: '#fff',
    color: 'var(--esm-ink)',
    fontFamily: 'Outfit, sans-serif',
  };
  const innerFaintStyle = {
    ...innerStyle,
    background: 'var(--esm-parchment)',
  };

  return (
    <>
      <style>{styles}</style>

      {/* Backdrop */}
      <div
        className="esm-backdrop fixed inset-0 z-[100]"
        style={{ background: 'rgba(10,24,20,0.22)', backdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="esm-panel esm-root fixed right-0 top-0 bottom-0 z-[101] w-full max-w-2xl flex flex-col"
        style={{
          background: '#fff',
          boxShadow: '-16px 0 60px -4px rgba(10,24,20,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{
            background: 'var(--esm-parchment)',
            borderBottom: '1px solid var(--esm-border)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Decorative accent */}
            <div
              className="w-1 h-8 rounded-full"
              style={{
                background: 'linear-gradient(180deg, var(--esm-forest), rgba(31,100,78,0.3))',
              }}
            />
            <div>
              <h2
                className="leading-tight"
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '18px',
                  color: 'var(--esm-ink)',
                  fontWeight: 400,
                }}
              >
                {section ? 'Edit Section' : 'New Section'}
              </h2>
              <p
                className="text-[9px] font-semibold uppercase tracking-[0.14em] mt-0.5"
                style={{ color: 'var(--esm-muted)' }}
              >
                Markdown-First Studio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ color: 'var(--esm-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--esm-hover)';
              e.currentTarget.style.color = 'var(--esm-ink)';
              e.currentTarget.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--esm-muted)';
              e.currentTarget.style.transform = 'rotate(0deg)';
            }}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* ── Title Input ──────────────────────────────────────────────── */}
        <div
          className="px-6 pt-5 pb-4 shrink-0"
          style={{
            background: 'var(--esm-parchment)',
            borderBottom: '1px solid var(--esm-border)',
          }}
        >
          <Label>Section Title</Label>
          <div className="relative">
            <EsmInput
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g. Introduction to Routing"
              className="pr-4 font-semibold text-base disabled:opacity-50"
              style={{
                background: '#fff',
                border: '1.5px solid var(--esm-border)',
                fontFamily: "'Outfit', sans-serif",
              }}
            />
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div
          className="flex gap-0 px-6 shrink-0"
          style={{
            background: 'var(--esm-parchment)',
            borderBottom: '1px solid var(--esm-border)',
          }}
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`relative px-4 py-3 text-xs font-semibold transition-colors ${
                  active ? 'esm-tab-active' : ''
                }`}
                style={{
                  color: active ? 'var(--esm-forest)' : 'var(--esm-muted)',
                  letterSpacing: '0.02em',
                  fontFamily: 'Outfit, sans-serif',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--esm-ink)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = 'var(--esm-muted)';
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Scrollable Body ──────────────────────────────────────────── */}
        <div
          className="esm-scroll flex-1 overflow-y-auto min-h-0 p-6 pb-8"
          style={{ background: '#fff' }}
        >
          {/* ─── Content / Markdown Tab ─── */}
          {tab === 'content' && (
            <div className="flex flex-col gap-4 h-full min-h-0">
              {/* Toolbar row */}
              <div className="flex items-center justify-between shrink-0">
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--esm-muted)', fontFamily: 'Outfit, sans-serif' }}
                >
                  {isGenerating
                    ? statusMessage || 'AI is researching…'
                    : 'Supports ## [BlockType] headers for interactive blocks.'}
                </p>
                <div className="flex items-center gap-2.5">
                  {/* Reference Toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer group/ref">
                    <input
                      type="checkbox"
                      checked={isReferenceEnabled}
                      onChange={(e) => setIsReferenceEnabled(e.target.checked)}
                      disabled={isGenerating}
                      className="w-3 h-3 rounded border opacity-70 group-hover/ref:opacity-100 transition-opacity"
                      style={{ accentColor: 'var(--esm-forest)' }}
                    />
                    <span
                      className="text-[10px] font-semibold select-none opacity-70 group-hover/ref:opacity-100 transition-opacity"
                      style={{ color: 'var(--esm-forest)', fontFamily: 'Outfit, sans-serif' }}
                    >
                      References
                    </span>
                  </label>

                  <div className="w-px h-3" style={{ background: 'var(--esm-border)' }} />

                  {/* AI Generate */}
                  <button
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !title.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                    style={{
                      color: 'var(--esm-forest)',
                      border: '1px solid rgba(31,100,78,0.22)',
                      background: isGenerating ? 'var(--esm-hover)' : 'transparent',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                      if (!isGenerating) e.currentTarget.style.background = 'var(--esm-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isGenerating) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {isGenerating ? 'Researching…' : 'AI Research'}
                  </button>

                  <div className="w-px h-3" style={{ background: 'var(--esm-border)' }} />

                  {/* Sync */}
                  <button
                    onClick={() => {
                      const exported = generateFullMarkdown({
                        title,
                        summary,
                        learningGoals,
                        estimatedDuration,
                        status,
                        blocks,
                      });
                      setContent(exported);
                      toast.success('Synced from visual editor');
                    }}
                    disabled={isGenerating}
                    className="text-[11px] font-semibold transition-colors disabled:opacity-50"
                    style={{ color: 'var(--esm-forest)', fontFamily: 'Outfit, sans-serif' }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    Sync from Visual
                  </button>
                </div>
              </div>

              {/* Tool step pills */}
              {isGenerating && toolSteps.length > 0 && (
                <div className="flex flex-wrap gap-2 shrink-0 pb-1">
                  {toolSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="esm-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full border whitespace-nowrap text-[9px] font-semibold shrink-0"
                      style={
                        step.status === 'running'
                          ? {
                              background: 'rgba(59,130,246,0.06)',
                              borderColor: 'rgba(59,130,246,0.2)',
                              color: '#3b82f6',
                            }
                          : {
                              background: 'rgba(31,100,78,0.06)',
                              borderColor: 'rgba(31,100,78,0.18)',
                              color: 'var(--esm-forest)',
                            }
                      }
                    >
                      {step.status === 'running' ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      )}
                      {step.tool.replace('_', ' ')}
                    </div>
                  ))}
                </div>
              )}

              {/* Markdown textarea */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={'---\ntitle: My Section\n---\n\nStart writing Markdown here…'}
                disabled={isGenerating}
                className="esm-input esm-mono flex-1 w-full p-4 rounded-2xl border resize-none disabled:opacity-70"
                style={{
                  borderColor: 'var(--esm-border)',
                  background: 'var(--esm-parchment)',
                  minHeight: '480px',
                  lineHeight: '1.75',
                }}
              />
            </div>
          )}

          {/* ─── Visual Editor Tab ─── */}
          {tab === 'visual' && (
            <div className="space-y-3 pb-16 pt-1">
              <QuickAdder
                isOpen={activeAdderIndex === -1}
                onToggle={() => setActiveAdderIndex(activeAdderIndex === -1 ? null : -1)}
                onAdd={(type) => addBlock(type, 0)}
              />

              {blocks.map((block, i) => (
                <React.Fragment key={i}>
                  <div
                    className="esm-block esm-block-card rounded-2xl overflow-hidden border"
                    style={{ borderColor: 'var(--esm-border)', background: '#fff' }}
                  >
                    {/* Block header bar */}
                    <div
                      className="flex items-center justify-between px-4 py-2.5 group/block"
                      style={{
                        background: 'var(--esm-parchment)',
                        borderBottom: '1px solid var(--esm-border)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Ordinal badge */}
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                          style={{
                            background: 'rgba(31,100,78,0.1)',
                            color: 'var(--esm-forest)',
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {i + 1}
                        </div>
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: 'var(--esm-ink)', fontFamily: 'Outfit, sans-serif' }}
                        >
                          {block.type}
                        </span>
                      </div>

                      {/* Controls – always visible on touch, hover on desktop */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity">
                        {[
                          { icon: ChevronUp, action: () => moveBlock(i, -1), title: 'Move up' },
                          { icon: ChevronDown, action: () => moveBlock(i, 1), title: 'Move down' },
                        ].map(({ icon: Icon, action, title }) => (
                          <button
                            key={title}
                            onClick={action}
                            title={title}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ color: 'var(--esm-muted)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#fff';
                              e.currentTarget.style.color = 'var(--esm-forest)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--esm-muted)';
                            }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </button>
                        ))}

                        <div
                          className="w-px h-3.5 mx-0.5"
                          style={{ background: 'var(--esm-border)' }}
                        />

                        <button
                          onClick={() => removeBlock(i)}
                          title="Remove block"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ color: 'var(--esm-muted)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(201,76,76,0.07)';
                            e.currentTarget.style.color = 'var(--esm-danger)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--esm-muted)';
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Block body */}
                    <div className="p-4 space-y-3">
                      {/* MdBlock */}
                      {block.type === 'MdBlock' && (
                        <textarea
                          value={block.content}
                          onChange={(e) => updateBlock(i, 'content', e.target.value)}
                          placeholder="Markdown content…"
                          className="esm-input esm-mono w-full p-3.5 rounded-xl border resize-y min-h-[140px]"
                          style={{
                            borderColor: 'var(--esm-border)',
                            background: 'var(--esm-parchment)',
                          }}
                        />
                      )}

                      {/* QuizBlock */}
                      {block.type === 'QuizBlock' && (
                        <QuizEditor
                          questions={block.quiz?.questions || []}
                          onChange={(q) => updateBlock(i, 'quiz', { ...block.quiz, questions: q })}
                        />
                      )}

                      {/* VideoBlock */}
                      {block.type === 'VideoBlock' && (
                        <div className="space-y-3">
                          <input
                            value={block.video?.title || ''}
                            onChange={(e) =>
                              updateBlock(i, 'video', { ...block.video, title: e.target.value })
                            }
                            placeholder="Video Title"
                            className={`${innerInput} font-semibold`}
                            style={innerStyle}
                          />
                          <input
                            value={block.video?.url || ''}
                            onChange={(e) =>
                              updateBlock(i, 'video', { ...block.video, url: e.target.value })
                            }
                            placeholder="Video URL"
                            className={innerInput}
                            style={innerFaintStyle}
                          />
                        </div>
                      )}

                      {/* ResourceBlock */}
                      {block.type === 'ResourceBlock' && (
                        <div className="space-y-3">
                          <input
                            value={block.resource?.title || ''}
                            onChange={(e) =>
                              updateBlock(i, 'resource', {
                                ...block.resource,
                                title: e.target.value,
                              })
                            }
                            placeholder="Resource Title"
                            className={`${innerInput} font-semibold`}
                            style={innerStyle}
                          />
                          <input
                            value={block.resource?.url || ''}
                            onChange={(e) =>
                              updateBlock(i, 'resource', { ...block.resource, url: e.target.value })
                            }
                            placeholder="Resource URL"
                            className={innerInput}
                            style={innerFaintStyle}
                          />
                        </div>
                      )}

                      {/* StepByStepBlock */}
                      {block.type === 'StepByStepBlock' && (
                        <div className="space-y-3">
                          <input
                            value={block.title || ''}
                            onChange={(e) => updateBlock(i, 'title', e.target.value)}
                            placeholder="Process Heading"
                            className={`${innerInput} font-semibold`}
                            style={innerStyle}
                          />
                          <div className="space-y-2.5">
                            {(block.steps || []).map((step, si) => (
                              <div
                                key={si}
                                className="rounded-xl p-3.5 space-y-2.5 group/step"
                                style={{
                                  background: 'var(--esm-parchment)',
                                  border: '1px solid var(--esm-border)',
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                                    style={{
                                      background: 'rgba(31,100,78,0.12)',
                                      color: 'var(--esm-forest)',
                                      fontFamily: "'DM Mono', monospace",
                                    }}
                                  >
                                    {si + 1}
                                  </div>
                                  <input
                                    value={step.title}
                                    onChange={(e) => {
                                      const nextSteps = block.steps.map((s, idx) =>
                                        idx === si ? { ...s, title: e.target.value } : s
                                      );
                                      updateBlock(i, 'steps', nextSteps);
                                    }}
                                    placeholder="Step Title"
                                    className={`${innerInput} font-semibold flex-1`}
                                    style={innerStyle}
                                  />
                                </div>
                                <textarea
                                  value={step.content}
                                  onChange={(e) => {
                                    const nextSteps = block.steps.map((s, idx) =>
                                      idx === si ? { ...s, content: e.target.value } : s
                                    );
                                    updateBlock(i, 'steps', nextSteps);
                                  }}
                                  placeholder="Step content…"
                                  className={`${innerTextarea} esm-mono`}
                                  style={innerStyle}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AccordionBlock */}
                      {block.type === 'AccordionBlock' && (
                        <div className="space-y-3">
                          <input
                            value={block.title || ''}
                            onChange={(e) => updateBlock(i, 'title', e.target.value)}
                            placeholder="Accordion Heading"
                            className={`${innerInput} font-semibold`}
                            style={innerStyle}
                          />
                          <div className="space-y-2">
                            {(block.items || []).map((item, ii) => (
                              <div
                                key={ii}
                                className="rounded-xl p-3.5 space-y-2.5 group/item"
                                style={{
                                  background: 'var(--esm-parchment)',
                                  border: '1px solid var(--esm-border)',
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    value={item.title}
                                    onChange={(e) => {
                                      const nextItems = block.items.map((it, idx) =>
                                        idx === ii ? { ...it, title: e.target.value } : it
                                      );
                                      updateBlock(i, 'items', nextItems);
                                    }}
                                    placeholder="Item Title"
                                    className={`${innerInput} font-semibold flex-1`}
                                    style={innerStyle}
                                  />
                                  <button
                                    onClick={() => {
                                      updateBlock(
                                        i,
                                        'items',
                                        block.items.filter((_, idx) => idx !== ii)
                                      );
                                    }}
                                    className="p-1.5 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all"
                                    style={{ color: 'var(--esm-muted)' }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.color = 'var(--esm-danger)')
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.color = 'var(--esm-muted)')
                                    }
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <textarea
                                  value={item.content}
                                  onChange={(e) => {
                                    const nextItems = block.items.map((it, idx) =>
                                      idx === ii ? { ...it, content: e.target.value } : it
                                    );
                                    updateBlock(i, 'items', nextItems);
                                  }}
                                  placeholder="Item content (Markdown supported)"
                                  className={`${innerTextarea} esm-mono`}
                                  style={innerStyle}
                                />
                              </div>
                            ))}
                            <button
                              onClick={() =>
                                updateBlock(i, 'items', [
                                  ...(block.items || []),
                                  { title: '', content: '' },
                                ])
                              }
                              className="esm-add-row w-full py-2.5 rounded-xl border border-dashed text-[11px] font-semibold flex items-center justify-center gap-1.5"
                              style={{
                                borderColor: 'var(--esm-border)',
                                color: 'var(--esm-muted)',
                                fontFamily: 'Outfit, sans-serif',
                              }}
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Item
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TabsBlock */}
                      {block.type === 'TabsBlock' && (
                        <div className="space-y-2">
                          {(block.tabs || []).map((t, ti) => (
                            <div
                              key={ti}
                              className="rounded-xl p-3.5 space-y-2.5 group/tab"
                              style={{
                                background: 'var(--esm-parchment)',
                                border: '1px solid var(--esm-border)',
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  value={t.title}
                                  onChange={(e) => {
                                    const nextTabs = block.tabs.map((tb, idx) =>
                                      idx === ti ? { ...tb, title: e.target.value } : tb
                                    );
                                    updateBlock(i, 'tabs', nextTabs);
                                  }}
                                  placeholder="Tab Title"
                                  className={`${innerInput} font-semibold flex-1`}
                                  style={innerStyle}
                                />
                                <button
                                  onClick={() =>
                                    updateBlock(
                                      i,
                                      'tabs',
                                      block.tabs.filter((_, idx) => idx !== ti)
                                    )
                                  }
                                  className="p-1.5 rounded-lg opacity-0 group-hover/tab:opacity-100 transition-all"
                                  style={{ color: 'var(--esm-muted)' }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.color = 'var(--esm-danger)')
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.color = 'var(--esm-muted)')
                                  }
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <textarea
                                value={t.content}
                                onChange={(e) => {
                                  const nextTabs = block.tabs.map((tb, idx) =>
                                    idx === ti ? { ...tb, content: e.target.value } : tb
                                  );
                                  updateBlock(i, 'tabs', nextTabs);
                                }}
                                placeholder="Tab content (Markdown supported)"
                                className={`${innerTextarea} esm-mono`}
                                style={innerStyle}
                              />
                            </div>
                          ))}
                          <button
                            onClick={() =>
                              updateBlock(i, 'tabs', [
                                ...(block.tabs || []),
                                { title: '', content: '' },
                              ])
                            }
                            className="esm-add-row w-full py-2.5 rounded-xl border border-dashed text-[11px] font-semibold flex items-center justify-center gap-1.5"
                            style={{
                              borderColor: 'var(--esm-border)',
                              color: 'var(--esm-muted)',
                              fontFamily: 'Outfit, sans-serif',
                            }}
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Tab
                          </button>
                        </div>
                      )}

                      {/* CalloutBlock */}
                      {block.type === 'CalloutBlock' && (
                        <div className="space-y-3">
                          <select
                            value={block.calloutType || 'info'}
                            onChange={(e) => updateBlock(i, 'calloutType', e.target.value)}
                            className={`${innerInput} capitalize font-semibold`}
                            style={innerStyle}
                          >
                            {['info', 'warning', 'tip', 'danger'].map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <input
                            value={block.title || ''}
                            onChange={(e) => updateBlock(i, 'title', e.target.value)}
                            placeholder="Callout Title (optional)"
                            className={`${innerInput} font-semibold`}
                            style={innerStyle}
                          />
                          <textarea
                            value={block.content || ''}
                            onChange={(e) => updateBlock(i, 'content', e.target.value)}
                            placeholder="Callout content (Markdown supported)"
                            className={`${innerTextarea} esm-mono`}
                            style={innerFaintStyle}
                          />
                        </div>
                      )}

                      {/* ChartBlock */}
                      {block.type === 'ChartBlock' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Chart Type</Label>
                              <select
                                value={block.chart?.type || 'bar'}
                                onChange={(e) =>
                                  updateBlock(i, 'chart', { ...block.chart, type: e.target.value })
                                }
                                className={`${innerInput} capitalize font-semibold`}
                                style={innerStyle}
                              >
                                {[
                                  'bar',
                                  'line',
                                  'pie',
                                  'doughnut',
                                  'polarArea',
                                  'radar',
                                  'scatter',
                                  'bubble',
                                ].map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label>Title</Label>
                              <input
                                value={block.chart?.title || ''}
                                onChange={(e) =>
                                  updateBlock(i, 'chart', { ...block.chart, title: e.target.value })
                                }
                                placeholder="Chart title"
                                className={`${innerInput} font-semibold`}
                                style={innerStyle}
                              />
                            </div>
                          </div>

                          <input
                            value={block.chart?.description || ''}
                            onChange={(e) =>
                              updateBlock(i, 'chart', {
                                ...block.chart,
                                description: e.target.value,
                              })
                            }
                            placeholder="Description"
                            className={innerInput}
                            style={innerFaintStyle}
                          />

                          <div
                            className="rounded-xl p-4 space-y-3"
                            style={{
                              background: 'var(--esm-parchment)',
                              border: '1px solid var(--esm-border)',
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <Label className="mb-0">Labels</Label>
                              <span className="text-[9px]" style={{ color: 'var(--esm-muted)' }}>
                                comma separated
                              </span>
                            </div>
                            <input
                              value={(block.chart?.data?.labels || []).join(', ')}
                              onChange={(e) => {
                                const labels = e.target.value.split(',').map((l) => l.trim());
                                updateBlock(i, 'chart', {
                                  ...block.chart,
                                  data: { ...block.chart.data, labels },
                                });
                              }}
                              placeholder="Jan, Feb, Mar"
                              className={innerInput}
                              style={innerStyle}
                            />

                            <div className="space-y-2">
                              {(block.chart?.data?.datasets || []).map((ds, dsi) => (
                                <div
                                  key={dsi}
                                  className="p-3 rounded-xl space-y-2"
                                  style={{
                                    background: '#fff',
                                    border: '1px solid var(--esm-border)',
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      value={ds.label}
                                      onChange={(e) => {
                                        const datasets = block.chart.data.datasets.map((d, idx) =>
                                          idx === dsi ? { ...d, label: e.target.value } : d
                                        );
                                        updateBlock(i, 'chart', {
                                          ...block.chart,
                                          data: { ...block.chart.data, datasets },
                                        });
                                      }}
                                      placeholder="Dataset label"
                                      className="esm-input flex-1 px-3 py-1.5 rounded-lg border text-xs font-semibold"
                                      style={{
                                        borderColor: 'var(--esm-border)',
                                        background: 'var(--esm-parchment)',
                                        color: 'var(--esm-ink)',
                                      }}
                                    />
                                    <input
                                      type="color"
                                      value={ds.color || '#1f644e'}
                                      onChange={(e) => {
                                        const datasets = block.chart.data.datasets.map((d, idx) =>
                                          idx === dsi ? { ...d, color: e.target.value } : d
                                        );
                                        updateBlock(i, 'chart', {
                                          ...block.chart,
                                          data: { ...block.chart.data, datasets },
                                        });
                                      }}
                                      className="w-8 h-8 rounded-lg overflow-hidden border-none cursor-pointer"
                                    />
                                    <button
                                      onClick={() => {
                                        const datasets = block.chart.data.datasets.filter(
                                          (_, idx) => idx !== dsi
                                        );
                                        updateBlock(i, 'chart', {
                                          ...block.chart,
                                          data: { ...block.chart.data, datasets },
                                        });
                                      }}
                                      className="p-1.5 rounded-lg transition-colors"
                                      style={{ color: 'var(--esm-muted)' }}
                                      onMouseEnter={(e) =>
                                        (e.currentTarget.style.color = 'var(--esm-danger)')
                                      }
                                      onMouseLeave={(e) =>
                                        (e.currentTarget.style.color = 'var(--esm-muted)')
                                      }
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <input
                                    value={(ds.data || []).join(', ')}
                                    onChange={(e) => {
                                      const data = e.target.value
                                        .split(',')
                                        .map((v) => parseFloat(v.trim()))
                                        .filter((v) => !isNaN(v));
                                      const datasets = block.chart.data.datasets.map((d, idx) =>
                                        idx === dsi ? { ...d, data } : d
                                      );
                                      updateBlock(i, 'chart', {
                                        ...block.chart,
                                        data: { ...block.chart.data, datasets },
                                      });
                                    }}
                                    placeholder="Data points: 10, 20, 30"
                                    className="esm-input w-full px-3 py-1.5 rounded-lg border text-xs"
                                    style={{
                                      borderColor: 'var(--esm-border)',
                                      background: 'var(--esm-parchment)',
                                      color: 'var(--esm-ink)',
                                    }}
                                  />
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const datasets = [
                                    ...(block.chart.data.datasets || []),
                                    { label: '', data: [], color: '' },
                                  ];
                                  updateBlock(i, 'chart', {
                                    ...block.chart,
                                    data: { ...block.chart.data, datasets },
                                  });
                                }}
                                className="esm-add-row w-full py-2 rounded-lg border border-dashed text-[10px] font-semibold"
                                style={{
                                  borderColor: 'var(--esm-border)',
                                  color: 'var(--esm-muted)',
                                  fontFamily: 'Outfit, sans-serif',
                                }}
                              >
                                + Add Dataset
                              </button>
                            </div>
                          </div>

                          {/* Chart options */}
                          <div className="flex items-center gap-5 px-0.5">
                            {[
                              { key: 'showLegend', label: 'Legend' },
                              { key: 'showGrid', label: 'Grid' },
                              { key: 'stacked', label: 'Stacked' },
                            ].map(({ key, label }) => (
                              <label
                                key={key}
                                className="flex items-center gap-2 cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    key === 'stacked'
                                      ? block.chart?.options?.stacked === true
                                      : block.chart?.options?.[key] !== false
                                  }
                                  onChange={(e) =>
                                    updateBlock(i, 'chart', {
                                      ...block.chart,
                                      options: { ...block.chart.options, [key]: e.target.checked },
                                    })
                                  }
                                  className="w-3.5 h-3.5 rounded border"
                                  style={{ accentColor: 'var(--esm-forest)' }}
                                />
                                <span
                                  className="text-xs font-medium"
                                  style={{
                                    color: 'var(--esm-ink)',
                                    fontFamily: 'Outfit, sans-serif',
                                  }}
                                >
                                  {label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <QuickAdder
                    isOpen={activeAdderIndex === i}
                    onToggle={() => setActiveAdderIndex(activeAdderIndex === i ? null : i)}
                    onAdd={(type) => addBlock(type, i + 1)}
                  />
                </React.Fragment>
              ))}
            </div>
          )}

          {/* ─── Planning Tab ─── */}
          {tab === 'planning' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="relative">
                    <EsmSelect
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="font-semibold"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o.replace('_', ' ')}
                        </option>
                      ))}
                    </EsmSelect>
                  </div>
                </div>
                <div>
                  <Label>Duration</Label>
                  <EsmInput
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="e.g. 15 mins"
                    className="font-medium"
                  />
                </div>
              </div>

              <div>
                <Label>Summary</Label>
                <EsmTextarea
                  rows={4}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief overview of this section…"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="mb-0">Learning Goals</Label>
                  <button
                    onClick={addGoal}
                    className="flex items-center gap-1 text-[11px] font-semibold transition-all"
                    style={{ color: 'var(--esm-forest)', fontFamily: 'Outfit, sans-serif' }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    <Plus className="w-3 h-3" /> Add Goal
                  </button>
                </div>
                <div className="space-y-2">
                  {learningGoals.map((goal, i) => (
                    <div key={i} className="flex gap-2 group/goal items-center">
                      {/* bullet */}
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5"
                        style={{ background: 'var(--esm-forest)', opacity: 0.5 }}
                      />
                      <EsmInput
                        value={goal}
                        onChange={(e) => updateGoal(i, e.target.value)}
                        placeholder="Learners will be able to…"
                        className="flex-1 font-medium"
                      />
                      <button
                        onClick={() => removeGoal(i)}
                        className="p-2 rounded-lg opacity-0 group-hover/goal:opacity-100 transition-all"
                        style={{ color: 'var(--esm-muted)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--esm-danger)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--esm-muted)')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {learningGoals.length === 0 && (
                    <div
                      className="py-8 rounded-2xl border border-dashed text-center text-xs font-medium"
                      style={{
                        borderColor: 'var(--esm-border)',
                        color: 'var(--esm-muted)',
                        fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      No goals yet — click Add Goal above
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div
          className="flex gap-3 px-6 py-4 shrink-0"
          style={{
            background: 'var(--esm-parchment)',
            borderTop: '1px solid var(--esm-border)',
          }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all"
            style={{
              borderColor: 'var(--esm-border)',
              color: 'var(--esm-muted)',
              background: 'transparent',
              fontFamily: 'Outfit, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = 'var(--esm-ink)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--esm-muted)';
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!title.trim() || loading || isGenerating}
            className="esm-save-btn flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--esm-forest)',
              color: '#fff',
              fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 4px 20px rgba(31,100,78,0.22)',
            }}
          >
            {loading ? 'Saving…' : isGenerating ? 'AI Researching…' : 'Save Section'}
          </button>
        </div>
      </div>
    </>
  );
}
