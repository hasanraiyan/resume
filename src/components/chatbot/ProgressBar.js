'use client';

export default function ProgressBar({ progress = 0, articleId = null, isComplete = false }) {
  if (progress === 0 && !articleId) return null;

  return (
    <div className="flex flex-col w-full mb-4 gap-3">
      {/* Progress Container */}
      <div className="flex flex-col gap-2 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/40">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-900">Creating blog article</span>
          <span className="text-sm font-bold text-blue-600">{progress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-neutral-200/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Action Button - only show when complete */}
      {isComplete && articleId && (
        <a
          href={`/admin/articles/${articleId}/edit`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <span>✨ View & Publish Draft</span>
          <span className="text-lg">→</span>
        </a>
      )}
    </div>
  );
}
