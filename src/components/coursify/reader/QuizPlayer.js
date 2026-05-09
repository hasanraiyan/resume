'use client';

import { memo, useState, useCallback } from 'react';
import { CheckCircle, XCircle, RotateCcw, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';

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

function QuestionView({ index, total, question, answer, submitted, onChange }) {
  const { type, question: text, options, correctAnswer, explanation, points } = question;
  const result = submitted ? isCorrect(question, answer) : null;
  const displayOptions =
    type === 'true_false' ? ['True', 'False'] : Array.isArray(options) ? options : [];

  return (
    <div className="space-y-5">
      {/* Question text */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
          <span>Question {index + 1}</span>
          {points > 1 && <span className="text-[#b5c4be]">· {points} pts</span>}
          <span className="ml-auto">
            {type === 'multiple_choice' && 'Single choice'}
            {type === 'true_false' && 'True / False'}
            {type === 'multi_select' && 'Select all that apply'}
            {type === 'short_answer' && 'Short answer'}
          </span>
        </div>
        <p className="text-[#1e3a34] font-semibold leading-snug text-base">{text}</p>
      </div>

      {/* Options */}
      {(type === 'multiple_choice' || type === 'true_false') && (
        <div className="space-y-2">
          {displayOptions.map((opt, i) => {
            const optKey = String(i);
            const selected = String(answer) === optKey;
            const isCorrectOpt = submitted && String(correctAnswer) === optKey;
            const isWrongSel = submitted && selected && !isCorrectOpt;
            return (
              <label
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer text-sm transition-all ${
                  isCorrectOpt
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                    : isWrongSel
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : selected
                        ? 'bg-[#f0f5f2] border-[#1f644e] text-[#1e3a34] font-semibold'
                        : 'bg-white border-[#e5e3d8] text-[#1e3a34] hover:border-[#a8c4b9] hover:bg-[#f7faf8]'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${index}`}
                  value={optKey}
                  checked={selected}
                  disabled={submitted}
                  onChange={() => onChange(optKey)}
                  className="accent-[#1f644e] shrink-0"
                />
                {opt}
                {isCorrectOpt && <CheckCircle className="w-4 h-4 ml-auto text-emerald-500" />}
                {isWrongSel && <XCircle className="w-4 h-4 ml-auto text-red-400" />}
              </label>
            );
          })}
        </div>
      )}

      {type === 'multi_select' && (
        <div className="space-y-2">
          {displayOptions.map((opt, i) => {
            const optKey = String(i);
            const selected = Array.isArray(answer) && answer.includes(optKey);
            const isCorrectOpt = submitted && (correctAnswer || []).map(String).includes(optKey);
            const isWrongSel = submitted && selected && !isCorrectOpt;
            return (
              <label
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer text-sm transition-all ${
                  isCorrectOpt
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                    : isWrongSel
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : selected
                        ? 'bg-[#f0f5f2] border-[#1f644e] text-[#1e3a34] font-semibold'
                        : 'bg-white border-[#e5e3d8] text-[#1e3a34] hover:border-[#a8c4b9] hover:bg-[#f7faf8]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={submitted}
                  onChange={() => {
                    const cur = Array.isArray(answer) ? answer : [];
                    onChange(
                      cur.includes(optKey) ? cur.filter((v) => v !== optKey) : [...cur, optKey]
                    );
                  }}
                  className="accent-[#1f644e] shrink-0"
                />
                {opt}
                {isCorrectOpt && <CheckCircle className="w-4 h-4 ml-auto text-emerald-500" />}
                {isWrongSel && <XCircle className="w-4 h-4 ml-auto text-red-400" />}
              </label>
            );
          })}
        </div>
      )}

      {type === 'short_answer' && (
        <div className="space-y-3">
          <textarea
            rows={3}
            value={answer || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={submitted}
            placeholder="Type your answer…"
            className="w-full text-sm text-[#1e3a34] bg-white border border-[#e5e3d8] rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-[#1f644e] leading-relaxed disabled:opacity-70 transition-colors"
          />
          {submitted && correctAnswer && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
              <span className="font-bold block mb-0.5">Reference answer</span>
              {correctAnswer}
            </div>
          )}
        </div>
      )}

      {submitted && explanation && (
        <div className="bg-[#f7faf8] border border-[#d4e6db] rounded-xl px-4 py-3 text-sm text-[#1e3a34] leading-relaxed">
          <span className="font-bold text-[#1f644e]">Explanation · </span>
          {explanation}
        </div>
      )}
    </div>
  );
}

export const QuizPlayer = memo(function QuizPlayer({ questions }) {
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

  return (
    <div className="mt-10 border-t border-[#e5e3d8] pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
          Quiz · {questions.length} question{questions.length !== 1 ? 's' : ''}
        </h3>
        {submitted && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-bold text-[#7c8e88] hover:text-[#1f644e] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try Again
          </button>
        )}
      </div>

      {/* Score banner */}
      {submitted && score && (
        <div
          className={`flex items-center gap-3 px-5 py-4 rounded-xl border mb-6 ${
            passed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <Trophy className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold text-sm">
              {score.earned} / {score.total} points · {percentage}%
            </p>
            <p className="text-xs opacity-80 mt-0.5">
              {passed ? 'Great work! You passed.' : 'Review the explanations and try again.'}
            </p>
          </div>
        </div>
      )}

      {/* Dot navigator */}
      <div className="mb-6">
        <div className="flex gap-1.5 flex-wrap">
          {questions.map((q, i) => {
            const ans = answers[i];
            const done = hasAnswer(q, ans);
            const res = submitted ? isCorrect(q, ans) : null;
            return (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                title={`Question ${i + 1}`}
                className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                  i === current ? 'ring-2 ring-offset-1 ring-[#1f644e] scale-110' : ''
                } ${
                  res === true
                    ? 'bg-emerald-400 text-white'
                    : res === false
                      ? 'bg-red-400 text-white'
                      : res === null && submitted && done
                        ? 'bg-blue-300 text-white'
                        : done
                          ? 'bg-[#1f644e] text-white'
                          : 'bg-[#e5e3d8] text-[#7c8e88]'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question */}
      <div className="bg-white border border-[#e5e3d8] rounded-2xl p-6 mb-5 min-h-[240px]">
        <QuestionView
          key={current}
          index={current}
          total={questions.length}
          question={currentQ}
          answer={currentAns}
          submitted={submitted}
          onChange={(val) => handleAnswer(current, val)}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrent((c) => c - 1)}
          disabled={isFirst}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#e5e3d8] text-sm font-semibold text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>

        {!submitted && !isLast && (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            disabled={!answered}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1f644e] text-white text-sm font-bold hover:bg-[#17503e] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {!submitted && isLast && (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="flex-1 py-2.5 rounded-xl bg-[#1f644e] text-white text-sm font-bold hover:bg-[#17503e] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Submit Quiz
          </button>
        )}

        {submitted && !isLast && (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1f644e] text-white text-sm font-bold hover:bg-[#17503e] transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {submitted && isLast && (
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#e5e3d8] text-sm font-bold text-[#1f644e] hover:bg-[#f0f5f2] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
});
