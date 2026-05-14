'use client';

import { useState } from 'react';
import { Search, BookOpen, Plus, Sparkles } from 'lucide-react';
import { PublicCourseCard } from './PublicCourseCard';
import SearchOverlay from '@/components/search/SearchOverlay';
import { Dialog, DialogContent, DialogTrigger } from '@/components/custom-ui/Dialog';
import { LeadForm } from '@/components/custom-ui/LeadForm';
import { Button } from '@/components/custom-ui';
import { cn } from '@/components/custom-ui';

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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e5e3d8]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <img
              src="/images/apps/coursify.png"
              alt="Coursify"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-contain"
            />
            <span className="font-[family-name:var(--font-logo)] text-xl sm:text-2xl text-[#1f644e]">
              Coursify
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-[#7c8e88] hover:text-[#1f644e] transition-colors rounded-full hover:bg-[#f0f5f2]"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <Dialog>
              <DialogTrigger asChild>
                <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#1f644e] text-white rounded-full text-xs font-bold hover:bg-[#184d3c] transition-all shadow-md shadow-[#1f644e]/10">
                  <Plus className="w-4 h-4" />
                  Join Waitlist
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] p-0 border-none shadow-3xl overflow-hidden rounded-[2.5rem] bg-white">
                <div className="relative p-8 sm:p-12">
                  {/* Background Accents */}
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#1f644e]/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-[#f0f5f2]/50 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                      <Sparkles className="w-8 h-8 text-[#1f644e]" />
                    </div>

                    <h2 className="text-4xl font-bold font-['Playfair_Display'] leading-tight mb-4 tracking-tight text-[#1e3a34]">
                      Master <span className="italic text-[#1f644e]">Anything</span> <br />{' '}
                      Instantly.
                    </h2>

                    <p className="text-[#7c8e88] text-sm leading-relaxed mb-10 max-w-[280px] mx-auto">
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
                      <div className="mt-12 pt-8 border-t border-[#f0f5f2] flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                        {waitlistCount >= 4 && (
                          <div className="flex -space-x-3">
                            {[
                              { l: 'RH', b: 'bg-gradient-to-br from-[#1f644e] to-[#0a1a16]' },
                              { l: 'SH', b: 'bg-gradient-to-br from-[#a8c9bf] to-[#1f644e]' },
                              { l: 'AV', b: 'bg-gradient-to-br from-[#164235] to-[#1f644e]' },
                              { l: 'AH', b: 'bg-gradient-to-br from-[#1f644e] to-[#50c878]' },
                            ].map((avatar, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'w-10 h-10 rounded-full border-4 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm shadow-black/5',
                                  avatar.b
                                )}
                              >
                                {avatar.l}
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.25em]">
                          {waitlistCount.toLocaleString()}+ waiting for access
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} type="course" />

      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8 sm:mb-10 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1e3a34] mb-3 tracking-tight">
            Master anything in <span className="text-[#1f644e] italic">seconds</span>
          </h1>
          <p className="text-[#7c8e88] text-sm sm:text-base max-w-lg mx-auto sm:mx-0 leading-relaxed">
            Exam tomorrow? New skill to master? Tell Coursify AI what you need to learn, and get a
            structured, professional-grade course instantly.
          </p>
        </div>

        {courses.length > 0 && (
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-6 sm:mb-8">
            {DIFFICULTY_FILTERS.map((d) => {
              const count = d === 'all' ? courses.length : countByDifficulty[d] || 0;
              const active = difficulty === d;
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold capitalize transition-all ${
                    active
                      ? 'bg-[#1f644e] text-white shadow-md shadow-[#1f644e]/20 scale-105'
                      : 'bg-white border border-[#e5e3d8] text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e]'
                  }`}
                >
                  {d === 'all' ? 'All levels' : d}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
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
                className="text-xs font-bold text-[#1f644e] hover:underline ml-2"
              >
                Reset
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
                <PublicCourseCard key={course.id || course._id} course={course} />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="mt-auto py-10 border-t border-[#e5e3d8] bg-white/50">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
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
