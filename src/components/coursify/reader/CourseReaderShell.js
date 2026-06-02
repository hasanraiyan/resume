'use client';
import { generateMarkdownFromBlocks } from '@/utils/coursify-parser';

import { useRef, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Download, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTableOfContents } from '@/hooks/coursify/useTableOfContents';
import { useCourseReader } from '@/hooks/coursify/useCourseReader';
import { useReaderUI } from '@/hooks/coursify/useReaderUI';
import { ReaderHeader } from '@/components/coursify/reader/ReaderHeader';
import { ReaderSidebar } from '@/components/coursify/reader/ReaderSidebar';
import { CourseOverview } from '@/components/coursify/reader/CourseOverview';
import { TableOfContents } from '@/components/coursify/reader/TableOfContents';
import { ReaderNavigation } from '@/components/coursify/reader/ReaderNavigation';
import { CoursifyBlockRenderer } from '@/components/coursify/reader/CoursifyBlockRenderer';
import { generateCoursifyPdf } from '@/utils/coursifyPdfGenerator';

export function CourseReaderShell({ initialData, slug, activeSectionId }) {
  const router = useRouter();
  const contentRef = useRef(null);
  const mainRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

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

  const tocMarkdown = useMemo(() => {
    if (currentSection?.content) return currentSection.content;
    if (currentSection?.blocks?.length > 0)
      return generateMarkdownFromBlocks(currentSection.blocks);
    return '';
  }, [currentSection?.content, currentSection?.blocks]);

  const { headings, activeHeading } = useTableOfContents(tocMarkdown, contentRef, mainRef);

  const {
    sidebarOpen,
    tocOpen,
    expandedModules,
    toggleModule,
    toggleSidebar,
    closeSidebar,
    toggleToc,
  } = useReaderUI(modules, activeSection, sections);

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    toast.loading('Preparing your PDF...', { id: 'pdf-export' });

    try {
      const doc = await generateCoursifyPdf({ course, sections });
      doc.save(`${course.title.replace(/\s+/g, '_')}_Study_Guide.pdf`);
      toast.success('Course exported successfully!', { id: 'pdf-export' });
    } catch (err) {
      console.error('PDF Export Error:', err);
      toast.error('Failed to generate PDF.', { id: 'pdf-export' });
    } finally {
      setIsExporting(false);
    }
  };

  if (!course) return null;

  return (
    <div className="h-screen flex flex-col">
      <ReaderHeader
        course={course}
        showOverview={showOverview}
        onToggleSidebar={toggleSidebar}
        actions={
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="p-1.5 hover:bg-[#f0f5f2] rounded-full transition-colors text-[#7c8e88] hover:text-[#1f644e] disabled:opacity-50"
            title="Download PDF"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        }
      />

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
                  {/* Section Header */}
                  <div className="mb-6 space-y-4 animate-in fade-in duration-300">
                    <h1 className="text-3xl font-extrabold text-[#1e3a34] font-serif leading-tight">
                      {currentSection.title}
                    </h1>

                    {currentSection.estimatedDuration && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7c8e88]">
                        <Clock className="w-3.5 h-3.5 text-[#1f644e]" />
                        <span>{currentSection.estimatedDuration}</span>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {currentSection.summary && (
                    <div className="mb-6 p-5 rounded-2xl border border-[#e5e3d8] bg-[#fcfbf5] animate-in fade-in duration-300">
                      <p className="text-sm leading-relaxed text-[#1e3a34]">
                        {currentSection.summary}
                      </p>
                    </div>
                  )}

                  {/* Learning Goals */}
                  {currentSection.learningGoals &&
                    currentSection.learningGoals.filter((g) => g?.trim()).length > 0 && (
                      <div className="mb-8 animate-in fade-in duration-300">
                        <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[#7c8e88] mb-3">
                          Learning Goals
                        </h3>
                        <ul className="space-y-2">
                          {currentSection.learningGoals
                            .filter((g) => g?.trim())
                            .map((goal, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-[#1e3a34]">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#f0f5f2] text-[#1f644e]">
                                  <CheckCircle2 className="w-3 h-3" />
                                </div>
                                <span className="flex-1">{goal}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                  {/* Divider separating header and blocks */}
                  {(currentSection.summary ||
                    (currentSection.learningGoals &&
                      currentSection.learningGoals.filter((g) => g?.trim()).length > 0)) && (
                    <hr className="my-6 border-[#e5e3d8]" />
                  )}

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
