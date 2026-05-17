'use client';

import { Share2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ResearchActions({ research }) {
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState(research.summary || null);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: research.title,
          text: `Check out this AI-generated research on ${research.topic}`,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') toast.error('Failed to share.');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link.');
      }
    }
  };

  const handleGenerateSummary = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/coursify/summary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: research.slug }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate summary');
      }

      const data = await res.json();
      setSummary(data.summary);
      toast.success(data.cached ? 'Summary loaded from cache' : 'Summary generated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {!summary && (
        <button
          onClick={handleGenerateSummary}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-[#1f644e] border border-[#d4e6de] rounded-full hover:bg-[#f0f5f2] transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'AI Summary'}
        </button>
      )}
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-[#1f644e] border border-[#d4e6de] rounded-full hover:bg-[#f0f5f2] transition-all shrink-0"
      >
        <Share2 className="w-3 h-3" />
        Share
      </button>
    </>
  );
}
