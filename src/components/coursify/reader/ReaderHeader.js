import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Clock, BookOpen, Menu, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const DIFFICULTY_COLORS = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

/**
 * Shared Header for the Coursify Reader.
 * @param {object} course - The course object.
 * @param {boolean} showOverview - If the overview page is currently active.
 * @param {function} onToggleSidebar - Function to toggle the sidebar.
 * @param {React.ReactNode} actions - Optional extra actions (e.g., admin buttons).
 */
export function ReaderHeader({ course, showOverview, onToggleSidebar, actions }) {
  const router = useRouter();

  if (!course) return null;

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: course.title,
      text: course.description || `Check out this course: ${course.title}`,
      url: url,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
        toast.error('Could not share link');
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e5e3d8] px-4 lg:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => router.push('/coursify')}
          className="p-1.5 hover:bg-[#f0f5f2] rounded-full transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <img
          src="/images/apps/coursify.png"
          alt="Coursify"
          className="h-6 w-6 rounded-md object-contain shrink-0 hidden sm:block"
        />
        <span className="font-[family-name:var(--font-logo)] text-lg text-[#1f644e] shrink-0 hidden sm:block">
          Coursify
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-[#e5e3d8] shrink-0 hidden sm:block" />
        <h1 className="font-bold text-[#1e3a34] text-sm lg:text-base truncate">{course.title}</h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
              DIFFICULTY_COLORS[course.difficulty] || DIFFICULTY_COLORS.beginner
            }`}
          >
            {course.difficulty}
          </span>
          {course.estimatedDuration && (
            <span className="flex items-center gap-1 text-[10px] text-[#7c8e88] font-bold">
              <Clock className="w-3 h-3" />
              {course.estimatedDuration}
            </span>
          )}
          {showOverview && (
            <span className="flex items-center gap-1 text-[10px] text-[#1f644e] font-bold">
              <BookOpen className="w-3 h-3" />
              Overview
            </span>
          )}
        </div>

        <button
          onClick={handleShare}
          className="p-1.5 hover:bg-[#f0f5f2] rounded-full transition-colors text-[#7c8e88] hover:text-[#1f644e]"
          title="Share Course"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {actions}

        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg border border-[#e5e3d8] bg-white text-[#7c8e88] lg:hidden"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
