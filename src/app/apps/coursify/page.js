'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Pacifico, Nunito } from 'next/font/google';
import {
  GraduationCap,
  Plus,
  RefreshCw,
  Bot,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileUp,
  Settings,
  Cpu,
  Trash2,
  TrendingUp,
  FileText,
  Users,
  History,
} from 'lucide-react';
import { CoursifyProvider, useCoursify } from '@/context/CoursifyContext';
import CourseCard from '@/components/coursify/CourseCard';
import CreateCourseModal from '@/components/coursify/CreateCourseModal';
import ImportBundleModal from '@/components/coursify/ImportBundleModal';
import { CoursifyAnalytics } from '@/components/coursify/analytics/CoursifyAnalytics';
import SessionProvider from '@/components/SessionProvider';
import { cn } from '@/utils/classNames';
import { ResearchHistory } from '@/components/coursify/analytics/ResearchHistory';
import { CoursifyLeads } from '@/components/coursify/analytics/CoursifyLeads';

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

function CoursifyApp() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isLoading, courses, refresh } = useCoursify();
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'analytics'
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [statusTab, setStatusTab] = useState('all');
  const [page, setPage] = useState(1);
  const inputRef = useRef(null);

  const filtered = useMemo(
    () => filterCourses(courses, activeQuery, difficulty, statusTab),
    [courses, activeQuery, difficulty, statusTab]
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page when filters change
  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleSearch = () => {
    setActiveQuery(query);
    setPage(1);
  };

  const handleClear = () => {
    setQuery('');
    setActiveQuery('');
    inputRef?.current?.focus();
  };

  const handleResetAll = () => {
    setQuery('');
    setActiveQuery('');
    setDifficulty('all');
    setStatusTab('all');
    setPage(1);
  };

  const isFiltered = activeQuery.trim().length > 0 || difficulty !== 'all' || statusTab !== 'all';

  const publishedCount = courses.filter((c) => c.status === 'published').length;
  const draftCount = courses.filter((c) => c.status === 'draft').length;

  // Per-difficulty counts for the filter chips
  const countByDifficulty = courses.reduce((acc, c) => {
    acc[c.difficulty] = (acc[c.difficulty] || 0) + 1;
    return acc;
  }, {});

  if (status === 'loading') return null;
  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    useEffect(() => {
      router.push('/login');
    }, [router]);
    return null;
  }

  return (
    <div
      className={`min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] ${pacifico.variable} ${nunito.variable}`}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fcfbf5]/80 backdrop-blur-md border-b border-[#e5e3d8] px-4 lg:px-8 py-2 flex items-center justify-between gap-8">
        <div className="flex items-center gap-8 shrink-0">
          <div className="flex items-center gap-2 pr-4 border-r border-[#e5e3d8]">
            <div className="h-8 w-8 bg-[#1f644e] rounded-lg flex items-center justify-center shadow-sm">
              <GraduationCap className="text-white w-4.5 h-4.5" />
            </div>
            <span className="font-[family-name:var(--font-logo)] text-xl hidden lg:block">
              Coursify
            </span>
          </div>

          {/* Desktop App Style Menu Bar */}
          <nav className="hidden md:flex items-center gap-1">
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1f644e] transition-colors cursor-default group-hover:bg-[#f0f5f2] group-hover:text-[#1f644e]">
                <Settings className="w-3 h-3" />
                Manage
                <ChevronDown className="w-3 h-3 opacity-50 group-hover:rotate-180 transition-transform duration-200" />
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#e5e3d8] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1">
                <button
                  onClick={() => {
                    setActiveTab('courses');
                    setShowCreate(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Course
                </button>
                <button
                  onClick={() => {
                    setActiveTab('courses');
                    setShowImport(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] rounded-lg transition-colors"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  Import Bundle
                </button>
              </div>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1f644e] transition-colors cursor-default group-hover:bg-[#f0f5f2] group-hover:text-[#1f644e]">
                <Cpu className="w-3 h-3" />
                System
                <ChevronDown className="w-3 h-3 opacity-50 group-hover:rotate-180 transition-transform duration-200" />
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#e5e3d8] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1">
                <button
                  onClick={() => setActiveTab('courses')}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-colors',
                    activeTab === 'courses'
                      ? 'bg-[#f0f5f2] text-[#1f644e]'
                      : 'text-[#1e3a34] hover:bg-[#f0f5f2]'
                  )}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Course Library
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-colors',
                    activeTab === 'analytics'
                      ? 'bg-[#f0f5f2] text-[#1f644e]'
                      : 'text-[#1e3a34] hover:bg-[#f0f5f2]'
                  )}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Intelligence
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-colors',
                    activeTab === 'history'
                      ? 'bg-[#f0f5f2] text-[#1f644e]'
                      : 'text-[#1e3a34] hover:bg-[#f0f5f2]'
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                  All Artifacts
                </button>
                <button
                  onClick={() => setActiveTab('leads')}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-colors',
                    activeTab === 'leads'
                      ? 'bg-[#f0f5f2] text-[#1f644e]'
                      : 'text-[#1e3a34] hover:bg-[#f0f5f2]'
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  Waitlist
                </button>
                <div className="h-px bg-[#e5e3d8] my-1 mx-2" />
                <button
                  onClick={refresh}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh Engine
                </button>
                <button
                  onClick={() => router.push('/apps/coursify/trash')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#1e3a34] hover:bg-red-50 hover:text-[#c94c4c] rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  View Trash
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Search & Profile area */}
        <div className="flex items-center gap-3">
          <div className="max-w-xs hidden lg:block">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8e88]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  activeTab === 'analytics' ? 'Filter analytics...' : 'Search courses...'
                }
                className="w-48 bg-white border border-[#e5e3d8] rounded-xl py-1.5 pl-10 pr-4 text-xs outline-none focus:border-[#1f644e] focus:w-64 transition-all"
              />
            </form>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1f644e] text-white rounded-xl text-xs font-bold hover:bg-[#17503e] active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </button>
        </div>
      </header>

      <main className="p-4 lg:p-8 max-w-5xl mx-auto">
        {activeTab === 'analytics' ? (
          <CoursifyAnalytics />
        ) : activeTab === 'history' ? (
          <ResearchHistory />
        ) : activeTab === 'leads' ? (
          <CoursifyLeads />
        ) : isLoading ? (
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
                      <div className="h-2 bg-[#e5e3d8] rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-[#1f644e]" />
            </div>
            <h2 className="text-xl font-bold text-[#1e3a34] mb-2">No courses yet</h2>
            <p className="text-sm text-[#7c8e88] max-w-sm mb-3">
              Connect Claude or ChatGPT to the Coursify MCP server and ask it to build you a course.
            </p>
            <p className="text-xs text-[#7c8e88] bg-[#f0f5f2] rounded-xl px-4 py-2 font-mono mb-6">
              MCP endpoint: /api/mcp/coursify
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setActiveTab('history')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#f0f5f2] text-[#1f644e] rounded-xl text-sm font-bold hover:bg-[#e2ede7] transition-colors"
              >
                <History className="w-4 h-4" />
                View Research Artifacts
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[#e5e3d8] text-[#7c8e88] rounded-xl text-sm font-bold hover:border-[#1f644e] hover:text-[#1f644e] transition-colors"
              >
                <FileUp className="w-4 h-4" />
                Import Bundle
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1f644e] text-white rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Or create manually
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile search (only visible when not in desktop header) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex md:hidden flex-col sm:flex-row gap-2 max-w-xl"
            >
              <div className="flex-1 flex items-center gap-2 bg-white border border-[#e5e3d8] rounded-xl px-3 py-2.5 focus-within:border-[#1f644e] transition-colors">
                <Search className="w-4 h-4 text-[#7c8e88] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses…"
                  className="flex-1 text-sm text-[#1e3a34] bg-transparent outline-none placeholder:text-[#b0bfbb]"
                />
              </div>
            </form>

            {/* Filter chips: status + difficulty */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status chips */}
              {[
                { key: 'all', label: 'All', count: courses.length },
                { key: 'published', label: 'Published', count: publishedCount },
                { key: 'draft', label: 'Draft', count: draftCount },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(setStatusTab)(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    statusTab === tab.key
                      ? 'bg-[#1f644e] text-white'
                      : 'bg-white border border-[#e5e3d8] text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e]'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      statusTab === tab.key
                        ? 'bg-white/20 text-white'
                        : 'bg-[#f0f5f2] text-[#7c8e88]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}

              {/* Difficulty chips */}
              {DIFFICULTY_FILTERS.map((d) => {
                const count = d === 'all' ? courses.length : countByDifficulty[d] || 0;
                const active = difficulty === d;
                return (
                  <button
                    key={d}
                    onClick={() => handleFilterChange(setDifficulty)(d)}
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
                <button
                  onClick={() => {
                    setQuery('');
                    setDifficulty('all');
                    setStatusTab('all');
                  }}
                  className="text-xs font-bold text-[#1f644e] hover:underline mt-2"
                >
                  Clear all filters
                </button>
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
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-[#e5e3d8] text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                          p === page
                            ? 'bg-[#1f644e] text-white'
                            : 'text-[#7c8e88] hover:bg-[#f0f5f2]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
        )}
      </main>

      {showCreate && (
        <CreateCourseModal
          onClose={() => setShowCreate(false)}
          onCreated={(course) => router.push(`/apps/coursify/${course._id}`)}
        />
      )}
      {showImport && (
        <ImportBundleModal
          onClose={() => setShowImport(false)}
          onImported={(id) => router.push(`/apps/coursify/${id}`)}
        />
      )}
    </div>
  );
}

export default function CoursifyPage() {
  return (
    <SessionProvider>
      <CoursifyProvider>
        <CoursifyApp />
      </CoursifyProvider>
    </SessionProvider>
  );
}
