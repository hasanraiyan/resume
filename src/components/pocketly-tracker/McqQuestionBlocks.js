'use client';

import { useState } from 'react';
import BottomSheet from './BottomSheet';

export function McqQuestionBlock({ block, onInteract }) {
  const data = block.data || {};
  const isGroup = Array.isArray(data.questions) && data.questions.length > 0;
  const questions = isGroup ? data.questions : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sheetOpen] = useState(true);

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

  const handleSubmitSingle = () => {
    const answer = answers['_single'];
    if (!answer) return;

    const selectedOptionIds = answer.selected || [];
    const otherText = (answer.otherText || '').trim();
    if (selectedOptionIds.length === 0 && !otherText) return;

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

    onInteract?.({
      type: 'mcq_group_response',
      groupId: data.id,
      answers: normalized,
    });

    setSubmitted(true);
  };

  const isLast = activeIndex === questions.length - 1;
  const questionText = isGroup ? currentQuestion.question : data.question;

  const renderCard = () => (
    <div className="rounded-2xl border border-neutral-200/70 bg-[#f8f8f4] p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-neutral-800 flex-1 mr-2">{questionText}</p>
        {isGroup && (
          <p className="text-[10px] font-medium text-neutral-500 shrink-0">
            {activeIndex + 1} / {questions.length}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {currentOptions.map((opt) => {
          const isOther = opt.id === 'other';
          const checked = currentAnswer.selected.includes(opt.id);

          return (
            <div
              key={opt.id}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 flex items-start gap-2"
            >
              <input
                type={isMultiple ? 'checkbox' : 'radio'}
                className="mt-1 h-3.5 w-3.5 cursor-pointer"
                checked={checked}
                onChange={() => toggleOption(opt.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-900 truncate">{opt.label}</p>
                {opt.description && (
                  <p className="mt-0.5 text-[11px] text-neutral-500 line-clamp-2">
                    {opt.description}
                  </p>
                )}
                {isOther && currentAllowFreeText && (
                  <textarea
                    rows={2}
                    className="mt-1 w-full resize-none rounded-lg border border-neutral-200 px-2 py-1 text-[11px] text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#1f644e]"
                    placeholder="Add a short note..."
                    value={currentAnswer.otherText}
                    onChange={handleOtherTextChange}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        {isGroup ? (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={activeIndex === 0}
              className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-neutral-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={isLast ? handleSubmitGroup : handleNext}
              className="rounded-full bg-[#1e3a34] px-3 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-[#152924]"
            >
              {isLast ? 'Submit answers' : 'Next'}
            </button>
          </>
        ) : (
          <div className="ml-auto">
            <button
              type="button"
              onClick={handleSubmitSingle}
              className="rounded-full bg-[#1e3a34] px-3 py-2 text-xs font-semibold text-white cursor-pointer hover:bg-[#152924]"
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
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
