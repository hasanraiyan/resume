'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronUp, ChevronDown, Wand2, CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import QuizEditor from './QuizEditor';

const RESOURCE_TYPES = ['video', 'article', 'doc', 'other'];
const STATUS_OPTIONS = ['planned', 'draft', 'needs_review', 'complete'];

function parseMarkdownSection(text) {
  console.log('Magic Import: Starting parse...');
  const result = {
    title: '',
    summary: '',
    learningGoals: [],
    estimatedDuration: '',
    status: 'draft',
    blocks: [],
  };

  // 1. Parse YAML Front-matter
  const frontMatterMatch = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (frontMatterMatch) {
    const yaml = frontMatterMatch[1];
    const lines = yaml.split('\n');
    let currentKey = '';

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('-')) {
        if (currentKey === 'learningGoals') {
          result.learningGoals.push(
            trimmed
              .replace(/^-/, '')
              .trim()
              .replace(/^["'](.*)["']$/, '$1')
          );
        }
      } else if (trimmed.includes(':')) {
        const idx = trimmed.indexOf(':');
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        currentKey = k;
        const cleanV = v.replace(/^["'](.*)["']$/, '$1');
        if (k === 'title') result.title = cleanV;
        if (k === 'summary') result.summary = cleanV;
        if (k === 'estimatedDuration') result.estimatedDuration = cleanV;
        if (k === 'status') result.status = cleanV;
      }
    });
    text = text.replace(frontMatterMatch[0], '');
  }

  // 2. Extract Blocks
  const blockRegex = /##\s*\[(MdBlock|QuizBlock|VideoBlock|ResourceBlock|StepByStepBlock)\]/g;
  const matches = [];
  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    matches.push({ type: match[1], index: match.index, full: match[0] });
  }

  console.log(`Magic Import: Found ${matches.length} blocks.`);

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const nextIndex = matches[i + 1] ? matches[i + 1].index : text.length;
    let rawContent = text.substring(m.index + m.full.length, nextIndex).trim();

    // Strip trailing separators and clean whitespace
    rawContent = rawContent.replace(/\n\s*---\s*$/, '').trim();

    const block = { type: m.type, order: i };

    if (m.type === 'MdBlock') {
      block.content = rawContent.replace(/^###.*\n?/, '').trim();
    } else if (m.type === 'VideoBlock') {
      const urlMatch = rawContent.match(/url:\s*(.*)/);
      const titleMatch = rawContent.match(/title:\s*(.*)/);
      block.video = {
        url: urlMatch?.[1].trim() || '',
        title: titleMatch?.[1].trim() || '',
        platform: 'youtube',
      };
    } else if (m.type === 'ResourceBlock') {
      const urlMatch = rawContent.match(/url:\s*(.*)/);
      const titleMatch = rawContent.match(/title:\s*(.*)/);
      block.resource = {
        url: urlMatch?.[1].trim() || '',
        title: titleMatch?.[1].trim() || '',
        type: 'other',
      };
    } else if (m.type === 'StepByStepBlock') {
      block.steps = [];
      // Split by "- step:" while preserving the content following it
      const sParts = rawContent.split(/\s*-\s*step:/).filter((p) => p.trim());

      sParts.forEach((s) => {
        const lines = s.split('\n');
        const title = lines[0].trim().replace(/^["'](.*)["']$/, '$1');

        // Extract content by finding the 'content:' key or just taking the remaining lines
        let stepContent = lines.slice(1).join('\n').trim();
        if (stepContent.startsWith('content:')) {
          stepContent = stepContent.replace(/^content:\s*/, '').trim();
        }
        // Clean up quotes from the entire block if present
        stepContent = stepContent.replace(/^["']([\s\S]*)["']$/, '$1');

        if (title) block.steps.push({ title, content: stepContent });
      });
      console.log(`Magic Import: Parsed StepByStep with ${block.steps.length} steps.`);
    } else if (m.type === 'QuizBlock') {
      block.quiz = { questions: [] };
      const qParts = rawContent.split(/\s*-\s*question:/).filter((p) => p.trim());

      if (qParts.length > 0 && !qParts[0].includes('correctAnswer:')) {
        qParts.shift();
      }

      qParts.forEach((qStr) => {
        const qObj = {
          type: 'multiple_choice',
          question: '',
          options: [],
          correctAnswer: '',
          explanation: '',
          points: 1,
          _tempId: Math.random().toString(36).slice(2),
        };

        const lines = qStr.split('\n');
        qObj.question = lines[0].trim().replace(/^["'](.*)["']$/, '$1');

        lines.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('type:')) qObj.type = trimmed.split(':')[1].trim();
          if (trimmed.startsWith('correctAnswer:'))
            qObj.correctAnswer = trimmed
              .split(':')[1]
              .trim()
              .replace(/^["'](.*)["']$/, '$1');
          if (trimmed.startsWith('explanation:'))
            qObj.explanation = trimmed
              .split(':')[1]
              .trim()
              .replace(/^["'](.*)["']$/, '$1');
          if (trimmed.startsWith('points:')) qObj.points = parseInt(trimmed.split(':')[1]) || 1;
        });

        const optionsMatch = qStr.match(/options:\s*\n((?:\s*-\s*.*\n?)*)/);
        if (optionsMatch) {
          qObj.options = optionsMatch[1]
            .split('\n')
            .map((o) =>
              o
                .replace(/^\s*-\s*/, '')
                .replace(/^["'](.*)["']$/, '$1')
                .trim()
            )
            .filter(Boolean);
        }

        if (qObj.options.length > 0) {
          const idx = qObj.options.findIndex(
            (o) => o.toLowerCase() === qObj.correctAnswer.toLowerCase()
          );
          if (idx !== -1) {
            qObj.correctAnswer = String(idx);
          }
          if (
            qObj.options.length === 2 &&
            qObj.options.some((o) => o.toLowerCase() === 'true') &&
            qObj.options.some((o) => o.toLowerCase() === 'false')
          ) {
            qObj.type = 'true_false';
            qObj.correctAnswer = qObj.correctAnswer.toLowerCase();
          }
        }

        if (qObj.question) block.quiz.questions.push(qObj);
      });
    }
    result.blocks.push(block);
  }

  return result;
}

export default function EditSectionModal({ section, onSave, onClose }) {
  const [title, setTitle] = useState(section?.title || '');
  const [blocks, setBlocks] = useState(section?.blocks || []);
  const [resources, setResources] = useState(section?.resources || []);
  const [summary, setSummary] = useState(section?.summary || '');
  const [learningGoals, setLearningGoals] = useState(section?.learningGoals || []);
  const [estimatedDuration, setEstimatedDuration] = useState(section?.estimatedDuration || '');
  const [status, setStatus] = useState(section?.status || 'draft');
  const [importText, setImportText] = useState('');

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
    if (type === 'StepByStepBlock') newBlock.steps = [{ title: '', content: '' }];
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

  const handleMagicImport = () => {
    if (!importText.trim()) return;
    const parsed = parseMarkdownSection(importText);
    setTitle(parsed.title || title);
    setSummary(parsed.summary || summary);
    setLearningGoals(parsed.learningGoals.length ? parsed.learningGoals : learningGoals);
    setEstimatedDuration(parsed.estimatedDuration || estimatedDuration);
    setStatus(parsed.status || status);
    if (parsed.blocks.length) setBlocks(parsed.blocks);
    setTab('blocks');
    setImportText('');
    toast.success('Magic Import complete!');
  };

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
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#f0f5f2] rounded-lg transition-colors"
            >
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
            {['blocks', 'planning', 'import'].map((t) => (
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
          <div className="flex-1 overflow-y-auto p-5 pb-6 min-h-0">
            {tab === 'import' && (
              <div className="flex min-h-0 flex-col gap-4">
                <p className="text-[11px] text-[#7c8e88] px-1">
                  Paste the structured Markdown content here to automatically fill all fields and
                  blocks.
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="--- \ntitle: My Section...\n---"
                  className="h-[42vh] min-h-[220px] max-h-[360px] w-full p-4 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-mono outline-none focus:border-[#1f644e] resize-y"
                />
                <button
                  onClick={handleMagicImport}
                  disabled={!importText.trim()}
                  className="w-full py-3 bg-[#1f644e] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#17503e] transition-colors disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4" />
                  Magic Import
                </button>
              </div>
            )}

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
                      {block.type === 'StepByStepBlock' && (
                        <div className="space-y-4">
                          {(block.steps || []).map((step, si) => (
                            <div
                              key={si}
                              className="bg-[#f9f9f7] border border-[#e5e3d8] rounded-xl p-3 space-y-2 relative group/step"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[#1f644e]">
                                  STEP {si + 1}
                                </span>
                                <button
                                  onClick={() => {
                                    const nextSteps = block.steps.filter((_, idx) => idx !== si);
                                    updateBlock(i, 'steps', nextSteps);
                                  }}
                                  className="p-1 text-[#7c8e88] hover:text-[#c94c4c] opacity-0 group-hover/step:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
                                className="w-full px-3 py-2 rounded-lg border border-[#e5e3d8] text-sm font-bold bg-white"
                              />
                              <textarea
                                value={step.content}
                                onChange={(e) => {
                                  const nextSteps = block.steps.map((s, idx) =>
                                    idx === si ? { ...s, content: e.target.value } : s
                                  );
                                  updateBlock(i, 'steps', nextSteps);
                                }}
                                placeholder="Step Content (Markdown supported)"
                                className="w-full h-20 px-3 py-2 rounded-lg border border-[#e5e3d8] text-xs bg-white resize-none"
                              />
                            </div>
                          ))}
                          <button
                            onClick={() =>
                              updateBlock(i, 'steps', [
                                ...(block.steps || []),
                                { title: '', content: '' },
                              ])
                            }
                            className="w-full py-2 rounded-xl border border-dashed border-[#e5e3d8] text-[10px] font-bold text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] transition-all"
                          >
                            + Add Step
                          </button>
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
                  <button
                    onClick={() => addBlock('StepByStepBlock')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e5e3d8] text-xs font-bold hover:bg-[#f0f5f2] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Step-by-Step
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
