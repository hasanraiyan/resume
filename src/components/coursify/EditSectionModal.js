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
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import QuizEditor from './QuizEditor';
import { parseMarkdownSection, generateFullMarkdown } from '@/utils/coursify-parser';

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
  { type: 'TimelineBlock', label: 'Timeline', icon: Clock },
];

function QuickAdder({ isOpen, onToggle, onAdd }) {
  return (
    <div className="relative h-4 group/adder z-30 flex items-center justify-center">
      {isOpen && (
        <div
          className="fixed inset-0 z-40 cursor-default"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        />
      )}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-0 group-hover/adder:opacity-100'}`}
      >
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#1f644e]/40 to-transparent" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="absolute w-8 h-8 rounded-full bg-[#1f644e] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-50"
          title="Add content here"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-white border border-[#e5e3d8] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] z-50 grid grid-cols-2 gap-2 min-w-[320px] animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="col-span-2 flex items-center justify-between px-2 pb-2 border-b border-[#e5e3d8]/50 mb-1">
            <span className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest">
              Select Block Type
            </span>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-[#f0f5f2] rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#7c8e88]" />
            </button>
          </div>
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              onClick={() => onAdd(bt.type)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f0f5f2] text-[#1e3a34] transition-colors text-left group/btn"
            >
              <div className="w-8 h-8 rounded-lg bg-[#fcfbf5] border border-[#e5e3d8] flex items-center justify-center group-hover/btn:bg-white group-hover/btn:border-[#1f644e]/30 transition-colors">
                <bt.icon className="w-4 h-4 text-[#1f644e]" />
              </div>
              <span className="text-xs font-bold">{bt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditSectionModal({ section, onSave, onClose }) {
  const [title, setTitle] = useState(section?.title || '');
  const [content, setContent] = useState(section?.content || '');
  const [blocks, setBlocks] = useState(section?.blocks || []);
  const [resources, setResources] = useState(section?.resources || []);
  const [summary, setSummary] = useState(section?.summary || '');
  const [learningGoals, setLearningGoals] = useState(section?.learningGoals || []);
  const [estimatedDuration, setEstimatedDuration] = useState(section?.estimatedDuration || '');
  const [status, setStatus] = useState(section?.status || 'draft');

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('content');
  const [activeAdderIndex, setActiveAdderIndex] = useState(null);

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
    if (type === 'TimelineBlock') {
      newBlock.events = [{ event: '', title: '', content: '' }];
      newBlock.title = '';
    }
    if (type === 'CalloutBlock') {
      newBlock.calloutType = 'info';
      newBlock.title = '';
      newBlock.content = '';
    }

    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index, 0, newBlock);
      return next.map((b, i) => ({ ...b, order: i }));
    });
    setActiveAdderIndex(null);
    toast.success(`${type.replace('Block', '')} added`);
  };

  const updateBlock = (i, field, value) => {
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? { ...b, [field]: value } : b)));
  };

  const removeBlock = (i) => {
    setBlocks((prev) => prev.filter((_, idx) => idx !== i));
  };

  const moveBlock = (i, dir) => {
    if (i + dir < 0 || i + dir >= blocks.length) return;
    setBlocks((prev) => {
      const arr = [...prev];
      const temp = arr[i];
      arr[i] = arr[i + dir];
      arr[i + dir] = temp;
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

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-2xl bg-white shadow-[-12px_0_40px_-4px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#e5e3d8] shrink-0 bg-[#fcfbf5]">
          <div className="flex flex-col">
            <h2 className="font-bold text-[#1e3a34] text-lg leading-tight">
              {section ? 'Edit Section' : 'New Section'}
            </h2>
            <p className="text-[10px] text-[#7c8e88] font-bold uppercase tracking-widest mt-0.5">
              Markdown-First Studio
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f0f5f2] rounded-xl transition-all hover:rotate-90 duration-200"
          >
            <X className="w-5 h-5 text-[#7c8e88]" />
          </button>
        </div>

        <div className="px-5 pt-6 pb-2 shrink-0">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] px-1 block mb-1.5">
            Section Title
          </label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to Routing"
            className="w-full px-4 py-3 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-base font-bold text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-4 focus:ring-[#1f644e]/5 transition-all"
          />
        </div>

        <div className="flex gap-1 px-5 pt-4 shrink-0 border-b border-[#e5e3d8]/50">
          {[
            { id: 'content', label: 'Markdown' },
            { id: 'visual', label: 'Visual Editor' },
            { id: 'planning', label: 'Planning' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all relative ${
                tab === t.id
                  ? 'text-[#1f644e] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#1f644e]'
                  : 'text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#f0f5f2]/50'
              }`}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 pb-8 min-h-0 bg-white">
          {tab === 'content' && (
            <div className="flex min-h-0 flex-col gap-4 h-full">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] text-[#7c8e88]">
                  Edit raw Markdown. Supports ## [BlockType] for interactive components.
                </p>
                <div className="flex gap-2">
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
                    className="text-[10px] font-bold text-[#1f644e] hover:underline"
                  >
                    Sync from Visual
                  </button>
                </div>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="--- \ntitle: My Section...\n---"
                className="flex-1 min-h-[500px] w-full p-4 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-mono outline-none focus:border-[#1f644e] resize-none leading-relaxed"
              />
            </div>
          )}

          {tab === 'visual' && (
            <div className="space-y-4 pb-20 pt-2">
              <QuickAdder
                isOpen={activeAdderIndex === -1}
                onToggle={() => setActiveAdderIndex(activeAdderIndex === -1 ? null : -1)}
                onAdd={(type) => addBlock(type, 0)}
              />

              {blocks.map((block, i) => (
                <React.Fragment key={i}>
                  <div className="border border-[#e5e3d8] rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group/block">
                    <div className="flex items-center justify-between bg-[#fcfbf5] px-4 py-2.5 border-b border-[#e5e3d8]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-white border border-[#e5e3d8] flex items-center justify-center text-[10px] font-bold text-[#1f644e]">
                          {i + 1}
                        </div>
                        <span className="text-xs font-bold text-[#1e3a34]">{block.type}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveBlock(i, -1)}
                          className="p-1.5 hover:bg-white rounded-lg text-[#7c8e88] hover:text-[#1f644e]"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveBlock(i, 1)}
                          className="p-1.5 hover:bg-white rounded-lg text-[#7c8e88] hover:text-[#1f644e]"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-[#e5e3d8] mx-1" />
                        <button
                          onClick={() => removeBlock(i)}
                          className="p-1.5 hover:bg-red-50 text-[#7c8e88] hover:text-[#c94c4c] rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      {block.type === 'MdBlock' && (
                        <textarea
                          value={block.content}
                          onChange={(e) => updateBlock(i, 'content', e.target.value)}
                          placeholder="Markdown content..."
                          className="w-full h-40 px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm font-mono outline-none focus:border-[#1f644e] resize-y"
                        />
                      )}
                      {block.type === 'QuizBlock' && (
                        <QuizEditor
                          questions={block.quiz?.questions || []}
                          onChange={(q) => updateBlock(i, 'quiz', { ...block.quiz, questions: q })}
                        />
                      )}
                      {block.type === 'VideoBlock' && (
                        <div className="space-y-3">
                          <input
                            value={block.video?.title || ''}
                            onChange={(e) =>
                              updateBlock(i, 'video', { ...block.video, title: e.target.value })
                            }
                            placeholder="Video Title"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-white text-sm font-bold outline-none focus:border-[#1f644e]"
                          />
                          <input
                            value={block.video?.url || ''}
                            onChange={(e) =>
                              updateBlock(i, 'video', { ...block.video, url: e.target.value })
                            }
                            placeholder="Video URL"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm outline-none focus:border-[#1f644e]"
                          />
                        </div>
                      )}
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
                            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-white text-sm font-bold outline-none focus:border-[#1f644e]"
                          />
                          <input
                            value={block.resource?.url || ''}
                            onChange={(e) =>
                              updateBlock(i, 'resource', { ...block.resource, url: e.target.value })
                            }
                            placeholder="Resource URL"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm outline-none focus:border-[#1f644e]"
                          />
                        </div>
                      )}
                      {block.type === 'StepByStepBlock' && (
                        <div className="space-y-4">
                          <input
                            value={block.title || ''}
                            onChange={(e) => updateBlock(i, 'title', e.target.value)}
                            placeholder="Process Heading"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-white text-sm font-bold outline-none focus:border-[#1f644e]"
                          />
                          {(block.steps || []).map((step, si) => (
                            <div
                              key={si}
                              className="bg-[#fcfbf5] border border-[#e5e3d8] rounded-2xl p-4 space-y-3 relative group/step shadow-sm"
                            >
                              <input
                                value={step.title}
                                onChange={(e) => {
                                  const nextSteps = block.steps.map((s, idx) =>
                                    idx === si ? { ...s, title: e.target.value } : s
                                  );
                                  updateBlock(i, 'steps', nextSteps);
                                }}
                                placeholder="Step Title"
                                className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] text-sm font-bold bg-white focus:border-[#1f644e] outline-none"
                              />
                              <textarea
                                value={step.content}
                                onChange={(e) => {
                                  const nextSteps = block.steps.map((s, idx) =>
                                    idx === si ? { ...s, content: e.target.value } : s
                                  );
                                  updateBlock(i, 'steps', nextSteps);
                                }}
                                placeholder="Step Content"
                                className="w-full h-24 px-3 py-2 rounded-xl border border-[#e5e3d8] text-xs bg-white resize-none focus:border-[#1f644e] outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {block.type === 'AccordionBlock' && (
                        <div className="space-y-4">
                          <input
                            value={block.title || ''}
                            onChange={(e) => updateBlock(i, 'title', e.target.value)}
                            placeholder="Accordion Heading"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-white text-sm font-bold outline-none focus:border-[#1f644e]"
                          />
                          <div className="space-y-3">
                            {(block.items || []).map((item, ii) => (
                              <div
                                key={ii}
                                className="bg-[#fcfbf5] border border-[#e5e3d8] rounded-2xl p-4 space-y-3 relative group/item shadow-sm"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    value={item.title}
                                    onChange={(e) => {
                                      const nextItems = block.items.map((it, idx) =>
                                        idx === ii ? { ...it, title: e.target.value } : it
                                      );
                                      updateBlock(i, 'items', nextItems);
                                    }}
                                    placeholder="Item Title"
                                    className="flex-1 px-3 py-2 rounded-xl border border-[#e5e3d8] text-sm font-bold bg-white focus:border-[#1f644e] outline-none"
                                  />
                                  <button
                                    onClick={() => {
                                      const nextItems = block.items.filter((_, idx) => idx !== ii);
                                      updateBlock(i, 'items', nextItems);
                                    }}
                                    className="p-2 text-[#7c8e88] hover:text-[#c94c4c] opacity-0 group-hover/item:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-4 h-4" />
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
                                  placeholder="Item Content (Markdown support)"
                                  className="w-full h-24 px-3 py-2 rounded-xl border border-[#e5e3d8] text-xs bg-white resize-none focus:border-[#1f644e] outline-none"
                                />
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const nextItems = [
                                  ...(block.items || []),
                                  { title: '', content: '' },
                                ];
                                updateBlock(i, 'items', nextItems);
                              }}
                              className="w-full py-2.5 rounded-xl border border-dashed border-[#e5e3d8] text-xs font-bold text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] hover:bg-[#f0f5f2] transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Accordion Item
                            </button>
                          </div>
                        </div>
                      )}
                      {block.type === 'TabsBlock' && (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            {(block.tabs || []).map((tab, ti) => (
                              <div
                                key={ti}
                                className="bg-[#fcfbf5] border border-[#e5e3d8] rounded-2xl p-4 space-y-3 relative group/tab shadow-sm"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    value={tab.title}
                                    onChange={(e) => {
                                      const nextTabs = block.tabs.map((t, idx) =>
                                        idx === ti ? { ...t, title: e.target.value } : t
                                      );
                                      updateBlock(i, 'tabs', nextTabs);
                                    }}
                                    placeholder="Tab Title"
                                    className="flex-1 px-3 py-2 rounded-xl border border-[#e5e3d8] text-sm font-bold bg-white focus:border-[#1f644e] outline-none"
                                  />
                                  <button
                                    onClick={() => {
                                      const nextTabs = block.tabs.filter((_, idx) => idx !== ti);
                                      updateBlock(i, 'tabs', nextTabs);
                                    }}
                                    className="p-2 text-[#7c8e88] hover:text-[#c94c4c] opacity-0 group-hover/tab:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <textarea
                                  value={tab.content}
                                  onChange={(e) => {
                                    const nextTabs = block.tabs.map((t, idx) =>
                                      idx === ti ? { ...t, content: e.target.value } : t
                                    );
                                    updateBlock(i, 'tabs', nextTabs);
                                  }}
                                  placeholder="Tab Content (Markdown support)"
                                  className="w-full h-24 px-3 py-2 rounded-xl border border-[#e5e3d8] text-xs bg-white resize-none focus:border-[#1f644e] outline-none"
                                />
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const nextTabs = [
                                  ...(block.tabs || []),
                                  { title: '', content: '' },
                                ];
                                updateBlock(i, 'tabs', nextTabs);
                              }}
                              className="w-full py-2.5 rounded-xl border border-dashed border-[#e5e3d8] text-xs font-bold text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] hover:bg-[#f0f5f2] transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Tab
                            </button>
                          </div>
                        </div>
                      )}
                      {block.type === 'TimelineBlock' && (
                        <div className="space-y-4">
                          <input
                            value={block.title || ''}
                            onChange={(e) => updateBlock(i, 'title', e.target.value)}
                            placeholder="Timeline Heading"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-white text-sm font-bold outline-none focus:border-[#1f644e]"
                          />
                          <div className="space-y-3">
                            {(block.events || []).map((event, ei) => (
                              <div
                                key={ei}
                                className="bg-[#fcfbf5] border border-[#e5e3d8] rounded-2xl p-4 space-y-3 relative group/event shadow-sm"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    value={event.event}
                                    onChange={(e) => {
                                      const nextEvents = block.events.map((ev, idx) =>
                                        idx === ei ? { ...ev, event: e.target.value } : ev
                                      );
                                      updateBlock(i, 'events', nextEvents);
                                    }}
                                    placeholder="Event (e.g. 2023-Q1)"
                                    className="flex-1 px-3 py-2 rounded-xl border border-[#e5e3d8] text-sm font-bold bg-white focus:border-[#1f644e] outline-none"
                                  />
                                  <div className="flex items-center gap-1 opacity-0 group-hover/event:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
                                        if (ei === 0) return;
                                        const nextEvents = [...block.events];
                                        [nextEvents[ei], nextEvents[ei - 1]] = [
                                          nextEvents[ei - 1],
                                          nextEvents[ei],
                                        ];
                                        updateBlock(i, 'events', nextEvents);
                                      }}
                                      className="p-1.5 hover:bg-white rounded-lg text-[#7c8e88] hover:text-[#1f644e]"
                                    >
                                      <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (ei === block.events.length - 1) return;
                                        const nextEvents = [...block.events];
                                        [nextEvents[ei], nextEvents[ei + 1]] = [
                                          nextEvents[ei + 1],
                                          nextEvents[ei],
                                        ];
                                        updateBlock(i, 'events', nextEvents);
                                      }}
                                      className="p-1.5 hover:bg-white rounded-lg text-[#7c8e88] hover:text-[#1f644e]"
                                    >
                                      <ChevronDown className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const nextEvents = block.events.filter(
                                        (_, idx) => idx !== ei
                                      );
                                      updateBlock(i, 'events', nextEvents);
                                    }}
                                    className="p-2 text-[#7c8e88] hover:text-[#c94c4c] opacity-0 group-hover/event:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <input
                                  value={event.title}
                                  onChange={(e) => {
                                    const nextEvents = block.events.map((ev, idx) =>
                                      idx === ei ? { ...ev, title: e.target.value } : ev
                                    );
                                    updateBlock(i, 'events', nextEvents);
                                  }}
                                  placeholder="Event Title (Optional)"
                                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] text-sm font-bold bg-white focus:border-[#1f644e] outline-none"
                                />
                                <textarea
                                  value={event.content}
                                  onChange={(e) => {
                                    const nextEvents = block.events.map((ev, idx) =>
                                      idx === ei ? { ...ev, content: e.target.value } : ev
                                    );
                                    updateBlock(i, 'events', nextEvents);
                                  }}
                                  placeholder="Event Content (Markdown support)"
                                  className="w-full h-24 px-3 py-2 rounded-xl border border-[#e5e3d8] text-xs bg-white resize-none focus:border-[#1f644e] outline-none"
                                />
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const nextEvents = [
                                  ...(block.events || []),
                                  { event: '', title: '', content: '' },
                                ];
                                updateBlock(i, 'events', nextEvents);
                              }}
                              className="w-full py-2.5 rounded-xl border border-dashed border-[#e5e3d8] text-xs font-bold text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] hover:bg-[#f0f5f2] transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Timeline Event
                            </button>
                          </div>
                        </div>
                      )}
                      {block.type === 'CalloutBlock' && (
                        <div className="space-y-4">
                          <select
                            value={block.calloutType || 'info'}
                            onChange={(e) => updateBlock(i, 'calloutType', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-white text-sm font-bold capitalize outline-none focus:border-[#1f644e]"
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
                            placeholder="Callout Title (Optional)"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-white text-sm font-bold outline-none focus:border-[#1f644e]"
                          />
                          <textarea
                            value={block.content || ''}
                            onChange={(e) => updateBlock(i, 'content', e.target.value)}
                            placeholder="Callout Content (Markdown Support)"
                            className="w-full h-24 px-3 py-2 rounded-xl border border-[#e5e3d8] text-xs bg-[#fcfbf5] resize-y focus:border-[#1f644e] outline-none"
                          />
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

          {tab === 'planning' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] px-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-bold capitalize outline-none focus:border-[#1f644e]"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] px-1">
                    Duration
                  </label>
                  <input
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="e.g. 15 mins"
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-bold outline-none focus:border-[#1f644e]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] px-1">
                  Summary
                </label>
                <textarea
                  rows={4}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Overview..."
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm outline-none focus:border-[#1f644e] resize-none"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                    Learning Goals
                  </label>
                  <button
                    onClick={addGoal}
                    className="text-[10px] font-bold text-[#1f644e] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Goal
                  </button>
                </div>
                <div className="space-y-2.5">
                  {learningGoals.map((goal, i) => (
                    <div key={i} className="flex gap-2 group/goal">
                      <input
                        value={goal}
                        onChange={(e) => updateGoal(i, e.target.value)}
                        placeholder="Learners will..."
                        className="flex-1 px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-semibold outline-none focus:border-[#1f644e]"
                      />
                      <button
                        onClick={() => removeGoal(i)}
                        className="p-2.5 text-[#7c8e88] hover:text-[#c94c4c] opacity-0 group-hover/goal:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-[#e5e3d8] shrink-0 bg-[#fcfbf5]">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#e5e3d8] text-sm font-bold text-[#7c8e88] hover:bg-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || loading}
            className="flex-1 py-3 rounded-xl bg-[#1f644e] text-white text-sm font-bold shadow-lg shadow-[#1f644e]/10 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? 'Saving Changes...' : 'Save Section'}
          </button>
        </div>
      </div>
    </>
  );
}
