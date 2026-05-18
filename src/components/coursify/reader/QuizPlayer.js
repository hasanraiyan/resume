'use client';

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Trophy,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

function isCorrect(question, answer) {
  if (answer === undefined || answer === null || answer === '') return false;
  const { type, correctAnswer } = question;
  if (type === 'multiple_choice' || type === 'true_false') {
    return String(answer) === String(correctAnswer);
  }
  if (type === 'multi_select') {
    const userSet = new Set((answer || []).map(String));
    const correctSet = new Set((correctAnswer || []).map(String));
    if (userSet.size !== correctSet.size) return false;
    for (const v of correctSet) if (!userSet.has(v)) return false;
    return true;
  }
  return null; // short_answer: self-check
}

function hasAnswer(question, answer) {
  if (question.type === 'multi_select') return Array.isArray(answer) && answer.length > 0;
  return answer !== undefined && answer !== '';
}

function stripFootnotes(text) {
  if (!text) return '';
  return text.replace(/\[\^[^\]]+\]/g, '').trim();
}

function QuestionView({ index, total, question, answer, submitted, onChange }) {
  const { type, question: text, options, correctAnswer, explanation, points } = question;
  const displayOptions =
    type === 'true_false' ? ['True', 'False'] : Array.isArray(options) ? options : [];

  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#7c8e88]">
          <span className="px-2 py-0.5 rounded-full bg-[#1f644e]/10 text-[#1f644e]">
            Q{index + 1}
          </span>
          {points > 1 && <span className="text-[#b5c4be]">• {points} pts</span>}
          <span className="ml-auto text-[#b0bfbb]">
            {type === 'multiple_choice' && 'Single choice'}
            {type === 'true_false' && 'True / False'}
            {type === 'multi_select' && 'Select multiple'}
            {type === 'short_answer' && 'Short answer'}
          </span>
        </div>
        <div className="text-[#1e3a34] font-serif text-lg font-bold leading-snug">
          <MarkdownRenderer content={text || ''} isInline />
        </div>
      </div>

      {/* Options */}
      {(type === 'multiple_choice' || type === 'true_false' || type === 'multi_select') && (
        <div className="space-y-2.5">
          {displayOptions.map((opt, i) => {
            const optKey = String(i);
            const selected =
              type === 'multi_select'
                ? Array.isArray(answer) && answer.includes(optKey)
                : String(answer) === optKey;

            const isCorrectOpt =
              submitted &&
              (type === 'multi_select'
                ? (correctAnswer || []).map(String).includes(optKey)
                : String(correctAnswer) === optKey);

            const isWrongSel = submitted && selected && !isCorrectOpt;

            return (
              <label
                key={i}
                className={`group relative flex items-center gap-3 px-4 py-0 rounded-2xl border transition-all duration-200 cursor-pointer text-sm font-medium ${
                  isCorrectOpt
                    ? 'bg-[#f0f5f2] border-[#1f644e]/40 text-[#1f644e] shadow-[0_2px_12_px_-4px_rgba(31,100,78,0.15)]'
                    : isWrongSel
                      ? 'bg-[#fef2f2] border-[#dc2626]/30 text-[#991b1b]'
                      : selected
                        ? 'bg-[#1f644e]/5 border-[#1f644e] text-[#1e3a34] ring-1 ring-[#1f644e]/10 shadow-sm'
                        : 'bg-white/50 border-[#e5e3d8]/60 text-[#1e3a34] hover:bg-white hover:border-[#1f644e]/40'
                } ${submitted && !selected && !isCorrectOpt ? 'opacity-60 grayscale-[0.2]' : ''}`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    selected
                      ? 'border-[#1f644e] bg-[#1f644e]'
                      : 'border-[#e5e3d8] group-hover:border-[#1f644e]/40'
                  } ${submitted ? 'hidden' : ''}`}
                >
                  {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <input
                  type={type === 'multi_select' ? 'checkbox' : 'radio'}
                  checked={selected}
                  disabled={submitted}
                  onChange={() => {
                    if (type === 'multi_select') {
                      const cur = Array.isArray(answer) ? answer : [];
                      onChange(
                        cur.includes(optKey) ? cur.filter((v) => v !== optKey) : [...cur, optKey]
                      );
                    } else {
                      onChange(optKey);
                    }
                  }}
                  className="sr-only"
                />
                <span className="flex-1">
                  <MarkdownRenderer content={opt || ''} isInline />
                </span>
                {isCorrectOpt && <CheckCircle className="w-4 h-4 text-[#1f644e]" />}
                {isWrongSel && <XCircle className="w-4 h-4 text-[#dc2626]" />}
              </label>
            );
          })}
        </div>
      )}

      {type === 'short_answer' && (
        <div className="space-y-4">
          <textarea
            rows={4}
            value={answer || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={submitted}
            placeholder="Type your response here..."
            className="w-full text-sm text-[#1e3a34] bg-white/60 backdrop-blur-sm border border-[#e5e3d8]/60 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:border-[#1f644e] focus:bg-white leading-relaxed disabled:opacity-70 transition-all shadow-inner"
          />
          {submitted && correctAnswer && (
            <div className="bg-[#f0f4f8]/60 backdrop-blur-sm border border-[#d1dce5]/60 rounded-2xl px-5 py-4 text-sm text-[#2d3748]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4a5568]" />
                <span className="font-bold uppercase tracking-wider text-[10px] opacity-70">
                  Reference Answer
                </span>
              </div>
              <p className="leading-relaxed">{stripFootnotes(correctAnswer)}</p>
            </div>
          )}
        </div>
      )}

      {submitted && explanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#f0f5f2]/80 backdrop-blur-sm border border-[#1f644e]/10 rounded-2xl px-5 py-4 text-sm text-[#1e3a34]"
        >
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-[#1f644e]" />
            <span className="font-bold text-[#1f644e] uppercase tracking-wider text-[10px]">
              Explanation
            </span>
          </div>
          <p className="leading-relaxed opacity-90">{stripFootnotes(explanation)}</p>
        </motion.div>
      )}
    </div>
  );
}

function getSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const QuizPlayer = memo(function QuizPlayer({ questions, title }) {
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  const handleAnswer = useCallback((index, value) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  }, []);

  const handleSubmit = () => {
    let earned = 0;
    let total = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const pts = q.points ?? 1;
      total += pts;
      if (isCorrect(q, answers[i]) === true) earned += pts;
    }
    setScore({ earned, total });
    setSubmitted(true);
    setCurrent(0);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setCurrent(0);
  };

  if (!questions || questions.length === 0) return null;

  const isLast = current === questions.length - 1;
  const isFirst = current === 0;
  const currentQ = questions[current];
  const currentAns = answers[current];
  const answered = hasAnswer(currentQ, currentAns);
  const allAnswered = questions.every((q, i) => hasAnswer(q, answers[i]));
  const percentage = score ? Math.round((score.earned / score.total) * 100) : 0;
  const passed = percentage >= 70;

  const displayTitle = title || 'Knowledge Check';

  return (
    <section className="mt-0 mb-6 overflow-visible px-0.5">
      {/* Block Header */}
      <div className="mb-8 pl-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-3">
          <h3
            id={getSlug(displayTitle)}
            data-heading={displayTitle}
            className="text-xl font-bold text-[#1e3a34] tracking-tight sm:text-2xl scroll-mt-24"
          >
            {displayTitle}
          </h3>
          <div className="flex gap-1.5">
            {questions.map((q, i) => {
              const done = hasAnswer(q, answers[i]);
              return (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === current
                      ? 'bg-[#1f644e] w-8'
                      : done
                        ? 'bg-[#1f644e]/30 w-4'
                        : 'bg-[#e5e3d8] w-4'
                  }`}
                />
              );
            })}
          </div>
        </div>
        {!submitted && (
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7c8e88] pb-1">
            Question {current + 1} of {questions.length}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-[#e5e3d8]/60 bg-[#fcfbf5]/50 backdrop-blur-sm p-1 overflow-hidden">
        <div className="bg-white/40 rounded-[1.4rem] p-4 sm:p-5">
          {/* Main Question View */}
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <QuestionView
                  index={current}
                  total={questions.length}
                  question={currentQ}
                  answer={currentAns}
                  submitted={submitted}
                  onChange={(val) => handleAnswer(current, val)}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Results & Actions (Outside the box) */}
      <div className="mt-6 space-y-4">
        {/* Score banner */}
        <AnimatePresence mode="wait">
          {submitted && score && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`flex items-center gap-4 px-6 py-5 rounded-2xl border overflow-hidden backdrop-blur-sm ${
                passed
                  ? 'bg-[#f0f5f2]/80 border-[#1f644e]/10 text-[#1e3a34]'
                  : 'bg-[#fffbeb]/80 border-[#fef3c7]/60 text-[#92400e]'
              }`}
            >
              <div className={`p-3 rounded-xl ${passed ? 'bg-[#1f644e]/10' : 'bg-[#d97706]/10'}`}>
                <Trophy className={`w-6 h-6 ${passed ? 'text-[#1f644e]' : 'text-[#d97706]'}`} />
              </div>
              <div className="flex-1">
                <p className="font-serif text-xl font-bold">
                  {score.earned} / {score.total}{' '}
                  <span className="text-sm font-sans opacity-60">Points ({percentage}%)</span>
                </p>
                <p className="text-xs font-medium opacity-80 mt-0.5">
                  {passed
                    ? 'Exceptional! You have a solid grasp of this material.'
                    : 'A quick review would help—feel free to try again.'}
                </p>
              </div>
              <button
                onClick={handleReset}
                title="Retake Quiz"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/40 hover:bg-white/80 text-[#1f644e] border border-[#1f644e]/10 transition-all cursor-pointer group active:scale-95"
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-[-60deg] transition-transform duration-500" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrent((c) => c - 1)}
            disabled={isFirst}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border border-[#e5e3d8]/60 text-[#7c8e88] hover:bg-white hover:text-[#1f644e] disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer text-sm font-bold bg-[#fcfbf5]/40 backdrop-blur-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {!submitted && (
            <button
              onClick={isLast ? handleSubmit : () => setCurrent((c) => c + 1)}
              disabled={isLast ? !allAnswered : !answered}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#1f644e] text-white text-sm font-bold hover:bg-[#17503e] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            >
              {isLast ? 'Finish' : 'Next'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          )}

          {submitted && (
            <button
              onClick={isLast ? handleReset : () => setCurrent((c) => c + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#1f644e] text-white text-sm font-bold hover:bg-[#17503e] transition-all cursor-pointer shadow-sm"
            >
              {isLast ? 'Retake Assessment' : 'Next'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </section>
  );
});
