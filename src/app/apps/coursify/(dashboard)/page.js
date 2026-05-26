'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Bot, Plus, FileUp, History } from 'lucide-react';
import { useCoursify } from '@/context/CoursifyContext';
import CourseCard from '@/components/coursify/CourseCard';

const DIFFICULTY_FILTERS = ['all', 'beginner', 'intermediate', 'advanced'];
const ITEMS_PER_PAGE = 6;

function filterCourses(courses, query, difficulty, status) {
  let result = courses;
  if (status !== 'all') {
    result = result.filter((c) => c.status === status);
  }
  if (difficulty !== 'all') {
    result = result.filter((c) => c.difficulty === difficulty);
  }
  const q = query.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }
  return result;
}

export default function CourseLibraryPage() {
  const {
    isLoading,
    courses,
    globalSearch,
    setGlobalSearch,
    setShowCreateModal,
    setShowImportModal,
  } = useCoursify();

  const searchParams = useSearchParams();
  const router = useRouter();

  // URL-driven states
  const difficulty = searchParams.get('difficulty') || 'all';
  const statusTab = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const updateFilters = (updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === 'all' || (key === 'page' && value === 1)) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`?${params.toString()}`);
  };

  const filtered = useMemo(
    () => filterCourses(courses, globalSearch, difficulty, statusTab),
    [courses, globalSearch, difficulty, statusTab]
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const isFiltered = globalSearch.trim().length > 0 || difficulty !== 'all' || statusTab !== 'all';

  const publishedCount = courses.filter((c) => c.status === 'published').length;
  const draftCount = courses.filter((c) => c.status === 'draft').length;

  const countByDifficulty = courses.reduce((acc, c) => {
    acc[c.difficulty] = (acc[c.difficulty] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="space-y-8">
        <section>
          <div className="h-3 w-20 bg-[#e5e3d8] rounded animate-pulse mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#e5e3d8] rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="h-44 bg-[#e5e3d8]" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-[#e5e3d8] rounded w-3/4" />
                  <div className="h-2 bg-[#e5e3d8] rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4">
          <Bot className="w-8 h-8 text-[#1f644e]" />
        </div>
        <h2 className="text-xl font-bold text-[#1e3a34] mb-2">No courses yet</h2>
        <p className="text-sm text-[#7c8e88] max-w-sm mb-6">
          Connect Claude or ChatGPT to the Coursify MCP server and ask it to build you a course.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => router.push('/apps/coursify/artifacts')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#f0f5f2] text-[#1f644e] rounded-xl text-sm font-bold hover:bg-[#e2ede7] transition-colors"
          >
            <History className="w-4 h-4" />
            View Research Artifacts
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[#e5e3d8] text-[#7c8e88] rounded-xl text-sm font-bold hover:border-[#1f644e] hover:text-[#1f644e] transition-colors"
          >
            <FileUp className="w-4 h-4" />
            Import Bundle
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1f644e] text-white rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Or create manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter chips: status + difficulty */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All', count: courses.length },
          { key: 'published', label: 'Published', count: publishedCount },
          { key: 'draft', label: 'Draft', count: draftCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => updateFilters({ status: tab.key, page: 1 })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              statusTab === tab.key
                ? 'bg-[#1f644e] text-white'
                : 'bg-white border border-[#e5e3d8] text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e]'
            }`}
          >
            {tab.label}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                statusTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#f0f5f2] text-[#7c8e88]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}

        {DIFFICULTY_FILTERS.map((d) => {
          const count = d === 'all' ? courses.length : countByDifficulty[d] || 0;
          const active = difficulty === d;
          return (
            <button
              key={d}
              onClick={() => updateFilters({ difficulty: d, page: 1 })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                active
                  ? 'bg-[#1f644e] text-white'
                  : 'bg-white border border-[#e5e3d8] text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e]'
              }`}
            >
              {d === 'all' ? 'All levels' : d}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-[#f0f5f2] text-[#7c8e88]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {isFiltered && (
          <button
            onClick={() => {
              setGlobalSearch('');
              updateFilters({ difficulty: 'all', status: 'all', page: 1 });
            }}
            className="text-xs font-bold text-[#1f644e] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Course grid */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-8 h-8 text-[#7c8e88] mb-3" />
          <p className="text-sm text-[#7c8e88]">No courses match your filters.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-[#7c8e88] font-bold uppercase tracking-wider">
            {isFiltered
              ? `${filtered.length} of ${courses.length} course${courses.length !== 1 ? 's' : ''}`
              : `${courses.length} course${courses.length !== 1 ? 's' : ''}`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((course, i) => (
              <CourseCard key={course._id} course={course} index={i} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => updateFilters({ page: Math.max(1, page - 1) })}
                disabled={page === 1}
                className="p-2 rounded-lg border border-[#e5e3d8] text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateFilters({ page: p })}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    p === page ? 'bg-[#1f644e] text-white' : 'text-[#7c8e88] hover:bg-[#f0f5f2]'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => updateFilters({ page: Math.min(totalPages, page + 1) })}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-[#e5e3d8] text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
