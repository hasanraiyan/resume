'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import getAnalytics from '@/lib/analytics';

export function SectionFeedback({ courseSlug, sectionId }) {
  const [feedback, setFeedback] = useState(null); // 'like' | 'dislike' | null
  const [submitted, setSubmitted] = useState(false);

  // Reset when section changes
  useEffect(() => {
    setFeedback(null);
    setSubmitted(false);
  }, [sectionId]);

  const handleFeedback = (type) => {
    if (submitted) return;

    setFeedback(type);
    setSubmitted(true);

    const analytics = getAnalytics();
    analytics.trackCustomEvent('section_feedback', window.location.pathname, {
      courseSlug,
      sectionId,
      type,
      immediate: true
    });
  };

  if (submitted) {
    return (
      <div className="mt-12 p-6 bg-[#f0f5f2] rounded-2xl border border-[#1f644e]/10 flex flex-col items-center text-center">
        <div className="w-10 h-10 bg-[#1f644e] rounded-full flex items-center justify-center mb-3">
          <Check className="w-5 h-5 text-white" />
        </div>
        <h4 className="font-bold text-[#1e3a34]">Thanks for your feedback!</h4>
        <p className="text-sm text-[#7c8e88]">Your input helps us improve this course for everyone.</p>
      </div>
    );
  }

  return (
    <div className="mt-12 pt-8 border-t border-[#e5e3d8]">
      <div className="flex flex-col items-center text-center mb-6">
        <h4 className="font-bold text-[#1e3a34] mb-1">Was this section helpful?</h4>
        <p className="text-sm text-[#7c8e88]">Help us improve our content with a quick rating.</p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => handleFeedback('like')}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-[#e5e3d8] rounded-xl hover:border-[#1f644e] hover:bg-[#f0f5f2] hover:text-[#1f644e] transition-all group"
        >
          <ThumbsUp className="w-5 h-5 text-[#7c8e88] group-hover:text-[#1f644e]" />
          <span className="font-bold text-sm">Yes, helpful</span>
        </button>

        <button
          onClick={() => handleFeedback('dislike')}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-[#e5e3d8] rounded-xl hover:border-[#c94c4c] hover:bg-red-50 hover:text-[#c94c4c] transition-all group"
        >
          <ThumbsDown className="w-5 h-5 text-[#7c8e88] group-hover:text-[#c94c4c]" />
          <span className="font-bold text-sm">Not really</span>
        </button>
      </div>
    </div>
  );
}
