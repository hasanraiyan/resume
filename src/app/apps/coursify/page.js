'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Pacifico, Nunito } from 'next/font/google';
import { GraduationCap, Plus, ArrowLeft, RefreshCw, Bot } from 'lucide-react';
import { CoursifyProvider, useCoursify } from '@/context/CoursifyContext';
import CourseCard from '@/components/coursify/CourseCard';
import CreateCourseModal from '@/components/coursify/CreateCourseModal';

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

function CoursifyApp() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isLoading, courses, refresh } = useCoursify();
  const [showCreate, setShowCreate] = useState(false);

  if (status === 'loading') return null;
  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    router.push('/login');
    return null;
  }

  const published = courses.filter((c) => c.status === 'published');
  const drafts = courses.filter((c) => c.status === 'draft');

  return (
    <div
      className={`min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] ${pacifico.variable} ${nunito.variable}`}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fcfbf5]/80 backdrop-blur-md border-b border-[#e5e3d8] px-4 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/apps')}
            className="p-2 hover:bg-[#e5e3d8] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-[#1f644e] rounded-lg flex items-center justify-center">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="font-[family-name:var(--font-logo)] text-2xl">Coursify</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2 rounded-xl border border-[#e5e3d8] bg-white text-[#7c8e88] hover:text-[#1f644e] hover:border-[#1f644e] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1f644e] text-white rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Course</span>
          </button>
        </div>
      </header>

      <main className="p-4 lg:p-8 max-w-5xl mx-auto">
        {isLoading ? (
          <div className="space-y-8">
            <section>
              <div className="h-3 w-20 bg-[#e5e3d8] rounded animate-pulse mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-[#e5e3d8] rounded-2xl overflow-hidden animate-pulse"
                  >
                    <div className="h-28 bg-[#e5e3d8]" />
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
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1f644e] text-white rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Or create manually
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {published.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
                  Published — {published.length}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {published.map((course, i) => (
                    <CourseCard key={course._id} course={course} index={i} />
                  ))}
                </div>
              </section>
            )}

            {drafts.length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
                  Drafts — {drafts.length}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {drafts.map((course, i) => (
                    <CourseCard key={course._id} course={course} index={published.length + i} />
                  ))}
                </div>
              </section>
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
    </div>
  );
}

export default function CoursifyPage() {
  return (
    <CoursifyProvider>
      <CoursifyApp />
    </CoursifyProvider>
  );
}
