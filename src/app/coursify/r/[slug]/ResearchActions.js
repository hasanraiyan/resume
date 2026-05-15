'use client';

import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResearchActions({ research }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(research.content);
      setCopied(true);
      toast.success('Content copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy content.');
    }
  };

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

  return (
    <>
      <button
        onClick={handleCopy}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-full transition-all shrink-0 ${
          copied
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'text-[#1f644e] border border-[#d4e6de] hover:bg-[#f0f5f2]'
        }`}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
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
