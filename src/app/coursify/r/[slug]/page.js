import { notFound, redirect } from 'next/navigation';
import dbConnect from '@/lib/dbConnect';
import CoursifyResearch from '@/models/CoursifyResearch';
import { CoursifyBlockRenderer } from '@/components/coursify/reader/CoursifyBlockRenderer';
import { MarkdownRenderer } from '@/components/coursify/reader/MarkdownRenderer';
import { Search, Plus, Sparkles, ArrowLeft } from 'lucide-react';
import { BalanceBadgeServer } from './BalanceBadgeServer';
import Link from 'next/link';
import ResearchActions from './ResearchActions';
import ResearchTOC from './ResearchTOC';
import SpeakButton from './SpeakButton';
import { getRelatedArticles } from '@/lib/coursify/related';
import { RelatedArticlesGrid } from '@/components/coursify/RelatedArticlesGrid';
import SummaryCard from '@/components/coursify/SummaryCard';
import HeaderSearch from '@/components/coursify/HeaderSearch';

// Metadata cleaning utilities
function cleanMetadataText(text) {
  if (!text) return '';
  return text
    .replace(/\$[^$]+\$/g, (match) => match.replace(/\$/g, '')) // Remove $ math blocks but keep content
    .replace(/[*_#`[\]()]/g, '') // Strip markdown formatting
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

function getSnippetFromContent(content) {
  if (!content) return '';
  const cleanedContent = content
    .replace(/##\s+\[[^\]]+\][^]*?(\n\n|$)/g, '') // Remove complex blocks like [ChartBlock]
    .replace(/##\s+.*?\n/g, '') // Remove section headers
    .replace(/```[^]*?```/g, '') // Remove code blocks
    .replace(/[*_#`[\]()]/g, '') // Strip markdown formatting
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
  return cleanedContent.slice(0, 155) + (cleanedContent.length > 155 ? '...' : '');
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  await dbConnect();
  const research = await CoursifyResearch.findOne({
    slug: slug.toLowerCase(),
    deletedAt: null,
  })
    .select('-topic')
    .lean();
  if (!research) return { title: 'Not Found | Coursify' };

  const cleanTitle = cleanMetadataText(research.title);
  const title = `${cleanTitle} | AI Research | Coursify`;

  let cleanDescription = '';
  if (research.summary) {
    cleanDescription = cleanMetadataText(research.summary);
  } else {
    cleanDescription = getSnippetFromContent(research.content);
  }
  if (!cleanDescription) {
    cleanDescription = `Read this AI-generated research article on Coursify.`;
  }

  const ogImageUrl = `${baseUrl}/api/coursify/r/${slug}/og`;
  const publishedTime = research.createdAt ? new Date(research.createdAt).toISOString() : undefined;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description: cleanDescription,
    alternates: {
      canonical: `/coursify/r/${slug.toLowerCase()}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description: cleanDescription,
      url: `/coursify/r/${slug.toLowerCase()}`,
      type: 'article',
      publishedTime,
      siteName: 'Coursify',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: cleanTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: cleanDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function SharedResearchPage({ params }) {
  const { slug } = await params;

  // Case sensitivity redirect fallback
  if (slug !== slug.toLowerCase()) {
    redirect(`/coursify/r/${slug.toLowerCase()}`);
  }

  await dbConnect();

  const research = await CoursifyResearch.findOne({
    slug: slug.toLowerCase(),
    deletedAt: null,
  })
    .select('-topic')
    .lean();
  if (!research) notFound();

  // Parse for TOC - We do this on server to pass to the client TOC component
  const content = research.content;

  // Fetch related articles with snippets
  const relatedArticles = await getRelatedArticles(slug, 3, true);

  // Generate dynamic TechArticle JSON-LD structured schema for search engines
  const cleanTitle = cleanMetadataText(research.title);
  const cleanDescription = research.summary
    ? cleanMetadataText(research.summary)
    : getSnippetFromContent(research.content) ||
      `Read this AI-generated research article on Coursify.`;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: cleanTitle,
    description: cleanDescription,
    image: `${baseUrl}/api/coursify/r/${slug}/og`,
    datePublished: research.createdAt ? new Date(research.createdAt).toISOString() : undefined,
    dateModified: research.updatedAt ? new Date(research.updatedAt).toISOString() : undefined,
    author: {
      '@type': 'Organization',
      name: 'Coursify AI',
      url: `${baseUrl}/coursify`,
    },
    publisher: {
      '@type': 'Person',
      name: 'Hasan Raiyan',
      url: baseUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/coursify/r/${slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-[#fcfbf5] text-[#1e3a34]">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SSR Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e5e3d8]">
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
            <HeaderSearch />
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
                <span className="text-xs font-bold text-[#1e3a34] truncate">
                  <MarkdownRenderer content={research.title} bare isInline />
                </span>
              </div>
              <SpeakButton content={content} />
              <ResearchActions research={JSON.parse(JSON.stringify(research))} />
            </div>

            {/* Research Title & Metadata (SSR) */}
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1e3a34] tracking-tight leading-tight">
                <MarkdownRenderer content={research.title} bare />
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
