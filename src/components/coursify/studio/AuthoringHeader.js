'use client';

import { RefreshCw, Globe, Lock, Pencil } from 'lucide-react';
import { ReaderHeader } from '@/components/coursify/reader/ReaderHeader';
import { useCoursifyStudio } from '@/context/CoursifyStudioContext';
import { QueueGenerationButton } from './QueueGenerationButton';

export function AuthoringHeader() {
  const {
    course,
    showOverview,
    activeTab,
    isRefreshing,
    editMode,
    setActiveTab,
    refreshCourse,
    handleTogglePublish,
    setEditMode,
    toggleSidebar,
  } = useCoursifyStudio();

  if (!course) return null;

  return (
    <ReaderHeader
      course={course}
      showOverview={showOverview}
      onToggleSidebar={toggleSidebar}
      actions={
        <div className="flex items-center gap-1.5">
          <QueueGenerationButton />

          <div className="hidden sm:flex items-center gap-0.5 bg-[#f0f5f2] rounded-xl p-0.5 shrink-0">
            {['content', 'planning'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-[#1e3a34] shadow-sm'
                    : 'text-[#7c8e88] hover:text-[#1e3a34]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={refreshCourse}
            title="Refresh"
            className={`p-1.5 rounded-lg text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2] transition-colors ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleTogglePublish}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              course.status === 'published'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-[#e5e3d8] text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e]'
            }`}
          >
            {course.status === 'published' ? (
              <Globe className="w-3 h-3 shrink-0" />
            ) : (
              <Lock className="w-3 h-3 shrink-0" />
            )}
            <span className="hidden sm:inline">
              {course.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </button>

          <button
            onClick={() => setEditMode(!editMode)}
            title={editMode ? 'Exit edit mode' : 'Edit'}
            className={`p-1.5 rounded-lg border transition-colors ${
              editMode
                ? 'bg-[#1f644e] border-[#1f644e] text-white'
                : 'border-[#e5e3d8] bg-white text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e]'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      }
    />
  );
}
