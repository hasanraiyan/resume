'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, MessageSquare, Send } from 'lucide-react';
import BottomSheet from './BottomSheet';

export function McqQuestionBlock({
  block,
  onInteract,
  answeredBlockIds = new Set(),
  markBlockAsAnswered,
}) {
  const data = block.data || {};
  const isGroup = Array.isArray(data.questions) && data.questions.length > 0;
  const questions = isGroup ? data.questions : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sheetOpen] = useState(true);

  // If already answered externally (e.g. from context after tab switch),
  // don't render the card again.
  const blockId = data.id || data.groupId || data.questionId;
  if (blockId && answeredBlockIds.has(blockId)) return null;

  if (submitted) return null;

  const currentQuestion = isGroup ? questions[activeIndex] : null;
  const currentAnswer = isGroup
    ? answers[currentQuestion?.id] || { selected: [], otherText: '' }
    : answers['_single'] || { selected: [], otherText: '' };

  const currentOptions = isGroup ? currentQuestion?.options || [] : data.options || [];
  const currentAllowFreeText = isGroup
    ? currentQuestion?.allowFreeText !== false
    : data.allowFreeText !== false;
  const isMultiple = isGroup
    ? currentQuestion?.selectionMode === 'multiple'
    : data.selectionMode === 'multiple';

  if (!isGroup) {
    if (!data.question || !Array.isArray(data.options) || data.options.length === 0) {
      return null;
    }
  } else {
    if (questions.length === 0 || !currentQuestion) return null;
  }

  const answerKey = isGroup ? currentQuestion.id : '_single';

  const updateCurrentAnswer = (updater) => {
    setAnswers((prev) => ({
      ...prev,
      [answerKey]: updater(prev[answerKey] || { selected: [], otherText: '' }),
    }));
  };

  const toggleOption = (optionId) => {
    updateCurrentAnswer((prev) => {
      const alreadySelected = prev.selected.includes(optionId);
      if (isMultiple) {
        return {
          ...prev,
          selected: alreadySelected
            ? prev.selected.filter((id) => id !== optionId)
            : [...prev.selected, optionId],
        };
      }
      return {
        ...prev,
        selected: alreadySelected ? [] : [optionId],
      };
    });
  };

  const handleOtherTextChange = (e) => {
    const text = e.target.value;
    updateCurrentAnswer((prev) => {
      const next = { ...prev, otherText: text };
      const hasOther = next.selected.includes('other');
      const shouldHaveOther = text.trim().length > 0;

      if (shouldHaveOther && !hasOther) {
        next.selected = isMultiple ? [...next.selected, 'other'] : ['other'];
      }
      if (!shouldHaveOther && hasOther) {
        next.selected = next.selected.filter((id) => id !== 'other');
      }

      return next;
    });
  };

  const handlePrevious = () => {
    setActiveIndex((idx) => Math.max(0, idx - 1));
  };

  const handleNext = () => {
    setActiveIndex((idx) => Math.min(questions.length - 1, idx + 1));
  };

  const hasSelection =
    currentAnswer.selected.length > 0 || currentAnswer.otherText.trim().length > 0;

  const handleSubmitSingle = () => {
    const answer = answers['_single'];
    if (!answer) return;

    const selectedOptionIds = answer.selected || [];
    const otherText = (answer.otherText || '').trim();
    if (selectedOptionIds.length === 0 && !otherText) return;

    // Mark as answered so it won't reappear on remount
    if (blockId && markBlockAsAnswered) {
      markBlockAsAnswered(blockId);
    }

    onInteract?.({
      type: 'mcq_response',
      questionId: data.id,
      selectionMode: isMultiple ? 'multiple' : 'single',
      selectedOptionIds,
      otherText: otherText || null,
    });

    setSubmitted(true);
  };

  const handleSubmitGroup = () => {
    const normalized = {};

    for (const q of questions) {
      const answer = answers[q.id];
      if (!answer) continue;

      const selected = answer.selected || [];
      const otherText = (answer.otherText || '').trim();
      if (selected.length === 0 && !otherText) continue;

      normalized[q.id] = {
        selectedOptionIds: selected,
        otherText: otherText || null,
        selectionMode: q.selectionMode === 'multiple' ? 'multiple' : 'single',
      };
    }

    if (Object.keys(normalized).length === 0) return;

    // Mark as answered so it won't reappear on remount
    if (blockId && markBlockAsAnswered) {
      markBlockAsAnswered(blockId);
    }

    onInteract?.({
      type: 'mcq_group_response',
      groupId: data.id,
      answers: normalized,
    });

    setSubmitted(true);
  };

  const isLast = activeIndex === questions.length - 1;
  const questionText = isGroup ? currentQuestion.question : data.question;

  // Progress calculation for groups
  const answeredCount = isGroup
    ? questions.filter((q) => {
        const a = answers[q.id];
        return a && (a.selected.length > 0 || (a.otherText || '').trim().length > 0);
      }).length
    : hasSelection
      ? 1
      : 0;

  const renderCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded-2xl border border-[#e0ddd4]/80 bg-gradient-to-br from-[#fafaf5] to-[#f5f5ee] p-4 shadow-[0_2px_12px_rgba(30,58,52,0.04)]"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1e3a34]/10">
          <MessageSquare className="h-3.5 w-3.5 text-[#1e3a34]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-neutral-800 leading-snug">{questionText}</p>
          {isGroup && (
            <div className="flex items-center gap-2 mt-2">
              {/* Progress dots */}
              <div className="flex gap-1">
                {questions.map((q, i) => {
                  const isAnswered =
                    answers[q.id] &&
                    (answers[q.id].selected.length > 0 ||
                      (answers[q.id].otherText || '').trim().length > 0);
                  const isActive = i === activeIndex;

                  return (
                    <div
                      key={q.id}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'w-5 bg-[#1e3a34]'
                          : isAnswered
                            ? 'w-1.5 bg-[#1f644e]'
                            : 'w-1.5 bg-neutral-300'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] font-medium text-neutral-500">
                {answeredCount}/{questions.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {currentOptions.map((opt, idx) => {
            const isOther = opt.id === 'other';
            const checked = currentAnswer.selected.includes(opt.id);

            return (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04, ease: 'easeOut' }}
              >
                <button
                  type="button"
                  onClick={() => toggleOption(opt.id)}
                  className={`w-full rounded-xl border-2 px-3.5 py-3 flex items-start gap-3 transition-all duration-200 text-left cursor-pointer ${
                    checked
                      ? 'border-[#1f644e] bg-[#1f644e]/[0.06] shadow-[0_2px_8px_rgba(31,100,78,0.1)]'
                      : 'border-neutral-200/70 bg-white hover:border-neutral-300 hover:bg-neutral-50/80'
                  }`}
                >
                  {/* Radio/Checkbox indicator */}
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      checked ? 'border-[#1f644e] bg-[#1f644e]' : 'border-neutral-300 bg-white'
                    }`}
                  >
                    {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[13px] font-semibold transition-colors duration-200 ${
                        checked ? 'text-[#1e3a34]' : 'text-neutral-800'
                      }`}
                    >
                      {opt.label}
                    </p>
                    {opt.description && (
                      <p className="mt-0.5 text-[11px] text-neutral-500 line-clamp-2">
                        {opt.description}
                      </p>
                    )}
                    {isOther && currentAllowFreeText && (
                      <div className="mt-2 relative">
                        <textarea
                          rows={2}
                          className="w-full resize-none rounded-lg border border-neutral-200 bg-white/80 px-3 py-2 text-[12px] text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#1f644e]/30 focus:border-[#1f644e] transition-all"
                          placeholder="Share your own preference..."
                          value={currentAnswer.otherText}
                          onChange={handleOtherTextChange}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer actions */}
      <div className="mt-4 flex items-center gap-2">
        {isGroup ? (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={activeIndex === 0}
              className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-neutral-50 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <div className="flex-1" />

            <button
              type="button"
              onClick={isLast ? handleSubmitGroup : handleNext}
              disabled={!hasSelection}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 cursor-pointer ${
                hasSelection
                  ? 'bg-[#1e3a34] hover:bg-[#152924] shadow-[0_2px_8px_rgba(30,58,52,0.2)]'
                  : 'bg-neutral-300 cursor-not-allowed'
              }`}
            >
              {isLast ? (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Submit all
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </>
        ) : (
          <div className="ml-auto">
            <button
              type="button"
              onClick={handleSubmitSingle}
              disabled={!hasSelection}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 cursor-pointer ${
                hasSelection
                  ? 'bg-[#1e3a34] hover:bg-[#152924] shadow-[0_2px_8px_rgba(30,58,52,0.2)]'
                  : 'bg-neutral-300 cursor-not-allowed'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              Submit
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <>
      <div className="hidden sm:block">{renderCard()}</div>
      <div className="sm:hidden">
        <BottomSheet open={sheetOpen && !submitted} onClose={() => {}} mobileOnly>
          {renderCard()}
        </BottomSheet>
      </div>
    </>
  );
}
