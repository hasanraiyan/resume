'use client';

import { BarChart3 } from 'lucide-react';

export default function CoursifyDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Tab/Filter Skeleton */}
      <div className="flex items-center gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-24 bg-[#e5e3d8] rounded-full" />
        ))}
      </div>

      {/* Title Skeleton */}
      <section>
        <div className="h-3 w-32 bg-[#e5e3d8] rounded mb-6" />

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-[#e5e3d8] rounded-2xl overflow-hidden">
              <div className="h-44 bg-[#e5e3d8]" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-[#e5e3d8] rounded w-3/4" />
                <div className="h-3 bg-[#e5e3d8] rounded w-full" />
                <div className="h-3 bg-[#e5e3d8] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Global Activity Indicator (Floating) */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="bg-white border border-[#e5e3d8] shadow-xl rounded-2xl p-4 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 border-3 border-[#f0f5f2] border-t-[#1f644e] rounded-full animate-spin" />
            <BarChart3 className="w-4 h-4 text-[#1f644e] absolute inset-0 m-auto" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1e3a34]">Syncing...</p>
            <p className="text-[10px] text-[#7c8e88] font-bold uppercase tracking-widest">
              Please wait
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
