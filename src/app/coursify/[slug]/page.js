'use client';

import { useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Pacifico, Nunito, Lora } from 'next/font/google';
import { ExternalLink, BookOpen } from 'lucide-react';

import { useCourseReader } from '@/hooks/coursify/useCourseReader';
import { useTableOfContents } from '@/hooks/coursify/useTableOfContents';
import { useReaderUI } from '@/hooks/coursify/useReaderUI';

import ReaderHeader from '@/components/coursify/reader/ReaderHeader';
import ReaderSidebar from '@/components/coursify/reader/ReaderSidebar';
import CourseOverview from '@/components/coursify/reader/CourseOverview';
import MarkdownRenderer from '@/components/coursify/reader/MarkdownRenderer';
import TableOfContents from '@/components/coursify/reader/TableOfContents';
import ReaderNavigation from '@/components/coursify/reader/ReaderNavigation';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-logo',
  display: 'swap',
});

const nunito = Nunito({
  weight: ['400', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const lora = Lora({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

const RESOURCE_ICONS = {
  video: '▶',
  article: '📄',
  doc: '📘',
  other: '🔗',
};

export default function PublicCourseReaderPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const contentRef = useRef(null);

  const {
    course,
    sections,
    modules,
    activeSection,
    showOverview,
    visited,
    isLoading,
    error,
    fetchCourse,
    navigateTo,
    showOverviewPage,
  } = useCourseReader(slug, true);

  const {
    sidebarOpen,
    tocOpen,
    expandedModules,
    setExpandedModules,
    toggleSidebar,
    toggleToc,
    toggleModule,
  } = useReaderUI(modules);

  const currentSection = sections.find((s) => s._id === activeSection);
  const { headings, activeHeading } = useTableOfContents(currentSection?.content, contentRef);

  useEffect(() => {
    fetchCourse().then((data) => {
      if (data?.modules) {
        setExpandedModules(new Set(data.modules.map((m) => m._id)));
      }
    });
  }, [fetchCourse, setExpandedModules]);

  // Expand module when section changes
  useEffect(() => {
    if (activeSection) {
      const section = sections.find((s) => s._id === activeSection);
      if (section?.moduleId) {
        setExpandedModules((prev) => {
          if (prev.has(section.moduleId)) return prev;
          const next = new Set(prev);
          next.add(section.moduleId);
          return next;
        });
      }
    }
  }, [activeSection, sections, setExpandedModules]);

  // Expose current section context to ChatbotWidget via window global
  useEffect(() => {
    if (!activeSection || !sections.length) return;
    const section = sections.find((s) => s._id === activeSection);
    if (section) {
      window.__coursifyCtx = {
        sectionId: section._id,
        sectionTitle: section.title,
        sectionSummary: section.summary || '',
      };
    }
    return () => {
      delete window.__coursifyCtx;
    };
  }, [activeSection, sections]);

  if (isLoading) {
    return (
      <div
        className={`h-screen bg-[#fcfbf5] ${pacifico.variable} ${nunito.variable} font-[family-name:var(--font-sans)]`}
      >
        <div className="h-14 border-b border-[#e5e3d8] bg-white animate-pulse" />
        <div className="flex">
          <div className="w-72 min-h-screen border-r border-[#e5e3d8] bg-white hidden lg:block animate-pulse" />
          <div className="flex-1 p-6 lg:p-10 space-y-4 max-w-3xl">
            <div className="h-5 bg-[#e5e3d8] rounded w-1/3 animate-pulse" />
            <div className="h-7 bg-[#e5e3d8] rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-[#e5e3d8] rounded w-full animate-pulse" />
            <div className="h-4 bg-[#e5e3d8] rounded w-3/4 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div
        className={`min-h-screen bg-[#fcfbf5] ${pacifico.variable} ${nunito.variable} font-[family-name:var(--font-sans)] flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="h-16 w-16 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <BookOpen className="w-8 h-8 text-[#1f644e]" />
          </div>
          <h2 className="font-bold text-[#1e3a34] mb-2">Course not found</h2>
          <p className="text-sm text-[#7c8e88] mb-6">
            This course may not be published yet or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/coursify')}
            className="text-[#1f644e] font-bold text-sm hover:underline"
          >
            Browse all courses
          </button>
        </div>
      </div>
    );
  }

  const handleNavigate = (id) => {
    navigateTo(id);
    toggleSidebar(false);
  };

  const handleShowOverview = () => {
    showOverviewPage();
    toggleSidebar(false);
  };

  return (
    <div
      className={`h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex flex-col ${pacifico.variable} ${nunito.variable} ${lora.variable}`}
    >
      <ReaderHeader
        course={course}
        showOverview={showOverview}
        onBack={() => router.push('/coursify')}
        onToggleSidebar={toggleSidebar}
      />

      <div className="flex flex-1 min-h-0">
        <ReaderSidebar
          course={course}
          sections={sections}
          modules={modules}
          activeSection={activeSection}
          showOverview={showOverview}
          visited={visited}
          sidebarOpen={sidebarOpen}
          expandedModules={expandedModules}
          onToggleSidebar={toggleSidebar}
          onNavigate={handleNavigate}
          onShowOverview={handleShowOverview}
          onToggleModule={toggleModule}
        />

        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="flex min-h-0">
            <article className="flex-1 max-w-3xl mx-auto px-4 lg:px-10 py-8" ref={contentRef}>
              {!currentSection && !showOverview ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-14 w-14 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4">
                    <BookOpen className="w-7 h-7 text-[#1f644e]" />
                  </div>
                  <h3 className="font-bold text-[#1e3a34] mb-2">No sections yet</h3>
                  <p className="text-sm text-[#7c8e88]">Check back soon — content is on the way.</p>
                </div>
              ) : showOverview ? (
                <CourseOverview
                  course={course}
                  sections={sections}
                  modules={modules}
                  onNavigate={handleNavigate}
                />
              ) : (
                <>
                  <MarkdownRenderer content={currentSection.content} />

                  {/* Resources */}
                  {currentSection.resources?.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-[#e5e3d8]">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-3">
                        Resources
                      </h3>
                      <ul className="space-y-2">
                        {currentSection.resources.map((r, i) => (
                          <li key={i}>
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-[#e5e3d8] hover:border-[#1f644e]/40 hover:bg-[#f0f5f2] transition-colors group"
                            >
                              <span className="text-base shrink-0">
                                {RESOURCE_ICONS[r.type] || RESOURCE_ICONS.other}
                              </span>
                              <span className="text-sm font-bold text-[#1e3a34] flex-1 truncate group-hover:text-[#1f644e] transition-colors">
                                {r.title}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-[#7c8e88] shrink-0" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <ReaderNavigation
                    sections={sections}
                    activeSection={activeSection}
                    onNavigate={handleNavigate}
                  />
                </>
              )}
            </article>

            <TableOfContents
              headings={headings}
              activeHeading={activeHeading}
              tocOpen={tocOpen}
              onToggleToc={toggleToc}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
