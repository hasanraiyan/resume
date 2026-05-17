'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import { useCoursify } from '@/context/CoursifyContext';
import { toast } from 'sonner';

export default function TrashPage() {
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
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/login');
      return;
    }
    load();
  }, [session, status, router, load]);

  if (status === 'loading') return null;
  if (!session || session.user.role !== 'admin') return null;

  const handleRestore = async (id) => {
    const success = await restoreCourse(id);
    if (success) load();
  };

  const handleDeletePermanent = async (id) => {
    if (!confirm('Are you sure? This action is permanent.')) return;
    const success = await permanentlyDeleteCourse(id);
    if (success) load();
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure? This will delete all courses in trash permanently.')) return;
    const success = await emptyTrash();
    if (success) load();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold text-[#7c8e88]">
        <button
          onClick={() => router.push('/apps/coursify')}
          className="hover:text-[#1f644e] transition-colors"
        >
          Coursify
        </button>
        <ChevronLeft className="w-3 h-3 rotate-180" />
        <span className="text-[#1e3a34]">Trash</span>
      </div>

      <div className="flex items-center justify-between border-b border-[#e5e3d8] pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-[#c94c4c]" />
            Deleted Courses
          </h1>
          <p className="text-sm text-[#7c8e88] mt-1">
            Courses in the trash will be permanently deleted after 30 days.
          </p>
        </div>
        {deletedCourses.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="flex items-center gap-2 px-4 py-2 bg-[#fef2f2] text-[#c94c4c] rounded-xl text-xs font-bold hover:bg-[#fee2e2] transition-colors border border-[#fecaca]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Empty Trash
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-white border border-[#e5e3d8] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : deletedCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4 text-[#7c8e88]">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1e3a34] mb-2">Trash is empty</h2>
          <p className="text-sm text-[#7c8e88] max-w-sm mb-6">
            You don&apos;t have any deleted courses at the moment.
          </p>
          <button
            onClick={() => router.push('/apps/coursify')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1f644e] text-white rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Library
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {deletedCourses.map((course) => (
              <motion.div
                key={course._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white border border-[#e5e3d8] rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[#1e3a34] line-clamp-2 leading-snug">
                      {course.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-[#f0f5f2] text-[#1f644e] text-[10px] font-bold rounded-md capitalize">
                      <Layers className="w-3 h-3" />
                      {course.difficulty}
                    </span>
                    {course.estimatedDuration && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-white border border-[#e5e3d8] text-[#7c8e88] text-[10px] font-bold rounded-md">
                        <Clock className="w-3 h-3" />
                        {course.estimatedDuration}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-[#7c8e88] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      Deleted on {new Date(course.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#fcfbf5] border-t border-[#e5e3d8] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleRestore(course._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-[#e5e3d8] text-[#1f644e] rounded-xl text-xs font-bold hover:bg-[#f0f5f2] hover:border-[#1f644e] transition-colors shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore
                  </button>
                  <button
                    onClick={() => handleDeletePermanent(course._id)}
                    className="p-2 text-[#7c8e88] hover:text-[#c94c4c] hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete Permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
