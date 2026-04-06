'use client';

export function Shimmer({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-[#e5e3d8] ${className}`} />;
}

export function TasklyTabSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Shimmer className="h-24" />
        <Shimmer className="h-24" />
        <Shimmer className="h-24" />
      </div>
      <Shimmer className="h-12" />
      <Shimmer className="h-48" />
      <Shimmer className="h-48" />
    </div>
  );
}
