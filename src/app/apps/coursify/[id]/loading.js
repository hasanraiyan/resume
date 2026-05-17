'use client';

export default function CourseStudioLoading() {
  return (
    <div className="h-screen bg-[#fcfbf5] flex flex-col overflow-hidden">
      {/* Header Skeleton */}
      <div className="h-14 border-b border-[#e5e3d8] bg-white animate-pulse" />

      {/* Meta Bar Skeleton */}
      <div className="h-10 border-b border-[#e5e3d8] bg-[#fcfbf5] flex items-center gap-4 px-6 animate-pulse">
        <div className="h-4 w-20 bg-[#e5e3d8] rounded-full" />
        <div className="h-4 w-24 bg-[#e5e3d8] rounded-full" />
        <div className="h-4 w-16 bg-[#e5e3d8] rounded-full" />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar Skeleton */}
        <div className="w-72 border-r border-[#e5e3d8] bg-white hidden lg:block animate-pulse p-6 space-y-6">
          <div className="h-6 bg-[#e5e3d8] rounded w-3/4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-4 bg-[#e5e3d8] rounded w-full" />
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <main className="flex-1 p-6 lg:p-10 space-y-8 animate-pulse bg-[#fcfbf5] overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="h-8 bg-[#e5e3d8] rounded w-1/3" />
            <div className="h-20 bg-[#e5e3d8] rounded w-full" />
            <div className="space-y-4 pt-10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-[#e5e3d8] rounded-2xl p-6 space-y-3">
                  <div className="h-5 bg-[#e5e3d8] rounded w-1/4" />
                  <div className="h-3 bg-[#e5e3d8] rounded w-full" />
                  <div className="h-3 bg-[#e5e3d8] rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
