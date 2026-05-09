'use client';

import { useState, useRef } from 'react';
import { Search, X, BookOpen } from 'lucide-react';
import CourseCard from './CourseCard';

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

export function CourseListClient({ initialCourses }) {
  const [courses] = useState(initialCourses);
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const desktopInputRef = useRef(null);

  const handleClear = () => {
    setQuery('');
    desktopInputRef.current?.focus();
  };

  const handleResetAll = () => {
    setQuery('');
    setDifficulty('all');
  };

  const filtered = filterCourses(courses, query, difficulty);
  const isFiltered = query.trim().length > 0 || difficulty !== 'all';

  const countByDifficulty = courses.reduce((acc, c) => {
    acc[c.difficulty] = (acc[c.difficulty] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#e5e3d8] bg-white">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <img
              src="/images/apps/coursify.png"
              alt="Coursify"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="font-[family-name:var(--font-logo)] text-xl sm:text-2xl text-[#1f644e]">
              Coursify
            </span>
          </div>
          <span className="text-xs text-[#7c8e88] border-l border-[#e5e3d8] pl-3 hidden sm:block shrink-0">
            Free courses to learn and grow
          </span>

          <div className="hidden md:flex flex-1 max-w-xs ml-auto items-center gap-2 bg-[#f8f7f0] border border-[#e5e3d8] rounded-xl px-3 py-2 focus-within:border-[#1f644e] focus-within:bg-white transition-colors">
            <Search className="w-4 h-4 text-[#7c8e88] shrink-0" />
            <input
              ref={desktopInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses…"
              className="flex-1 text-sm text-[#1e3a34] bg-transparent outline-none placeholder:text-[#b0bfbb] min-w-0"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded-md text-[#7c8e88] hover:text-[#1e3a34] transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="md:hidden px-4 pb-3">
          <div className="flex items-center gap-2 bg-[#f8f7f0] border border-[#e5e3d8] rounded-xl px-3 py-2 focus-within:border-[#1f644e] focus-within:bg-white transition-colors">
            <Search className="w-4 h-4 text-[#7c8e88] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses…"
              className="flex-1 text-sm text-[#1e3a34] bg-transparent outline-none placeholder:text-[#b0bfbb] min-w-0"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded-md text-[#7c8e88] hover:text-[#1e3a34] transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1e3a34] mb-2 leading-tight">
            Learn something new today
          </h1>
          <p className="text-[#7c8e88] text-sm sm:text-base max-w-xl">
            Explore free courses built with care. Read at your own pace, no account required.
          </p>
        </div>

        {courses.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-5 sm:mb-6">
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
            {isFiltered && (
              <button
                onClick={handleResetAll}
                className="text-xs font-bold text-[#1f644e] hover:underline ml-1"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-[#1f644e]" />
            </div>
            <h2 className="font-bold text-[#1e3a34] mb-2">No courses yet</h2>
            <p className="text-sm text-[#7c8e88] max-w-xs">
              Check back soon — courses will appear here once they're published.
            </p>
          </div>
        ) : filtered.length === 0 ? (
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
            <p className="text-xs text-[#7c8e88] mb-4 sm:mb-5 font-bold uppercase tracking-wider">
              {isFiltered
                ? `${filtered.length} of ${courses.length} course${courses.length !== 1 ? 's' : ''}`
                : `${courses.length} course${courses.length !== 1 ? 's' : ''} available`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filtered.map((course) => (
                <CourseCard key={course.id || course._id} course={course} />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="mt-auto py-10 border-t border-[#e5e3d8] bg-white/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <a
            href="https://coursify-website.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-80"
          >
            <img
              src="/images/apps/coursify.png"
              alt="Coursify"
              className="h-5 w-5 rounded object-contain grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7c8e88] group-hover:text-[#1f644e] transition-colors">
              Powered by Coursify
            </span>
          </a>
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-bold text-[#b0bfbb] uppercase tracking-widest">
              © {new Date().getFullYear()} • Built by Raiyan Hasan
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
