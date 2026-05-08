'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'multi_select', label: 'Multi-Select' },
  { value: 'short_answer', label: 'Short Answer' },
];

function newQuestion() {
  return {
    _tempId: Math.random().toString(36).slice(2),
    type: 'multiple_choice',
    question: '',
    options: ['', ''],
    correctAnswer: '0',
    explanation: '',
    points: 1,
  };
}

function CorrectAnswerPicker({ question, onChange }) {
  const { type, options, correctAnswer } = question;

  if (type === 'true_false') {
    return (
      <div className="flex gap-2">
        {['true', 'false'].map((val) => (
          <label
            key={val}
            className="flex items-center gap-1.5 text-xs text-[#1e3a34] cursor-pointer"
          >
            <input
              type="radio"
              name={`ca-${question._tempId || question._id}`}
              value={val}
              checked={String(correctAnswer) === val}
              onChange={() => onChange({ correctAnswer: val })}
              className="accent-[#1f644e]"
            />
            {val.charAt(0).toUpperCase() + val.slice(1)}
          </label>
        ))}
      </div>
    );
  }

  if (type === 'multiple_choice') {
    return (
      <div className="flex flex-wrap gap-2">
        {(options || []).map((opt, i) => (
          <label
            key={i}
            className="flex items-center gap-1.5 text-xs text-[#1e3a34] cursor-pointer"
          >
            <input
              type="radio"
              name={`ca-${question._tempId || question._id}`}
              value={String(i)}
              checked={String(correctAnswer) === String(i)}
              onChange={() => onChange({ correctAnswer: String(i) })}
              className="accent-[#1f644e]"
            />
            Option {i + 1}
          </label>
        ))}
      </div>
    );
  }

  if (type === 'multi_select') {
    const selected = Array.isArray(correctAnswer) ? correctAnswer.map(String) : [];
    return (
      <div className="flex flex-wrap gap-2">
        {(options || []).map((opt, i) => (
          <label
            key={i}
            className="flex items-center gap-1.5 text-xs text-[#1e3a34] cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(String(i))}
              onChange={() => {
                const next = selected.includes(String(i))
                  ? selected.filter((v) => v !== String(i))
                  : [...selected, String(i)];
                onChange({ correctAnswer: next });
              }}
              className="accent-[#1f644e]"
            />
            Option {i + 1}
          </label>
        ))}
      </div>
    );
  }

  if (type === 'short_answer') {
    return (
      <input
        type="text"
        value={correctAnswer || ''}
        onChange={(e) => onChange({ correctAnswer: e.target.value })}
        placeholder="Reference answer shown after submission…"
        className="w-full text-xs text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1f644e]"
      />
    );
  }

  return null;
}

