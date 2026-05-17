import { notFound } from 'next/navigation';
import dbConnect from '@/lib/dbConnect';
import CoursifyResearch from '@/models/CoursifyResearch';
import { CoursifyBlockRenderer } from '@/components/coursify/reader/CoursifyBlockRenderer';
import { Search, Plus, Sparkles, ArrowLeft } from 'lucide-react';
import { BalanceBadgeServer } from './BalanceBadgeServer';
import Link from 'next/link';
import ResearchActions from './ResearchActions';
import ResearchTOC from './ResearchTOC';
import { getRelatedArticles } from '@/lib/coursify/related';
import { RelatedArticlesGrid } from '@/components/coursify/RelatedArticlesGrid';
import SummaryCard from '@/components/coursify/SummaryCard';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  await dbConnect();
  const research = await CoursifyResearch.findOne({ slug, deletedAt: null }).lean();
  if (!research) return { title: 'Not Found | Coursify' };

  return {
    title: `${research.title} | AI Research | Coursify`,
    description: `Read this AI-generated research on ${research.topic}`,
  };
}

export default async function SharedResearchPage({ params }) {
  const { slug } = await params;
  await dbConnect();

  const research = await CoursifyResearch.findOne({ slug, deletedAt: null }).lean();
  if (!research) notFound();

  // Parse for TOC - We do this on server to pass to the client TOC component
  const content = research.content;

  // Fetch related articles with snippets
  const relatedArticles = await getRelatedArticles(slug, 3, true);

  return (
    <div className="min-h-screen bg-[#fcfbf5] text-[#1e3a34]">
      {/* SSR Header */}
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
            >
              <Search className="w-5 h-5" />
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <BalanceBadgeServer />
              <button className="flex items-center gap-2 px-4 py-2 bg-[#1f644e] text-white rounded-full text-xs font-bold hover:bg-[#184d3c] transition-all shadow-md shadow-[#1f644e]/10">
                <Plus className="w-4 h-4" />
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12 items-start">
          {/* Client-side TOC */}
          <ResearchTOC content={content} />

          {/* Main Content Area */}
          <div className="w-full max-w-3xl">
            {/* Header Actions (Client) */}
            <div className="flex items-center gap-3 mb-8">
              <Link
                href="/coursify"
                className="flex items-center gap-1.5 text-xs font-bold text-[#7c8e88] hover:text-[#1f644e] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-[#1f644e] shrink-0" />
                <span className="text-xs font-bold text-[#1e3a34] truncate">{research.title}</span>
              </div>
              <ResearchActions research={JSON.parse(JSON.stringify(research))} />
            </div>

            {/* Research Title & Metadata (SSR) */}
            <div className="mb-6">
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

            {/* Summary Card (collapsible) */}
            <SummaryCard summary={research.summary} />

            {/* Content Rendering */}
            <div id="research-content" className="animate-in fade-in duration-1000">
              <CoursifyBlockRenderer content={content} />
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <RelatedArticlesGrid articles={relatedArticles} variant="list" />
            )}

            {/* Footer (SSR) */}
            <div className="mt-20 pt-10 border-t border-[#e5e3d8] flex flex-col items-center text-center">
              <Link
                href="/coursify"
                className="flex items-center gap-2.5 group transition-opacity hover:opacity-80"
              >
                <img
                  src="/images/apps/coursify.png"
                  className="h-6 w-6 opacity-40 group-hover:opacity-100 transition-all"
                />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7c8e88] group-hover:text-[#1f644e]">
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
