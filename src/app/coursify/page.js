'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Pacifico, Nunito } from 'next/font/google';
import { BookOpen, Clock, Layers, Tag, ChevronRight, Search, X } from 'lucide-react';

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

const DIFFICULTY_COLORS = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

const DIFFICULTY_FILTERS = ['all', 'beginner', 'intermediate', 'advanced'];

function filterCourses(courses, query, difficulty) {
  let result = courses;

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

function CourseCard({ course }) {
  const router = useRouter();
  const count = course.sectionCount ?? 0;
  return (
    <button
      onClick={() => router.push(`/coursify/${course.slug || course._id}`)}
      className="group text-left bg-white border border-[#e5e3d8] rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#1f644e]/30 transition-all duration-200 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="w-full h-44 bg-gradient-to-br from-[#1f644e] to-[#2d8a6a] relative overflow-hidden shrink-0">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-white/40" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">
        {/* Title */}
        <h2 className="font-bold text-[#1e3a34] text-sm leading-snug group-hover:text-[#1f644e] transition-colors line-clamp-2">
          {course.title}
        </h2>

        {/* Description */}
        {course.description && (
          <p className="text-xs text-[#7c8e88] leading-relaxed line-clamp-2 flex-1">
            {course.description}
          </p>
        )}

        {/* Badges: difficulty + duration */}
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

        {/* Section count + tags */}
        <div className="flex items-center justify-between text-[#7c8e88]">
          <span className="flex items-center gap-1 text-xs font-bold">
            <Layers className="w-3.5 h-3.5" />
            {count} section{count !== 1 ? 's' : ''}
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

        {/* CTA */}
        <div className="flex items-center justify-end pt-3 mt-1 border-t border-[#f0f5f2]">
          <span className="flex items-center gap-1 text-xs font-bold text-[#1f644e] group-hover:gap-2 group-hover:underline transition-all cursor-pointer">
            Start learning <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

export default function CoursifyPublicPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const inputRef = useRef(null);

  useEffect(() => {
    fetch('/api/coursify/public/courses')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCourses(data.courses);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSearch = () => setActiveQuery(query);

  const handleClear = () => {
    setQuery('');
    setActiveQuery('');
    inputRef.current?.focus();
  };

  const handleResetAll = () => {
    setQuery('');
    setActiveQuery('');
    setDifficulty('all');
  };

  const visible = filterCourses(courses, activeQuery, difficulty);
  const isFiltered = activeQuery.trim().length > 0 || difficulty !== 'all';

  // Per-difficulty counts for the filter chips
  const countByDifficulty = courses.reduce((acc, c) => {
    acc[c.difficulty] = (acc[c.difficulty] || 0) + 1;
    return acc;
  }, {});

  return (
    <div
      className={`min-h-screen bg-[#fcfbf5] ${pacifico.variable} ${nunito.variable} font-[family-name:var(--font-sans)]`}
    >
      {/* Header */}
      <header className="border-b border-[#e5e3d8] bg-white px-6 py-4 flex items-center gap-3">
        <img
          src="/images/apps/coursify.png"
          alt="Coursify"
          className="h-8 w-8 rounded-lg object-contain"
        />
        <span className="font-[family-name:var(--font-logo)] text-2xl text-[#1f644e]">
          Coursify
        </span>
        <span className="text-xs text-[#7c8e88] border-l border-[#e5e3d8] pl-3 hidden sm:block">
          Free courses to learn and grow
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-8 py-10">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#1e3a34] mb-3 leading-tight">
            Learn something new today
          </h1>
          <p className="text-[#7c8e88] text-base mb-7 max-w-xl">
            Explore free courses built with care. Read at your own pace, no account required.
          </p>

          {/* Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center gap-2 max-w-xl mb-4"
          >
            <div className="flex-1 flex items-center gap-2 bg-white border border-[#e5e3d8] rounded-xl px-3 py-2.5 focus-within:border-[#1f644e] transition-colors">
              <Search className="w-4 h-4 text-[#7c8e88] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, topic, or tag…"
                className="flex-1 text-sm text-[#1e3a34] bg-transparent outline-none placeholder:text-[#b0bfbb]"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-0.5 rounded-md text-[#7c8e88] hover:text-[#1e3a34] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1f644e] text-white text-sm font-bold rounded-xl hover:bg-[#17503e] transition-colors shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {/* Difficulty filter chips */}
          {!isLoading && courses.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {DIFFICULTY_FILTERS.map((d) => {
                const count = d === 'all' ? courses.length : countByDifficulty[d] || 0;
                const active = difficulty === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
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
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-[#e5e3d8] rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="w-full h-44 bg-[#e5e3d8]" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-[#e5e3d8] rounded w-1/3" />
                  <div className="h-4 bg-[#e5e3d8] rounded w-4/5" />
                  <div className="h-3 bg-[#e5e3d8] rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-[#1f644e]" />
            </div>
            <h2 className="font-bold text-[#1e3a34] mb-2">No courses yet</h2>
            <p className="text-sm text-[#7c8e88] max-w-xs">
              Check back soon — courses will appear here once they&apos;re published.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-[#7c8e88]" />
            </div>
            <h2 className="font-bold text-[#1e3a34] mb-2">No results found</h2>
            <p className="text-sm text-[#7c8e88] mb-4">
              Try different keywords or a different difficulty level.
            </p>
            <button
              onClick={handleResetAll}
              className="text-sm font-bold text-[#1f644e] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#7c8e88] mb-5 font-bold uppercase tracking-wider">
              {isFiltered
                ? `${visible.length} of ${courses.length} course${courses.length !== 1 ? 's' : ''}`
                : `${courses.length} course${courses.length !== 1 ? 's' : ''} available`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