function QuestionCard({ question, index, total, onChange, onRemove, onMove }) {
  const [expanded, setExpanded] = useState(true);
  const hasOptions = question.type === 'multiple_choice' || question.type === 'multi_select';

  const updateOption = (i, value) => {
    const opts = [...(question.options || [])];
    opts[i] = value;
    onChange({ options: opts });
  };

  const addOption = () => {
    onChange({ options: [...(question.options || []), ''] });
  };

  const removeOption = (i) => {
    const opts = (question.options || []).filter((_, idx) => idx !== i);
    // Fix correctAnswer if it pointed to removed/shifted option
    let ca = question.correctAnswer;
    if (question.type === 'multiple_choice') {
      const caNum = parseInt(ca);
      if (caNum === i) ca = '0';
      else if (caNum > i) ca = String(caNum - 1);
    } else if (question.type === 'multi_select') {
      ca = (Array.isArray(ca) ? ca : [])
        .map(Number)
        .filter((v) => v !== i)
        .map((v) => String(v > i ? v - 1 : v));
    }
    onChange({ options: opts, correctAnswer: ca });
  };

  return (
    <div className="bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-b border-[#e5e3d8]">
        <GripVertical className="w-3.5 h-3.5 text-[#c5cec9] shrink-0" />
        <span className="text-xs font-bold text-[#7c8e88] shrink-0">Q{index + 1}</span>
        <select
          value={question.type}
          onChange={(e) => {
            const t = e.target.value;
            const update = { type: t };
            if (t === 'true_false') update.correctAnswer = 'true';
            else if (t === 'multiple_choice') {
              update.options = question.options?.length >= 2 ? question.options : ['', ''];
              update.correctAnswer = '0';
            } else if (t === 'multi_select') {
              update.options = question.options?.length >= 2 ? question.options : ['', ''];
              update.correctAnswer = [];
            } else if (t === 'short_answer') {
              update.correctAnswer = '';
            }
            onChange(update);
          }}
          className="text-xs font-bold px-2 py-1 border border-[#e5e3d8] rounded-lg bg-[#f9f9f7] focus:outline-none focus:border-[#1f644e] text-[#1e3a34]"
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="p-1 rounded text-[#c5cec9] hover:text-[#7c8e88] disabled:opacity-30 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            className="p-1 rounded text-[#c5cec9] hover:text-[#7c8e88] disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded text-[#c5cec9] hover:text-[#7c8e88] transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onRemove}
            className="p-1 rounded text-[#c5cec9] hover:text-[#c94c4c] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 space-y-3">
          <textarea
            rows={2}
            value={question.question}
            onChange={(e) => onChange({ question: e.target.value })}
            placeholder="Question text…"
            className="w-full text-sm text-[#1e3a34] bg-white border border-[#e5e3d8] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1f644e] leading-relaxed"
          />

          {hasOptions && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                Options
              </p>
              {(question.options || []).map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-xs text-[#7c8e88] w-5 shrink-0 text-right">{i + 1}.</span>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 text-sm text-[#1e3a34] bg-white border border-[#e5e3d8] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#1f644e]"
                  />
                  {(question.options || []).length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="p-1 rounded hover:bg-red-50 text-[#c5cec9] hover:text-[#c94c4c] transition-colors shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {(question.options || []).length < 6 && (
                <button
                  onClick={addOption}
                  className="ml-6 text-xs font-bold text-[#1f644e] hover:underline"
                >
                  + Add option
                </button>
              )}
            </div>
          )}

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
              Correct Answer
            </p>
            <CorrectAnswerPicker question={question} onChange={onChange} />
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
              Explanation <span className="normal-case font-normal">(optional)</span>
            </p>
            <input
              type="text"
              value={question.explanation || ''}
              onChange={(e) => onChange({ explanation: e.target.value })}
              placeholder="Shown after the learner submits…"
              className="w-full text-sm text-[#1e3a34] bg-white border border-[#e5e3d8] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1f644e]"
            />
          </div>

          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">Points</p>
            <input
              type="number"
              min={1}
              value={question.points || 1}
              onChange={(e) => onChange({ points: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-16 text-xs text-[#1e3a34] bg-white border border-[#e5e3d8] rounded-lg px-2 py-1 focus:outline-none focus:border-[#1f644e]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuizEditor({ questions = [], onChange }) {
  const update = (index, patch) => {
    const next = questions.map((q, i) => (i === index ? { ...q, ...patch } : q));
    onChange(next);
  };

  const remove = (index) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const move = (index, direction) => {
    const next = [...questions];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () => {
    onChange([...questions, newQuestion()]);
  };

  return (
    <div className="space-y-3">
      {questions.length === 0 && (
        <div className="text-center py-6 text-sm text-[#7c8e88] border-2 border-dashed border-[#e5e3d8] rounded-xl">
          No questions yet. Add one below.
        </div>
      )}

      {questions.map((q, i) => (
        <QuestionCard
          key={q._tempId || q._id || i}
          index={i}
          total={questions.length}
          question={q}
          onChange={(patch) => update(i, patch)}
          onRemove={() => remove(i)}
          onMove={move}
        />
      ))}

      <button
        onClick={add}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-[#e5e3d8] text-xs font-bold text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Question
      </button>
    </div>
  );
}
