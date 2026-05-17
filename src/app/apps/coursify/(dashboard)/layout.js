'use client';

import { useRouter } from 'next/navigation';
import { useCoursify } from '@/context/CoursifyContext';
import { CoursifyNavigation } from '@/components/coursify/CoursifyNavigation';
import CreateCourseModal from '@/components/coursify/CreateCourseModal';
import ImportBundleModal from '@/components/coursify/ImportBundleModal';

export default function CoursifyDashboardLayout({ children }) {
  const router = useRouter();
  const { showCreateModal, setShowCreateModal, showImportModal, setShowImportModal } =
    useCoursify();

  return (
    <>
      <CoursifyNavigation />

      <main className="p-4 lg:p-8 max-w-5xl mx-auto">{children}</main>

      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(course) => {
            setShowCreateModal(false);
            router.push(`/apps/coursify/${course._id}`);
          }}
        />
      )}
      {showImportModal && (
        <ImportBundleModal
          onClose={() => setShowImportModal(false)}
          onImported={(id) => {
            setShowImportModal(false);
            router.push(`/apps/coursify/${id}`);
          }}
        />
      )}
    </>
  );
}
