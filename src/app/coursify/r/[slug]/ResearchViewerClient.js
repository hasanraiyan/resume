import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  Share2,
  Search,
  Plus,
  List,
} from 'lucide-react';
import { CoursifyBlockRenderer } from '@/components/coursify/reader/CoursifyBlockRenderer';
import { BalanceBadge, useBalance } from '@/components/coursify/BalanceBadge';
import { useTableOfContents } from '@/hooks/coursify/useTableOfContents';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ResearchViewerClient({ research }) {
  const [copied, setCopied] = useState(false);
  const { balance, isLoading } = useBalance();

  const contentRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Initialize TOC hook
  const { headings, activeHeading } = useTableOfContents(research.content, contentRef, {
    current: typeof window !== 'undefined' ? window : null,
  });

  // Since we're using window for scroll, the hook needs window
  // But wait, the hook expects a ref. I'll use a local scroll container if possible
  // or just use window.

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
    <div className="min-h-screen bg-[#fcfbf5] text-[#1e3a34]">
      {/* Exact Header from Home Page */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e5e3d8]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/coursify" className="flex items-center gap-2 shrink-0 group">
            <img
              src="/images/apps/coursify.png"
              alt="Coursify"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-[family-name:var(--font-logo)] text-xl sm:text-2xl text-[#1f644e]">
              Coursify
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/coursify"
              className="p-2 text-[#7c8e88] hover:text-[#1f644e] transition-colors rounded-full hover:bg-[#f0f5f2]"
              title="Search new topic"
            >
              <Search className="w-5 h-5" />
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <BalanceBadge balance={balance} loading={isLoading} />
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1f644e] text-white rounded-full text-xs font-bold hover:bg-[#184d3c] transition-all shadow-md shadow-[#1f644e]/10">
                <Plus className="w-4 h-4" />
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12 items-start">
          {/* Sidebar TOC - Sticky */}
          <aside className="hidden lg:block sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4 scrollbar-hide">
            <div className="flex items-center gap-2 text-[#1f644e] mb-6">
              <List className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                Table of Contents
              </span>
            </div>

            <nav className="space-y-1 border-l border-[#e5e3d8]">
              {headings.map((heading, i) => (
                <a
                  key={i}
                  href={`#${heading.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById(heading.slug)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={cn(
                    'block py-2 pl-4 text-xs font-bold transition-all border-l-2 -ml-[2px]',
                    activeHeading === heading.text
                      ? 'text-[#1f644e] border-[#1f644e] translate-x-1'
                      : 'text-[#7c8e88] border-transparent hover:text-[#1f644e] hover:border-[#1f644e]/30'
                  )}
                  style={{ paddingLeft: `${(heading.level - 1) * 12 + 16}px` }}
                >
                  {heading.text}
                </a>
              ))}
            </nav>

            <div className="mt-12 p-4 bg-[#f0f5f2] rounded-2xl">
              <p className="text-[10px] font-bold text-[#1f644e] uppercase tracking-widest mb-2">
                Pro Tip
              </p>
              <p className="text-[10px] text-[#7c8e88] leading-relaxed">
                Use the sidebar to quickly navigate through complex research topics.
              </p>
            </div>
          </aside>

          {/* Main Result Column */}
          <div className="w-full max-w-3xl">
            {/* Result Navigation & Actions */}
            <div className="flex items-center gap-3 mb-8">
              <Link
                href="/coursify"
                className="flex items-center gap-1.5 text-xs font-bold text-[#7c8e88] hover:text-[#1f644e] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#b5c4be]" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-[#1f644e] shrink-0" />
                <span className="text-xs font-bold text-[#1e3a34] truncate">{research.topic}</span>
              </div>
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
            </div>

            {/* Research Title */}
            <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1e3a34] tracking-tight leading-tight">
                {research.title}
              </h1>
              <div className="flex items-center gap-4 mt-3 text-[#7c8e88]">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1f644e]" />
                  Verified Sources
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest">
                  {new Date(research.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {/* Rendered content */}
            <div ref={contentRef} className="animate-in fade-in duration-1000">
              <CoursifyBlockRenderer content={research.content} />
            </div>

            {/* Attribution Footer */}
            <div className="mt-20 pt-10 border-t border-[#e5e3d8] flex flex-col items-center text-center">
              <p className="text-xs text-[#7c8e88] font-medium max-w-sm mb-6">
                This research was autonomously generated by the Coursify AI Engine. Information is
                gathered from verified web and video sources.
              </p>
              <Link
                href="/coursify"
                className="flex items-center gap-2.5 group transition-opacity hover:opacity-80"
              >
                <img
                  src="/images/apps/coursify.png"
                  alt="Coursify"
                  className="h-6 w-6 rounded-lg object-contain grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7c8e88] group-hover:text-[#1f644e] transition-colors">
                  Research more with Coursify
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
