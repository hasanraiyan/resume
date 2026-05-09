'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import QuizEditor from './QuizEditor';

const RESOURCE_TYPES = ['video', 'article', 'doc', 'other'];
const STATUS_OPTIONS = ['planned', 'draft', 'needs_review', 'complete'];

export default function EditSectionModal({ section, onSave, onClose }) {
  const [title, setTitle] = useState(section?.title || '');
  const [blocks, setBlocks] = useState(section?.blocks || []);
  const [resources, setResources] = useState(section?.resources || []);
  const [summary, setSummary] = useState(section?.summary || '');
  const [learningGoals, setLearningGoals] = useState(section?.learningGoals || []);
  const [estimatedDuration, setEstimatedDuration] = useState(section?.estimatedDuration || '');
  const [status, setStatus] = useState(section?.status || 'draft');

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('blocks');

  useEffect(() => {
    if (section) {
      setTitle(section.title);
      setBlocks(section.blocks || []);
      setResources(section.resources || []);
      setSummary(section.summary || '');
      setLearningGoals(section.learningGoals || []);
      setEstimatedDuration(section.estimatedDuration || '');
      setStatus(section.status || 'draft');
    }
  }, [section]);

  const addBlock = (type) => {
    const newBlock = { type, order: blocks.length };
    if (type === 'MdBlock') newBlock.content = '';
    if (type === 'QuizBlock') newBlock.quiz = { questions: [] };
    if (type === 'VideoBlock') newBlock.video = { url: '', title: '', platform: 'youtube' };
    if (type === 'ResourceBlock') newBlock.resource = { url: '', title: '', type: 'other' };
    setBlocks((prev) => [...prev, newBlock]);
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
    await onSave({
      title: title.trim(),
      blocks: blocks.map((b, i) => ({ ...b, order: i })),
      resources: resources.filter((r) => r.url.trim()),
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
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#e5e3d8] shrink-0">
            <h2 className="font-bold text-[#1e3a34]">{section ? 'Edit Section' : 'New Section'}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-[#f0f5f2] rounded-lg">
              <X className="w-4 h-4 text-[#7c8e88]" />
            </button>
          </div>

          {/* Title */}
          <div className="px-5 pt-4 space-y-3 shrink-0">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Section title"
              className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm font-bold text-[#1e3a34] outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-5 pt-3 shrink-0">
            {['blocks', 'planning'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize ${
                  tab === t ? 'bg-[#1f644e] text-white' : 'text-[#7c8e88] hover:bg-[#f0f5f2]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 min-h-0">
            {tab === 'blocks' && (
              <div className="space-y-6">
                {blocks.map((block, i) => (
                  <div
                    key={i}
                    className="border border-[#e5e3d8] rounded-xl overflow-hidden bg-white"
                  >
                    <div className="flex items-center justify-between bg-[#f0f5f2] px-3 py-2 border-b border-[#e5e3d8]">
                      <span className="text-xs font-bold text-[#1e3a34]">{block.type}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveBlock(i, -1)}
                          className="p-1 hover:bg-white rounded"
                        >
                          <ChevronUp className="w-3.5 h-3.5 text-[#7c8e88]" />
                        </button>
                        <button
                          onClick={() => moveBlock(i, 1)}
                          className="p-1 hover:bg-white rounded"
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-[#7c8e88]" />
                        </button>
                        <div className="w-px h-4 bg-[#e5e3d8] mx-1" />
                        <button
                          onClick={() => removeBlock(i)}
                          className="p-1 hover:bg-red-50 text-[#7c8e88] hover:text-[#c94c4c] rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      {block.type === 'MdBlock' && (
                        <textarea
                          value={block.content}
                          onChange={(e) => updateBlock(i, 'content', e.target.value)}
                          placeholder="Markdown content..."
                          className="w-full h-32 px-3 py-2 rounded-lg border border-[#e5e3d8] bg-[#fcfbf5] text-sm font-mono outline-none focus:border-[#1f644e]"
                        />
                      )}
                      {block.type === 'QuizBlock' && (
                        <QuizEditor
                          questions={block.quiz?.questions || []}
                          onChange={(q) => updateBlock(i, 'quiz', { ...block.quiz, questions: q })}
                        />
                      )}
                      {block.type === 'VideoBlock' && (
                        <div className="space-y-2">
                          <input
                            value={block.video?.title || ''}
                            onChange={(e) =>
                              updateBlock(i, 'video', { ...block.video, title: e.target.value })
                            }
                            placeholder="Video Title"
                            className="w-full px-3 py-2 rounded-lg border border-[#e5e3d8] text-sm font-bold"
                          />
                          <input
                            value={block.video?.url || ''}
                            onChange={(e) =>
                              updateBlock(i, 'video', { ...block.video, url: e.target.value })
                            }
                            placeholder="Video URL"
                            className="w-full px-3 py-2 rounded-lg border border-[#e5e3d8] text-sm"
                          />
                        </div>
                      )}
                      {block.type === 'ResourceBlock' && (
                        <div className="space-y-2">
                          <input
                            value={block.resource?.title || ''}
                            onChange={(e) =>
                              updateBlock(i, 'resource', {
                                ...block.resource,
                                title: e.target.value,
                              })
                            }
                            placeholder="Resource Title"
                            className="w-full px-3 py-2 rounded-lg border border-[#e5e3d8] text-sm font-bold"
                          />
                          <input
                            value={block.resource?.url || ''}
                            onChange={(e) =>
                              updateBlock(i, 'resource', { ...block.resource, url: e.target.value })
                            }
                            placeholder="Resource URL"
                            className="w-full px-3 py-2 rounded-lg border border-[#e5e3d8] text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => addBlock('MdBlock')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e5e3d8] text-xs font-bold hover:bg-[#f0f5f2] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Markdown
                  </button>
                  <button
                    onClick={() => addBlock('QuizBlock')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e5e3d8] text-xs font-bold hover:bg-[#f0f5f2] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Quiz
                  </button>
                  <button
                    onClick={() => addBlock('VideoBlock')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e5e3d8] text-xs font-bold hover:bg-[#f0f5f2] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Video
                  </button>
                  <button
                    onClick={() => addBlock('ResourceBlock')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e5e3d8] text-xs font-bold hover:bg-[#f0f5f2] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Resource Link
                  </button>
                </div>
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
                      className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-bold text-[#1e3a34] outline-none focus:border-[#1f644e] capitalize"
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
                      Estimated Duration
                    </label>
                    <input
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      placeholder="e.g. 15 mins"
                      className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-bold text-[#1e3a34] outline-none focus:border-[#1f644e]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] px-1">
                    Section Summary
                  </label>
                  <textarea
                    rows={3}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Brief overview of this section..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                      Learning Goals
                    </label>
                    <button
                      onClick={addGoal}
                      className="text-[10px] font-bold text-[#1f644e] hover:underline"
                    >
                      + Add Goal
                    </button>
                  </div>
                  <div className="space-y-2">
                    {learningGoals.map((goal, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={goal}
                          onChange={(e) => updateGoal(i, e.target.value)}
                          placeholder="Learners will be able to..."
                          className="flex-1 px-3 py-2 rounded-lg border border-[#e5e3d8] bg-[#fcfbf5] text-xs text-[#1e3a34] outline-none focus:border-[#1f644e]"
                        />
                        <button
                          onClick={() => removeGoal(i)}
                          className="p-2 text-[#7c8e88] hover:text-[#c94c4c]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {learningGoals.length === 0 && (
                      <p className="text-[11px] text-[#7c8e88] italic px-1">
                        No learning goals added yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-5 border-t border-[#e5e3d8] shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#e5e3d8] text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || loading}
              className="flex-1 py-2.5 rounded-xl bg-[#1f644e] text-white text-sm font-bold hover:bg-[#17503e] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Section'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
