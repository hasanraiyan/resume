'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Pacifico, Nunito, Lora } from 'next/font/google';
import { useTableOfContents } from '@/hooks/coursify/useTableOfContents';
import { useCourseReader } from '@/hooks/coursify/useCourseReader';
import { useReaderUI } from '@/hooks/coursify/useReaderUI';
import { ReaderHeader } from '@/components/coursify/reader/ReaderHeader';
import { ReaderSidebar } from '@/components/coursify/reader/ReaderSidebar';
import { CourseOverview } from '@/components/coursify/reader/CourseOverview';
import { MarkdownRenderer } from '@/components/coursify/reader/MarkdownRenderer';
import { TableOfContents } from '@/components/coursify/reader/TableOfContents';
import { ReaderNavigation } from '@/components/coursify/reader/ReaderNavigation';

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

export default function PublicCourseReaderPage({ params }) {
  const { slug } = use(params);
  const contentRef = useRef(null);
  const mainRef = useRef(null);

  const {
    course,
    sections,
    modules,
    activeSection,
    showOverview,
    visited,
    isLoading,
    notFound,
    navigateTo,
    showOverviewPage,
  } = useCourseReader(slug);

  const currentSection = sections.find((s) => s._id === activeSection);

  const { headings, activeHeading } = useTableOfContents(
    currentSection?.content,
    contentRef,
    mainRef
  );

  const {
    sidebarOpen,
    tocOpen,
    expandedModules,
    toggleModule,
    toggleSidebar,
    closeSidebar,
    toggleToc,
  } = useReaderUI(modules, activeSection, sections);

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

  if (notFound || !course) {
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

  return (
    <div
      className={`h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex flex-col ${pacifico.variable} ${nunito.variable} ${lora.variable}`}
    >
      <ReaderHeader course={course} showOverview={showOverview} onToggleSidebar={toggleSidebar} />

      <div className="flex flex-1 min-h-0">
        <ReaderSidebar
          course={course}
          modules={modules}
          sections={sections}
          activeSection={activeSection}
          showOverview={showOverview}
          visited={visited}
          sidebarOpen={sidebarOpen}
          expandedModules={expandedModules}
          onClose={closeSidebar}
          onShowOverview={showOverviewPage}
          onNavigateTo={navigateTo}
          onToggleModule={toggleModule}
        />

        <main ref={mainRef} className="flex-1 overflow-y-auto min-w-0">
          <div className="flex min-h-0">
            <article className="flex-1 max-w-3xl mx-auto px-4 lg:px-10 py-8" ref={contentRef}>
              {showOverview ? (
                <CourseOverview
                  course={course}
                  sections={sections}
                  modules={modules}
                  onNavigateTo={navigateTo}
                />
              ) : currentSection ? (
                <>
                  <MarkdownRenderer content={currentSection.content} />
                  <ReaderNavigation
                    sections={sections}
                    activeSection={activeSection}
                    onNavigate={navigateTo}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-14 w-14 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4">
                    <BookOpen className="w-7 h-7 text-[#1f644e]" />
                  </div>
                  <h3 className="font-bold text-[#1e3a34] mb-2">No content yet</h3>
                  <p className="text-sm text-[#7c8e88]">Check back soon — content is on the way.</p>
                </div>
              )}
            </article>

            <TableOfContents
              headings={headings}
              activeHeading={activeHeading}
              isOpen={tocOpen}
              onToggle={toggleToc}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
