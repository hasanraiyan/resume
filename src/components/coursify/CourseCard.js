'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  MoreVertical,
  Pencil,
  Trash2,
  Globe,
  Lock,
  Clock,
  Layers,
  Tag,
} from 'lucide-react';
import { useCoursify } from '@/context/CoursifyContext';

const DIFFICULTY_COLORS = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

const GRADIENT_BY_INDEX = [
  'from-[#1f644e] to-[#2d8a6a]',
  'from-[#4f46e5] to-[#7c3aed]',
  'from-[#0369a1] to-[#0891b2]',
  'from-[#b45309] to-[#d97706]',
  'from-[#be185d] to-[#db2777]',
  'from-[#065f46] to-[#059669]',
];

export default function CourseCard({ course, index = 0 }) {
  const router = useRouter();
  const { deleteCourse, togglePublish } = useCoursify();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);

  const gradient = GRADIENT_BY_INDEX[index % GRADIENT_BY_INDEX.length];

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    if (!menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setMenuOpen((v) => !v);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (confirm(`Delete "${course.title}"? This cannot be undone.`)) {
      await deleteCourse(course._id);
    }
  };

  const handleTogglePublish = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    await togglePublish(course._id);
  };

  return (
    <>
      <div
        onClick={() => router.push(`/apps/coursify/${course._id}`)}
        className="bg-white border border-[#e5e3d8] rounded-2xl overflow-hidden cursor-pointer hover:shadow-md hover:border-[#1f644e]/30 transition-all group flex flex-col"
      >
        {/* Thumbnail / cover */}
        <div
          className={`h-44 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden shrink-0`}
        >
          {course.thumbnail ? (
            <>
              <img
                src={course.thumbnail}
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* gradient scrim so badge is always readable over photos */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
            </>
          ) : (
            <BookOpen className="w-10 h-10 text-white/70" />
          )}
          <div className="absolute top-3 right-3">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${
                course.status === 'published'
                  ? 'bg-emerald-500/80 text-white'
                  : 'bg-black/40 text-white/90'
              }`}
            >
              {course.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Body — flex-col so footer always sits at the bottom */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-[#1e3a34] text-sm leading-snug line-clamp-2 flex-1">
              {course.title}
            </h3>
            <button
              ref={buttonRef}
              onClick={handleMenuOpen}
              className="p-1 rounded-lg hover:bg-[#f0f5f2] text-[#7c8e88] shrink-0 -mr-1 -mt-0.5"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* description reserves 2-line space even when empty so cards align */}
          <p className="text-xs text-[#7c8e88] line-clamp-2 mb-3 min-h-[2.5rem]">
            {course.description || ''}
          </p>

          {/* badges + footer pushed to bottom */}
          <div className="mt-auto space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${DIFFICULTY_COLORS[course.difficulty] || DIFFICULTY_COLORS.beginner}`}
              >
                {course.difficulty}
              </span>
              {course.estimatedDuration && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f0f5f2] text-[#7c8e88]">
                  <Clock className="w-2.5 h-2.5" />
                  {course.estimatedDuration}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[#7c8e88]">
              <span className="flex items-center gap-1 text-xs font-bold">
                <Layers className="w-3.5 h-3.5" />
                {course.sectionCount} section{course.sectionCount !== 1 ? 's' : ''}
              </span>
              {course.tags?.length > 0 && (
                <span className="flex items-center gap-1 text-xs truncate max-w-[55%]">
                  <Tag className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {course.tags.slice(0, 2).join(', ')}
                    {course.tags.length > 2 && ` +${course.tags.length - 2}`}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
            }}
          />
          <div
            className="fixed w-44 bg-white border border-[#e5e3d8] rounded-xl shadow-xl z-50 py-1"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                router.push(`/apps/coursify/${course._id}`);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1e3a34] hover:bg-[#f0f5f2]"
            >
              <Pencil className="w-4 h-4 text-[#7c8e88]" />
              Open / Edit
            </button>
            <button
              onClick={handleTogglePublish}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1e3a34] hover:bg-[#f0f5f2]"
            >
              {course.status === 'published' ? (
                <>
                  <Lock className="w-4 h-4 text-[#7c8e88]" /> Unpublish
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 text-[#7c8e88]" /> Publish
                </>
              )}
            </button>
            <div className="border-t border-[#e5e3d8] my-1" />
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#c94c4c] hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </>
  );
}
