'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { Search, BookOpen, Plus, Sparkles } from 'lucide-react';
import { PublicCourseCard } from './PublicCourseCard';
import SearchOverlay from '@/components/search/SearchOverlay';
import { Dialog, DialogContent, DialogTrigger } from '@/components/custom-ui/Dialog';
import { LeadForm } from '@/components/custom-ui/LeadForm';
import { cn } from '@/components/custom-ui';
import { AISearchEngine } from './AISearchEngine';
import { BalanceBadge, useBalance } from './BalanceBadge';

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

export function CourseListClient({ initialCourses, waitlistCount = 0 }) {
  const [courses] = useState(initialCourses);
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('all');

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const { balance, isLoading, refresh: refreshBalance } = useBalance();
  const { data: session } = useSession();

  useEffect(() => {
    if (window.location.hash === '#waitlist') {
      setIsWaitlistOpen(true);
    }
  }, []);

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
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f7f7f2]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-[#e5e3d8] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3">
          {/* Logo */}
          <div className="flex shrink-0 items-center gap-2 min-w-0">
            <img
              src="/images/apps/coursify.png"
              alt="Coursify"
              className="h-7 w-7 rounded-lg object-contain sm:h-8 sm:w-8"
            />

            <span className="truncate font-[family-name:var(--font-logo)] text-xl text-[#1f644e] sm:text-2xl">
              Coursify
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="rounded-full p-2 text-[#7c8e88] transition-colors hover:bg-[#f0f5f2] hover:text-[#1f644e]"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Desktop */}
            <div className="hidden items-center gap-2 sm:flex">
              {session?.user && <BalanceBadge balance={balance} loading={isLoading} />}

              <Dialog open={isWaitlistOpen} onOpenChange={setIsWaitlistOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full bg-[#1f644e] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#1f644e]/10 transition-all hover:bg-[#184d3c]">
                    <Plus className="h-4 w-4" />
                    Join Waitlist
                  </button>
                </DialogTrigger>

                <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[2rem] border-none bg-white p-0 shadow-3xl sm:max-w-[440px]">
                  <div className="relative p-4 sm:p-10">
                    <div className="relative z-10 text-center">
                      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f5f2] shadow-sm">
                        <Sparkles className="h-7 w-7 text-[#1f644e]" />
                      </div>

                      <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-[#1e3a34] font-['Playfair_Display']">
                        Master <span className="italic text-[#1f644e]">Anything</span>
                        <br />
                        Instantly.
                      </h2>

                      <p className="mx-auto mb-8 max-w-[260px] text-xs leading-relaxed text-[#7c8e88]">
                        Join the waitlist for the AI-powered engine that builds courses on demand.
                      </p>

                      <LeadForm
                        minimal
                        type="coursify-waitlist"
                        buttonText="Get Early Access"
                        fields={[
                          {
                            id: 'learning_goal',
                            label: 'Learning Goal',
                            type: 'text',
                            placeholder: "What's the first course you will generate?",
                            required: true,
                          },
                        ]}
                      />

                      {waitlistCount > 0 && (
                        <div className="mt-10 flex flex-col items-center gap-3 border-t border-[#f0f5f2] pt-6">
                          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
                            {waitlistCount.toLocaleString()}+ waiting for access
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              {session?.user && (
                <BalanceBadge
                  balance={balance}
                  loading={isLoading}
                  className="px-2 py-1 text-[9px]"
                />
              )}

              <button
                onClick={() => setIsWaitlistOpen(true)}
                className="rounded-full bg-[#1f644e] p-2 text-white shadow-lg shadow-[#1f644e]/20 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* SEARCH OVERLAY */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} type="course" />

      {/* MAIN */}
      <main className="mx-auto w-full max-w-4xl overflow-x-hidden px-4 py-8 sm:py-12">
        {/* HERO */}
        <section className="mb-8 sm:mb-10">
          <div className="mb-6 text-center sm:text-left">
            <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-[#1e3a34] sm:text-3xl lg:text-4xl">
              Master anything in <span className="italic text-[#1f644e]">seconds</span>
            </h1>

            <p className="mx-auto max-w-lg text-sm leading-relaxed text-[#7c8e88] sm:mx-0 sm:text-base">
              Search any topic. Our AI researches the web and generates a structured,
              university-level course page instantly.
            </p>
          </div>

          {/* AI SEARCH */}
          <div className="w-full">
            <Suspense
              fallback={<div className="h-16 w-full animate-pulse rounded-full bg-[#f0f5f2]" />}
            >
              <AISearchEngine onGenerated={refreshBalance} />
            </Suspense>
          </div>
        </section>

        {/* Divider */}
        <div className="mb-6 flex items-center gap-3 sm:mb-8">
          <div className="h-px flex-1 bg-[#e5e3d8]" />

          <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#b5c4be]">
            or browse courses
          </p>

          <div className="h-px flex-1 bg-[#e5e3d8]" />
        </div>

        {/* FILTERS */}
        {courses.length > 0 && (
          <div className="mb-6 flex w-full flex-wrap items-center justify-center gap-2 sm:mb-8 sm:justify-start">
            {DIFFICULTY_FILTERS.map((d) => {
              const count = d === 'all' ? courses.length : countByDifficulty[d] || 0;

              const active = difficulty === d;

              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold capitalize transition-all ${
                    active
                      ? 'bg-[#1f644e] text-white shadow-md shadow-[#1f644e]/20 ring-2 ring-[#1f644e]/10'
                      : 'border border-[#e5e3d8] bg-white text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e]'
                  }`}
                >
                  {d === 'all' ? 'All levels' : d}

                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
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
                className="ml-2 text-xs font-bold text-[#1f644e] hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        )}

        {/* EMPTY STATES */}
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0f5f2]">
              <BookOpen className="h-8 w-8 text-[#1f644e]" />
            </div>

            <h2 className="mb-2 font-bold text-[#1e3a34]">No courses yet</h2>

            <p className="max-w-xs text-sm text-[#7c8e88]">
              Check back soon — courses will appear here once they're published.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0f5f2]">
              <Search className="h-8 w-8 text-[#7c8e88]" />
            </div>

            <h2 className="mb-2 font-bold text-[#1e3a34]">No results found</h2>

            <p className="mb-4 text-sm text-[#7c8e88]">Try different keywords or difficulty.</p>

            <button
              onClick={handleResetAll}
              className="text-sm font-bold text-[#1f644e] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[#7c8e88] sm:mb-5">
              {isFiltered
                ? `${filtered.length} of ${courses.length} courses`
                : `${courses.length} courses available`}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
              {filtered.map((course) => (
                <PublicCourseCard key={course.id || course._id} course={course} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-[#e5e3d8] bg-white/50 py-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 px-4 sm:flex-row">
          <a
            href="https://coursify-website.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <img
              src="/images/apps/coursify.png"
              alt="Coursify"
              className="h-5 w-5 rounded object-contain grayscale opacity-40 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
            />

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7c8e88] transition-colors group-hover:text-[#1f644e]">
              Powered by Coursify
            </span>
          </a>

          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b0bfbb]">
            © {new Date().getFullYear()} • Built by Raiyan Hasan
          </p>
        </div>
      </footer>
    </div>
  );
}
