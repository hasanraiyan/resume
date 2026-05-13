'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Pacifico, Nunito } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Trash2,
  RefreshCw,
  ChevronLeft,
  RotateCcw,
  AlertTriangle,
  Clock,
  History,
  FileText,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import { CoursifyProvider, useCoursify } from '@/context/CoursifyContext';
import SessionProvider from '@/components/SessionProvider';
import { toast } from 'sonner';

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

function TrashPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { fetchDeletedCourses, restoreCourse, permanentlyDeleteCourse, emptyTrash } = useCoursify();
  const [deletedCourses, setDeletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchDeletedCourses();
    setDeletedCourses(data);
    setLoading(false);
  }, [fetchDeletedCourses]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      load();
    }
  }, [session, load]);

  const handleRestore = async (id) => {
    const ok = await restoreCourse(id);
    if (ok) {
      setDeletedCourses((prev) => prev.filter((c) => (c._id || c.id) !== id));
    }
  };

  const handlePermanentDelete = async (id, title) => {
    if (
      confirm(
        `Permanently delete "${title}"? This action is irreversible and will delete all associated modules and sections.`
      )
    ) {
      const ok = await permanentlyDeleteCourse(id);
      if (ok) {
        setDeletedCourses((prev) => prev.filter((c) => (c._id || c.id) !== id));
      }
    }
  };

  const handleEmptyTrash = async () => {
    if (confirm('Permanently delete all items in the trash? This action cannot be undone.')) {
      const ok = await emptyTrash();
      if (ok) {
        setDeletedCourses([]);
      }
    }
  };

  if (status === 'loading') return null;
  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    router.push('/login');
    return null;
  }

  return (
    <div
      className={`min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] selection:bg-[#1f644e]/10 selection:text-[#1f644e] ${pacifico.variable} ${nunito.variable}`}
    >
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#1f644e] rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-[#7c8e88] rounded-full blur-[150px]" />
      </div>

      <header className="sticky top-0 z-40 bg-[#fcfbf5]/80 backdrop-blur-md border-b border-[#e5e3d8] px-4 lg:px-10 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/apps/coursify')}
            className="group flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2] transition-all"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-sm font-bold hidden sm:inline">Back</span>
          </button>
          <div className="h-8 w-[1px] bg-[#e5e3d8]" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#f0f5f2] rounded-2xl flex items-center justify-center border border-[#1f644e]/10">
              <Trash2 className="text-[#1f644e] w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none">Trash</h1>
              <p className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest mt-1">
                Management
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={load}
            title="Refresh Trash"
            className="p-2.5 rounded-xl text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2] transition-all active:scale-95"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {deletedCourses.length > 0 && (
            <button
              onClick={handleEmptyTrash}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 border border-red-100 rounded-xl text-sm font-black hover:bg-red-50 active:scale-95 transition-all shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Empty Trash
            </button>
          )}
        </div>
      </header>

      <main className="relative p-6 lg:p-12 max-w-5xl mx-auto min-h-[calc(100vh-80px)]">
        {/* Info Banner & Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="md:col-span-2 bg-white/50 backdrop-blur-sm border border-amber-200/60 rounded-3xl p-6 flex gap-5 items-start shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
              <History className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-900 mb-1">30-Day Recovery Window</h3>
              <p className="text-sm text-amber-800/80 leading-relaxed font-medium">
                Deleted courses and their content are kept for exactly 30 days. After this period,
                they are permanently purged from our servers to ensure database health and privacy.
              </p>
            </div>
          </div>

          <div className="bg-[#1f644e] rounded-3xl p-6 text-white shadow-lg shadow-[#1f644e]/10 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Layers className="w-24 h-24 rotate-12" />
            </div>
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-1">
                Items in Trash
              </p>
              <p className="text-4xl font-black">{deletedCourses.length}</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              <Info className="w-3 h-3" />
              AUTO-CLEANUP ACTIVE
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-white/40 border border-[#e5e3d8] rounded-[2rem] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {deletedCourses.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-32 text-center"
                >
                  <div className="h-24 w-24 bg-[#f0f5f2] rounded-[2.5rem] flex items-center justify-center mb-8 border border-[#1f644e]/5">
                    <Trash2 className="w-10 h-10 text-[#7c8e88]/40" />
                  </div>
                  <h2 className="text-2xl font-black text-[#1e3a34] mb-3">
                    Your trash is pristine
                  </h2>
                  <p className="text-sm text-[#7c8e88] font-medium max-w-xs mx-auto">
                    Any courses you delete will spend 30 days here before being permanently removed.
                  </p>
                </motion.div>
              ) : (
                deletedCourses.map((course, index) => (
                  <motion.div
                    key={course._id || course.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white border border-[#e5e3d8] rounded-[2.5rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-[#1f644e]/30 hover:shadow-xl hover:shadow-[#1f644e]/5 transition-all"
                  >
                    <div className="flex-1 min-w-0 flex items-start gap-5">
                      <div className="h-16 w-16 rounded-2xl bg-[#fcfbf5] border border-[#e5e3d8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-500 overflow-hidden relative">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[0.5]"
                          />
                        ) : (
                          <FileText className="w-6 h-6 text-[#7c8e88]/30" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-xl text-[#1e3a34] truncate mb-2 group-hover:text-[#1f644e] transition-colors">
                          {course.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                          <div className="flex items-center gap-1.5 text-[11px] font-black text-[#7c8e88] bg-[#fcfbf5] px-2.5 py-1.5 rounded-xl border border-[#e5e3d8]/60">
                            <Layers className="w-3.5 h-3.5" />
                            {course.sectionCount} SECTIONS
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-black text-red-500/70 bg-red-50/50 px-2.5 py-1.5 rounded-xl border border-red-100/50">
                            <Calendar className="w-3.5 h-3.5" />
                            DELETED ON{' '}
                            {course.deletedAt
                              ? new Date(course.deletedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'RECENTLY'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleRestore(course._id || course.id)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#f0f5f2] text-[#1f644e] rounded-2xl text-xs font-black hover:bg-[#1f644e] hover:text-white active:scale-95 transition-all shadow-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(course._id || course.id, course.title)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-black hover:bg-red-600 hover:text-white active:scale-95 transition-all shadow-sm border border-red-100/50"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Purge
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      <footer className="py-12 px-6 text-center text-[10px] font-bold text-[#7c8e88] uppercase tracking-[0.3em] opacity-40">
        Coursify Engine · Secure Data Management
      </footer>
    </div>
  );
}

export default function CoursifyTrashPage() {
  return (
    <SessionProvider>
      <CoursifyProvider>
        <TrashPage />
      </CoursifyProvider>
    </SessionProvider>
  );
}
