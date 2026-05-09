'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BookOpen, ChevronRight } from 'lucide-react';

const DIFFICULTY_COLORS = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

export function PublicCourseCard({ course }) {
  const router = useRouter();
  const count = course.sectionCount ?? 0;
  return (
    <button
      onClick={() => router.push(`/coursify/${course.slug || course.id || course._id}`)}
      className="group text-left bg-white border border-[#e5e3d8] rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#1f644e]/30 transition-all duration-200 flex flex-col w-full"
    >
      <div className="w-full h-40 sm:h-44 bg-gradient-to-br from-[#1f644e] to-[#2d8a6a] relative overflow-hidden shrink-0">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-white/40" />
          </div>
        )}
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/40 text-white backdrop-blur-sm">
            {count} {count === 1 ? 'section' : 'sections'}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 z-10">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize backdrop-blur-sm ${
              DIFFICULTY_COLORS[course.difficulty] || DIFFICULTY_COLORS.beginner
            }`}
          >
            {course.difficulty}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <h2 className="font-bold text-[#1e3a34] text-sm leading-snug group-hover:text-[#1f644e] transition-colors line-clamp-2">
          {course.title}
        </h2>
        {course.description && (
          <p className="text-xs text-[#7c8e88] leading-relaxed line-clamp-2">
            {course.description}
          </p>
        )}
        <div className="flex items-center justify-end pt-2 mt-auto border-t border-[#f0f5f2]">
          <span className="flex items-center gap-1 text-xs font-bold text-[#1f644e] group-hover:gap-2 group-hover:underline transition-all cursor-pointer">
            Start learning <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
