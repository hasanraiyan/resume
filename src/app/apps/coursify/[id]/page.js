'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Pacifico, Nunito, Lora } from 'next/font/google';
import { X, Clock, Layers } from 'lucide-react';
import EditSectionModal from '@/components/coursify/EditSectionModal';
import EditModuleModal from '@/components/coursify/EditModuleModal';
import ImportBundleModal from '@/components/coursify/ImportBundleModal';
import { ReaderSidebar } from '@/components/coursify/reader/ReaderSidebar';
import { TableOfContents } from '@/components/coursify/reader/TableOfContents';
import { useTableOfContents } from '@/hooks/coursify/useTableOfContents';
import { CoursifyStudioProvider, useCoursifyStudio } from '@/context/CoursifyStudioContext';
import { AuthoringHeader } from '@/components/coursify/studio/AuthoringHeader';
import { PlanningWorkspace } from '@/components/coursify/studio/PlanningWorkspace';
import { ModuleSectionList } from '@/components/coursify/studio/ModuleSectionList';
import SessionProvider from '@/components/SessionProvider';

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

const DIFFICULTY_COLORS = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

const AUTHORING_STATUS_COLORS = {
  idea: 'bg-gray-100 text-gray-600',
  researching: 'bg-blue-100 text-blue-700',
  planned: 'bg-purple-100 text-purple-700',
  drafting: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-orange-100 text-orange-700',
  ready: 'bg-emerald-100 text-emerald-700',
};

export default function CourseDetailPage({ params }) {
  const { id } = use(params);
  return (
    <CoursifyStudioProvider id={id}>
      <CourseStudioInner />
    </CoursifyStudioProvider>
  );
}

function CourseStudioInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const mainRef = useRef(null);
  const contentRef = useRef(null);
  const [tocOpen, setTocOpen] = useState(true);
  const [showImport, setShowImport] = useState(false);

  const {
    course,
    sections,
    modules,
    activeSection,
    showOverview,
    visited,
    isLoading,
    notFound,
    sidebarOpen,
    expandedModules,
    activeTab,
    editingSection,
    editingModule,
    showNewSection,
    showMeta,
    editMode,
    setEditingSection,
    setEditingModule,
    setShowNewSection,
    setTargetModuleId,
    setShowMeta,
    toggleModule,
    closeSidebar,
    navigateTo,
    showOverviewPage,
    handleSaveSection,
    handleSaveModule,
    handleDeleteModule,
    refreshCourse,
  } = useCoursifyStudio();

  const currentSection = sections.find((s) => s._id === activeSection);
  const { headings, activeHeading } = useTableOfContents(
    showOverview ? [] : currentSection?.blocks || [],
    contentRef,
    mainRef
  );

  if (status === 'loading') return null;
  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    router.push('/login');
    return null;
  }

  const handleCreateModule = () => {
    setEditingModule({ title: '', summary: '' });
  };

  const handleEditModule = (mod) => {
    setEditingModule(mod);
  };

  const handleAddSectionClick = (moduleId) => {
    setTargetModuleId(moduleId);
    setShowNewSection(true);
  };

  const handleImportBundle = () => {
    setShowImport(true);
  };

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

  if (!course) {
    return (
      <div
        className={`min-h-screen bg-[#fcfbf5] ${pacifico.variable} ${nunito.variable} font-[family-name:var(--font-sans)] flex items-center justify-center`}
      >
        <div className="text-center">
          <p className="text-[#7c8e88] mb-4">Course not found</p>
          <button
            onClick={() => router.push('/apps/coursify')}
            className="text-[#1f644e] font-bold text-sm"
          >
            Back to Coursify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex flex-col ${pacifico.variable} ${nunito.variable} ${lora.variable}`}
    >
      <AuthoringHeader />

      {showMeta && (
        <div className="hidden lg:flex items-center gap-3 px-6 py-2 bg-[#fcfbf5] border-b border-[#e5e3d8] shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
              DIFFICULTY_COLORS[course.difficulty] || DIFFICULTY_COLORS.beginner
            }`}
          >
            {course.difficulty}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
              AUTHORING_STATUS_COLORS[course.authoringStatus] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {course.authoringStatus || 'idea'}
          </span>
          {course.estimatedDuration && (
            <span className="flex items-center gap-1 text-[10px] text-[#7c8e88] font-bold">
              <Clock className="w-3 h-3" />
              {course.estimatedDuration}
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] text-[#7c8e88] font-bold">
            <Layers className="w-3 h-3" />
            {sections.length} section{sections.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setShowMeta(false)}
            className="ml-auto p-1 rounded-md text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#e5e3d8] transition-colors"
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

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
          editMode={editMode}
          onAddSection={handleAddSectionClick}
          onAddModule={handleCreateModule}
          onEditModule={handleEditModule}
          onDeleteModule={handleDeleteModule}
          onImportBundle={handleImportBundle}
        />

        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="flex min-h-0 w-full min-w-0">
            <div className="flex-1 min-w-0" ref={contentRef}>
              {activeTab === 'planning' ? <PlanningWorkspace /> : <ModuleSectionList />}
            </div>
            {!showOverview && activeTab !== 'planning' && (
              <TableOfContents
                headings={headings}
                activeHeading={activeHeading}
                isOpen={tocOpen}
                onToggle={() => setTocOpen(!tocOpen)}
              />
            )}
          </div>
        </main>
      </div>

      {(editingSection || showNewSection) && (
        <EditSectionModal
          section={editingSection || null}
          onSave={handleSaveSection}
          onClose={() => {
            setEditingSection(null);
            setShowNewSection(false);
          }}
        />
      )}

      {editingModule && (
        <EditModuleModal
          module={editingModule?._id ? editingModule : null}
          onSave={handleSaveModule}
          onClose={() => setEditingModule(null)}
        />
      )}

      {showImport && (
        <ImportBundleModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            refreshCourse();
          }}
        />
      )}
    </div>
  );
}
