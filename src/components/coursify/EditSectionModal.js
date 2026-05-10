'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Wand2,
  CheckCircle2,
  Zap,
  Copy,
  Type,
  PlayCircle,
  ListTree,
  Share2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import QuizEditor from './QuizEditor';

const RESOURCE_TYPES = ['video', 'article', 'doc', 'other'];
const STATUS_OPTIONS = ['planned', 'draft', 'needs_review', 'complete'];

const BLOCK_TYPES = [
  { type: 'MdBlock', label: 'Markdown', icon: Type },
  { type: 'VideoBlock', label: 'Video', icon: PlayCircle },
  { type: 'StepByStepBlock', label: 'Step-by-Step', icon: ListTree },
  { type: 'QuizBlock', label: 'Quiz', icon: CheckCircle2 },
  { type: 'MindMapBlock', label: 'Mind Map', icon: Share2 },
  { type: 'ResourceBlock', label: 'Resource', icon: FileText },
];

/**
 * Robust parser for structured Markdown deliverables.
 */
function parseMarkdownSection(text) {
  console.log('Magic Import: Starting robust parse...');
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
  const blockRegex =
    /##\s*\[(MdBlock|QuizBlock|VideoBlock|ResourceBlock|StepByStepBlock|MindMapBlock)\]/g;
  const matches = [];
  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    matches.push({ type: match[1], index: match.index, full: match[0] });
  }

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const nextIndex = matches[i + 1] ? matches[i + 1].index : text.length;
    let rawContent = text.substring(m.index + m.full.length, nextIndex).trim();

    rawContent = rawContent.replace(/\n\s*---\s*$/, '').trim();
    const block = { type: m.type, order: i };

    if (m.type === 'MdBlock') {
      block.content = rawContent;
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
      // 1. Extract block-level metadata
      const titleMatch = rawContent.match(/^title:\s*(.*)/m);
      if (titleMatch) {
        block.title = titleMatch[1].trim().replace(/^["'](.*)["']$/, '$1');
        rawContent = rawContent.replace(titleMatch[0], '');
      }
      const numMatch = rawContent.match(/^showNumbering:\s*(.*)/m);
      if (numMatch) {
        block.showNumbering = numMatch[1].trim() !== 'false';
        rawContent = rawContent.replace(numMatch[0], '');
      } else {
        block.showNumbering = true;
      }

      // 2. Split by step separator (start of string or newline)
      const sParts = rawContent.split(/(?:^|\n)\s*-\s*step:\s*/).filter((p) => p.trim());

      sParts.forEach((s) => {
        const lines = s.split('\n');
        const title = lines[0].trim().replace(/^["'](.*)["']$/, '$1');
        let stepContent = lines.slice(1).join('\n').trim();
        if (stepContent.startsWith('content:')) {
          stepContent = stepContent.replace(/^content:\s*/, '').trim();
        }
        // Remove outer quotes and unescape \n sequences
        stepContent = stepContent.replace(/^["']([\s\S]*)["']$/, '$1').replace(/\\n/g, '\n');

        if (title) block.steps.push({ title, content: stepContent });
      });
    } else if (m.type === 'MindMapBlock') {
      block.mindmap = { nodes: [], edges: [] };
      const lines = rawContent.split('\n');
      const stack = [];
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const indent = line.search(/\S/);
        const nodeId = `node_${idx}_${Math.random().toString(36).slice(2, 5)}`;
        const node = { id: nodeId, label: trimmed.replace(/^-/, '').trim(), parentId: null };
        while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop();
        if (stack.length > 0) {
          const parent = stack[stack.length - 1];
          node.parentId = parent.id;
          block.mindmap.edges.push({
            id: `edge_${parent.id}_${nodeId}`,
            source: parent.id,
            target: nodeId,
          });
        }
        block.mindmap.nodes.push(node);
        stack.push({ id: nodeId, indent });
      });
    } else if (m.type === 'QuizBlock') {
      block.quiz = { questions: [] };
      const qRegex = /(?:^|\n)\s*-\s*question:\s*/g;
      const qMatches = [];
      let qMatch;
      while ((qMatch = qRegex.exec(rawContent)) !== null) {
        qMatches.push({ index: qMatch.index, full: qMatch[0] });
      }

      for (let j = 0; j < qMatches.length; j++) {
        const start = qMatches[j].index + qMatches[j].full.length;
        const end = qMatches[j + 1] ? qMatches[j + 1].index : rawContent.length;
        const qRaw = rawContent.substring(start, end);

        const qObj = {
          type: 'multiple_choice',
          question: '',
          options: [],
          correctAnswer: '',
          explanation: '',
          points: 1,
          _tempId: Math.random().toString(36).slice(2),
        };

        const lines = qRaw.split('\n');
        qObj.question = lines[0].trim().replace(/^["'](.*)["']$/, '$1');

        let parsingKey = '';
        lines.slice(1).forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed) return;

          if (trimmed.includes(':') && !trimmed.startsWith('-')) {
            const sIdx = trimmed.indexOf(':');
            const key = trimmed.substring(0, sIdx).trim();
            const val = trimmed.substring(sIdx + 1).trim();

            if (key === 'type') qObj.type = val.replace(/^["'](.*)["']$/, '$1');
            else if (key === 'correctAnswer')
              qObj.correctAnswer = val.replace(/^["'](.*)["']$/, '$1');
            else if (key === 'explanation') qObj.explanation = val.replace(/^["'](.*)["']$/, '$1');
            else if (key === 'points') qObj.points = parseInt(val) || 1;
            else if (key === 'options') {
              parsingKey = 'options';
              const arrMatch = trimmed.match(/\[(.*?)\]/);
              if (arrMatch) {
                qObj.options = arrMatch[1]
                  .split(',')
                  .map((o) => o.trim().replace(/^["'](.*)["']$/, '$1'));
                parsingKey = '';
              }
            } else {
              parsingKey = key;
            }
          } else if (trimmed.startsWith('-') && parsingKey === 'options') {
            qObj.options.push(
              trimmed
                .replace(/^-/, '')
                .trim()
                .replace(/^["'](.*)["']$/, '$1')
            );
          }
        });

        if (qObj.options.length > 0) {
          const lowerCA = qObj.correctAnswer.toLowerCase();
          if (qObj.type === 'multi_select') {
            const answers = [];
            qObj.options.forEach((opt, idx) => {
              if (lowerCA.includes(opt.toLowerCase())) answers.push(String(idx));
            });
            if (answers.length === 0 && lowerCA.startsWith('[')) {
              try {
                qObj.correctAnswer = JSON.parse(qObj.correctAnswer.replace(/'/g, '"')).map(String);
              } catch {
                qObj.correctAnswer = [];
              }
            } else {
              qObj.correctAnswer = answers;
            }
          } else {
            const foundIdx = qObj.options.findIndex((o) => o.toLowerCase() === lowerCA);
            if (foundIdx !== -1) {
              qObj.correctAnswer = String(foundIdx);
            }
          }
          if (
            qObj.options.length === 2 &&
            qObj.options.some((o) => o.toLowerCase() === 'true') &&
            qObj.options.some((o) => o.toLowerCase() === 'false')
          ) {
            qObj.type = 'true_false';
            qObj.correctAnswer = lowerCA.includes('true') ? 'true' : 'false';
          }
        }
        if (qObj.question) block.quiz.questions.push(qObj);
      }
    }
    result.blocks.push(block);
  }

  return result;
}

/**
 * Generator for structured Markdown deliverables.
 */
function generateMarkdownExport(data) {
  let output = '---\n';
  output += `title: "${data.title}"\n`;
  output += `summary: "${data.summary}"\n`;
  output += `learningGoals:\n${(data.learningGoals || []).map((g) => `  - "${g}"`).join('\n')}\n`;
  output += `estimatedDuration: "${data.estimatedDuration}"\n`;
  output += `status: "${data.status}"\n`;
  output += '---\n\n# Blocks\n\n';

  data.blocks.forEach((block, i) => {
    output += `## [${block.type}]\n`;
    if (block.type === 'MdBlock') {
      output += `${block.content}\n\n`;
    } else if (block.type === 'VideoBlock') {
      output += `url: ${block.video?.url || ''}\n`;
      output += `title: "${block.video?.title || ''}"\n\n`;
    } else if (block.type === 'ResourceBlock') {
      output += `url: ${block.resource?.url || ''}\n`;
      output += `title: "${block.resource?.title || ''}"\n`;
      output += `type: "${block.resource?.type || 'other'}"\n\n`;
    } else if (block.type === 'StepByStepBlock') {
      if (block.title) output += `title: "${block.title}"\n`;
      if (block.showNumbering === false) output += 'showNumbering: false\n';
      (block.steps || []).forEach((s) => {
        output += `- step: "${s.title}"\n  content: "${(s.content || '').replace(/\n/g, '\\n')}"\n`;
      });
      output += '\n';
    } else if (block.type === 'MindMapBlock') {
      const nodes = block.mindmap?.nodes || [];
      const edges = block.mindmap?.edges || [];
      const renderNode = (nodeId, depth = 0) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return '';
        let line = '  '.repeat(depth) + node.label + '\n';
        const children = edges.filter((e) => e.source === nodeId).map((e) => e.target);
        children.forEach((childId) => {
          line += renderNode(childId, depth + 1);
        });
        return line;
      };
      const roots = nodes.filter((n) => !n.parentId || n.parentId === 'root');
      roots.forEach((r) => {
        output += renderNode(r.id, 0);
      });
      output += '\n';
    } else if (block.type === 'QuizBlock') {
      (block.quiz?.questions || []).forEach((q) => {
        output += `- question: "${q.question}"\n`;
        output += `  type: "${q.type}"\n`;
        output += `  options:\n${(q.options || []).map((o) => `    - "${o}"`).join('\n')}\n`;
        let answerText = q.correctAnswer;
        if (q.type === 'multiple_choice') {
          const idx = parseInt(q.correctAnswer);
          if (!isNaN(idx) && q.options[idx]) answerText = q.options[idx];
        } else if (q.type === 'multi_select' && Array.isArray(q.correctAnswer)) {
          answerText = q.correctAnswer
            .map((idx) => q.options[parseInt(idx)])
            .filter(Boolean)
            .join(', ');
        }
        output += `  correctAnswer: "${answerText}"\n`;
        output += `  explanation: "${q.explanation}"\n`;
        output += `  points: ${q.points}\n`;
      });
      output += '\n';
    }
    if (i < data.blocks.length - 1) output += '---\n\n';
  });

  return output;
}

function QuickAdder({ isOpen, onToggle, onAdd }) {
  return (
    <div className="relative h-4 group/adder z-30 flex items-center justify-center">
      {/* Invisible backdrop to close menu on click outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 cursor-default"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        />
      )}

      {/* Hover line trigger */}
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
  const [blocks, setBlocks] = useState(section?.blocks || []);
  const [resources, setResources] = useState(section?.resources || []);
  const [summary, setSummary] = useState(section?.summary || '');
  const [learningGoals, setLearningGoals] = useState(section?.learningGoals || []);
  const [estimatedDuration, setEstimatedDuration] = useState(section?.estimatedDuration || '');
  const [status, setStatus] = useState(section?.status || 'draft');
  const [importText, setImportText] = useState('');

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('blocks');
  const [activeAdderIndex, setActiveAdderIndex] = useState(null);

  const exportText = useMemo(
    () =>
      generateMarkdownExport({
        title,
        summary,
        learningGoals,
        estimatedDuration,
        status,
        blocks,
      }),
    [title, summary, learningGoals, estimatedDuration, status, blocks]
  );

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
    if (type === 'MindMapBlock') {
      newBlock.mindmap = {
        nodes: [{ id: 'root', label: 'Main Topic', parentId: null }],
        edges: [],
      };
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

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportText);
    toast.success('Export copied to clipboard!');
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setLoading(true);
    await onSave({
      title: title.trim(),
      blocks: blocks.map((b, i) => ({ ...b, order: i })),
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
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e5e3d8] shrink-0 bg-[#fcfbf5]">
          <div className="flex flex-col">
            <h2 className="font-bold text-[#1e3a34] text-lg leading-tight">
              {section ? 'Edit Section' : 'New Section'}
            </h2>
            <p className="text-[10px] text-[#7c8e88] font-bold uppercase tracking-widest mt-0.5">
              Studio Editor
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f0f5f2] rounded-xl transition-all hover:rotate-90 duration-200"
          >
            <X className="w-5 h-5 text-[#7c8e88]" />
          </button>
        </div>

        {/* Title Area */}
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

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4 shrink-0 border-b border-[#e5e3d8]/50">
          {['blocks', 'planning', 'import', 'export'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all relative ${
                tab === t
                  ? 'text-[#1f644e] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#1f644e]'
                  : 'text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#f0f5f2]/50'
              }`}
            >
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 pb-8 min-h-0 bg-white">
          {tab === 'export' && (
            <div className="flex min-h-0 flex-col gap-4">
              <p className="text-[11px] text-[#7c8e88] px-1">
                Copy this structured Markdown to save your section externally.
              </p>
              <textarea
                readOnly
                value={exportText}
                className="h-[60vh] w-full p-4 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-mono outline-none focus:border-[#1f644e] resize-none"
              />
              <button
                onClick={handleCopyExport}
                className="w-full py-3 bg-[#1f644e] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#17503e] transition-colors shadow-lg shadow-[#1f644e]/10"
              >
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </button>
            </div>
          )}

          {tab === 'import' && (
            <div className="flex min-h-0 flex-col gap-4">
              <p className="text-[11px] text-[#7c8e88] px-1">
                Paste structured Markdown here to automatically fill all blocks.
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="--- \ntitle: My Section...\n---"
                className="h-[60vh] w-full p-4 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-mono outline-none focus:border-[#1f644e] resize-none"
              />
              <button
                onClick={handleMagicImport}
                disabled={!importText.trim()}
                className="w-full py-3 bg-[#1f644e] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#17503e] transition-colors disabled:opacity-50 shadow-lg shadow-[#1f644e]/10"
              >
                <Wand2 className="w-4 h-4" />
                Magic Import
              </button>
            </div>
          )}

          {tab === 'blocks' && (
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
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] px-1">
                              Process Heading
                            </label>
                            <input
                              value={block.title || ''}
                              onChange={(e) => updateBlock(i, 'title', e.target.value)}
                              placeholder="e.g. The Deployment Lifecycle"
                              className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-white text-sm font-bold text-[#1e3a34] outline-none focus:border-[#1f644e] shadow-sm"
                            />
                          </div>

                          <div className="flex items-center justify-between bg-white border border-[#e5e3d8] rounded-xl p-3.5 shadow-sm transition-all hover:shadow-md">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-1.5 rounded-lg transition-colors ${block.showNumbering !== false ? 'bg-[#1f644e]/10 text-[#1f644e]' : 'bg-[#7c8e88]/10 text-[#7c8e88]'}`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-[#1e3a34] uppercase tracking-tight">
                                  Step Numbering
                                </span>
                                <span className="text-[9px] text-[#7c8e88] font-medium leading-none">
                                  Toggle visibility of step indices
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                updateBlock(
                                  i,
                                  'showNumbering',
                                  block.showNumbering !== false ? false : true
                                )
                              }
                              className={`group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-[#1f644e]/20 ${
                                block.showNumbering !== false ? 'bg-[#1f644e]' : 'bg-[#e5e3d8]'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                  block.showNumbering !== false ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                          {(block.steps || []).map((step, si) => (
                            <div
                              key={si}
                              className="bg-[#fcfbf5] border border-[#e5e3d8] rounded-2xl p-4 space-y-3 relative group/step shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[#1f644e] uppercase tracking-widest bg-white px-2 py-0.5 rounded-full border border-[#e5e3d8]">
                                  STEP {si + 1}
                                </span>
                                <button
                                  onClick={() => {
                                    const nextSteps = block.steps.filter((_, idx) => idx !== si);
                                    updateBlock(i, 'steps', nextSteps);
                                  }}
                                  className="p-1.5 text-[#7c8e88] hover:text-[#c94c4c] opacity-0 group-hover/step:opacity-100 transition-all hover:bg-white rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
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
                                placeholder="Step Content (Markdown supported)"
                                className="w-full h-24 px-3 py-2 rounded-xl border border-[#e5e3d8] text-xs bg-white resize-none focus:border-[#1f644e] outline-none"
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
                            className="w-full py-3 rounded-2xl border-2 border-dashed border-[#e5e3d8] text-xs font-bold text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] hover:bg-[#f0f5f2]/50 transition-all shadow-sm"
                          >
                            + Add Step to Flow
                          </button>
                        </div>
                      )}
                      {block.type === 'MindMapBlock' && (
                        <div className="space-y-4">
                          <p className="text-[10px] text-[#7c8e88] italic px-1 bg-[#fcfbf5] py-2 rounded-xl border border-[#e5e3d8]/50">
                            Note: For best results, use "Magic Import" with an indented list. Manual
                            editing adds nodes to the root.
                          </p>
                          <div className="space-y-2">
                            {(block.mindmap?.nodes || []).map((node, ni) => (
                              <div
                                key={ni}
                                className="flex gap-2 items-center bg-[#fcfbf5] p-3 rounded-xl border border-[#e5e3d8] shadow-sm"
                              >
                                <input
                                  value={node.label}
                                  onChange={(e) => {
                                    const nextNodes = block.mindmap.nodes.map((n, idx) =>
                                      ni === idx ? { ...n, label: e.target.value } : n
                                    );
                                    updateBlock(i, 'mindmap', {
                                      ...block.mindmap,
                                      nodes: nextNodes,
                                    });
                                  }}
                                  className="flex-1 px-2 py-1 text-sm font-semibold border-none bg-transparent focus:ring-0"
                                />
                                <button
                                  onClick={() => {
                                    const nextNodes = block.mindmap.nodes.filter(
                                      (_, idx) => ni !== idx
                                    );
                                    const nextEdges = block.mindmap.edges.filter(
                                      (e) => e.source !== node.id && e.target !== node.id
                                    );
                                    updateBlock(i, 'mindmap', {
                                      nodes: nextNodes,
                                      edges: nextEdges,
                                    });
                                  }}
                                  className="text-[#7c8e88] hover:text-[#c94c4c] p-2 hover:bg-white rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              const newId = `node_${Date.now()}`;
                              const nextNodes = [
                                ...(block.mindmap?.nodes || []),
                                { id: newId, label: 'New Node', parentId: 'root' },
                              ];
                              const nextEdges = [
                                ...(block.mindmap?.edges || []),
                                { id: `edge_root_${newId}`, source: 'root', target: newId },
                              ];
                              updateBlock(i, 'mindmap', { nodes: nextNodes, edges: nextEdges });
                            }}
                            className="w-full py-3 rounded-2xl border-2 border-dashed border-[#e5e3d8] text-xs font-bold text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] hover:bg-[#f0f5f2]/50 transition-all"
                          >
                            + Add Node to Root
                          </button>
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

              {blocks.length === 0 && (
                <div className="text-center py-20 bg-[#fcfbf5] rounded-3xl border-2 border-dashed border-[#e5e3d8]">
                  <p className="text-sm text-[#7c8e88] font-medium mb-4">
                    This section has no content yet.
                  </p>
                  <button
                    onClick={() => addBlock('MdBlock')}
                    className="px-6 py-2.5 bg-[#1f644e] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#1f644e]/10"
                  >
                    Start with Markdown
                  </button>
                </div>
              )}
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
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-bold text-[#1e3a34] outline-none focus:border-[#1f644e] capitalize transition-all"
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
                    className="w-full px-4 py-3 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-bold text-[#1e3a34] outline-none focus:border-[#1f644e] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] px-1">
                  Section Summary
                </label>
                <textarea
                  rows={4}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief overview of this section..."
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none focus:border-[#1f644e] resize-none leading-relaxed transition-all"
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
                        placeholder="Learners will be able to..."
                        className="flex-1 px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-xs font-semibold text-[#1e3a34] outline-none focus:border-[#1f644e] transition-all shadow-sm"
                      />
                      <button
                        onClick={() => removeGoal(i)}
                        className="p-2.5 text-[#7c8e88] hover:text-[#c94c4c] hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/goal:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {learningGoals.length === 0 && (
                    <div className="text-center py-8 rounded-2xl border-2 border-dashed border-[#e5e3d8] bg-[#fcfbf5]">
                      <p className="text-[11px] text-[#7c8e88] italic px-1">
                        No learning goals defined.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-[#e5e3d8] shrink-0 bg-[#fcfbf5]">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#e5e3d8] text-sm font-bold text-[#7c8e88] hover:bg-white hover:text-[#c94c4c] hover:border-[#c94c4c]/20 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || loading}
            className="flex-1 py-3 rounded-xl bg-[#1f644e] text-white text-sm font-bold hover:bg-[#17503e] shadow-lg shadow-[#1f644e]/10 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? 'Saving Changes...' : 'Save Section'}
          </button>
        </div>
      </div>
    </>
  );
}
