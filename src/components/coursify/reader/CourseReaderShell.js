'use client';
import { generateMarkdownFromBlocks } from '@/utils/coursify-parser';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { useTableOfContents } from '@/hooks/coursify/useTableOfContents';
import { useCourseReader } from '@/hooks/coursify/useCourseReader';
import { useReaderUI } from '@/hooks/coursify/useReaderUI';
import { ReaderHeader } from '@/components/coursify/reader/ReaderHeader';
import { ReaderSidebar } from '@/components/coursify/reader/ReaderSidebar';
import { CourseOverview } from '@/components/coursify/reader/CourseOverview';
import { MarkdownRenderer } from '@/components/coursify/reader/MarkdownRenderer';
import { QuizPlayer } from '@/components/coursify/reader/QuizPlayer';
import { TableOfContents } from '@/components/coursify/reader/TableOfContents';
import { ReaderNavigation } from '@/components/coursify/reader/ReaderNavigation';
import { CoursifyBlockRenderer } from '@/components/coursify/reader/CoursifyBlockRenderer';

export function CourseReaderShell({ initialData, slug, activeSectionId }) {
  const router = useRouter();
  const contentRef = useRef(null);
  const mainRef = useRef(null);

  const {
    course,
    sections,
    orderedSections,
    modules,
    activeSection,
    showOverview,
    visited,
    navigateTo,
    showOverviewPage,
    sectionLoading,
  } = useCourseReader({ initialData, slug, activeSectionId });

  const currentSection = sections.find((s) => s._id === activeSection);
  const isSectionLoaded = !!(currentSection?.content || currentSection?.blocks?.length > 0);

  const { headings, activeHeading } = useTableOfContents(
    currentSection?.content ||
      (currentSection?.blocks ? generateMarkdownFromBlocks(currentSection.blocks) : ''),
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

  if (!course) return null;

  return (
    <div className="h-screen flex flex-col">
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

        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="flex min-h-0 w-full min-w-0">
            <article
              className="flex-1 min-w-0 max-w-3xl mx-auto px-4 lg:px-10 py-8"
              ref={contentRef}
            >
              {showOverview ? (
                <CourseOverview
                  course={course}
                  sections={sections}
                  modules={modules}
                  onNavigateTo={navigateTo}
                />
              ) : sectionLoading && !isSectionLoaded ? (
                <div className="space-y-6 animate-pulse">
                  <div className="h-6 bg-[#e5e3d8] rounded w-3/4 mb-4" />
                  <div className="h-4 bg-[#e5e3d8] rounded w-full" />
                  <div className="h-4 bg-[#e5e3d8] rounded w-5/6" />
                  <div className="h-40 bg-[#e5e3d8] rounded-2xl w-full" />
                </div>
              ) : currentSection ? (
                <>
                  <CoursifyBlockRenderer
                    content={currentSection.content}
                    blocks={currentSection.blocks}
                    sectionId={currentSection._id}
                  />
                  <ReaderNavigation
                    sections={orderedSections}
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
