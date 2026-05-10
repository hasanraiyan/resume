'use client';

import { Pencil, Trash2, ImagePlus, BookOpen, ExternalLink } from 'lucide-react';
import { useRef } from 'react';
import { CourseOverview } from '@/components/coursify/reader/CourseOverview';
import { CoursifyBlockRenderer } from '@/components/coursify/reader/CoursifyBlockRenderer';
import { ReaderNavigation } from '@/components/coursify/reader/ReaderNavigation';
import { useCoursifyStudio } from '@/context/CoursifyStudioContext';

const RESOURCE_ICONS = {
  video: '▶',
  article: '📄',
  doc: '📘',
  other: '🔗',
};

export function ModuleSectionList() {
  const {
    course,
    sections,
    orderedSections,
    modules,
    activeSection,
    showOverview,
    visited,
    sectionLoading,
    editMode,
    planSaving,
    thumbnailUploading,
    navigateTo,
    handleThumbnailUpload,
    handleUpdateMeta,
    setEditingSection,
    handleDeleteSection,
  } = useCoursifyStudio();

  const thumbnailInputRef = useRef(null);

  if (!course) return null;

  const currentSection = sections.find((s) => s._id === activeSection);

  return (
    <article className="max-w-3xl mx-auto px-4 lg:px-10 py-8">
      <input
        ref={thumbnailInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleThumbnailUpload}
      />
      {thumbnailUploading ? (
        <div className="w-full aspect-video rounded-2xl overflow-hidden mb-8 border border-[#e5e3d8] shadow-sm bg-gradient-to-br from-[#1f644e] to-[#2d8a6a] relative flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="w-8 h-8 rounded-full border-2 border-white/60 border-t-white animate-spin" />
            <span className="text-xs font-bold text-white/70 tracking-wider uppercase">
              Uploading thumbnail…
            </span>
          </div>
        </div>
      ) : course.thumbnail ? (
        <div className="w-full aspect-video rounded-2xl overflow-hidden mb-8 border border-[#e5e3d8] shadow-sm relative group">
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          {editMode && !course.isFrozen && (
            <button
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={thumbnailUploading}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {thumbnailUploading ? (
                <div className="w-7 h-7 rounded-full border-2 border-white/60 border-t-white animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-7 h-7 text-white" />
                  <span className="text-xs font-bold text-white">Change thumbnail</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : editMode && !course.isFrozen ? (
        <button
          onClick={() => thumbnailInputRef.current?.click()}
          disabled={thumbnailUploading}
          className="w-full aspect-video rounded-2xl mb-8 border-2 border-dashed border-[#e5e3d8] flex flex-col items-center justify-center gap-2 hover:border-[#1f644e] hover:bg-[#f0f5f2] transition-colors"
        >
          <ImagePlus className="w-7 h-7 text-[#7c8e88]" />
          <span className="text-xs font-bold text-[#7c8e88]">Upload thumbnail</span>
        </button>
      ) : null}

      {showOverview ? (
        <CourseOverview
          course={course}
          sections={sections}
          modules={modules}
          onNavigateTo={navigateTo}
          hideThumbnail={true}
          editMode={editMode && !course.isFrozen}
          onUpdateMeta={handleUpdateMeta}
          isSaving={planSaving}
        />
      ) : !currentSection ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-[#1f644e]" />
          </div>
          <h3 className="font-bold text-[#1e3a34] mb-2">No section selected</h3>
          <p className="text-sm text-[#7c8e88]">Select a section from the sidebar.</p>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-[#1e3a34] leading-snug min-w-0">
              {currentSection.title}
            </h2>
            {editMode && !course.isFrozen && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditingSection(currentSection)}
                  className="p-2 rounded-xl hover:bg-[#f0f5f2] text-[#7c8e88] hover:text-[#1f644e] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSection(currentSection._id)}
                  className="p-2 rounded-xl hover:bg-red-50 text-[#7c8e88] hover:text-[#c94c4c] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {sectionLoading && (!currentSection.blocks || currentSection.blocks.length === 0) ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-4 bg-[#e5e3d8] rounded w-full" />
              <div className="h-4 bg-[#e5e3d8] rounded w-5/6" />
              <div className="h-32 bg-[#e5e3d8] rounded-2xl w-full" />
              <div className="h-4 bg-[#e5e3d8] rounded w-4/6" />
            </div>
          ) : (
            <CoursifyBlockRenderer blocks={currentSection.blocks} sectionId={currentSection._id} />
          )}

          {currentSection.resources?.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[#e5e3d8]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-3">
                Resources
              </h4>
              <div className="space-y-2">
                {currentSection.resources.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white border border-[#e5e3d8] rounded-xl hover:border-[#1f644e]/40 hover:bg-[#f0f5f2] transition-colors group"
                  >
                    <span className="text-base shrink-0">{RESOURCE_ICONS[r.type] || '🔗'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1e3a34] truncate">
                        {r.title || r.url}
                      </p>
                      <p className="text-xs text-[#7c8e88] truncate">{r.url}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#7c8e88] group-hover:text-[#1f644e] shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <ReaderNavigation
            sections={orderedSections}
            activeSection={activeSection}
            onNavigate={navigateTo}
          />
        </>
      )}
    </article>
  );
}
