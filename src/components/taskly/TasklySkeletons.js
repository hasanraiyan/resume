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

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="flex items-start gap-4 w-3/4">
        <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
        <Shimmer className="h-16 flex-1" />
      </div>
      <div className="flex items-start gap-4 w-3/4 self-end flex-row-reverse">
        <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
        <Shimmer className="h-12 flex-1" />
      </div>
      <div className="flex items-start gap-4 w-3/4">
        <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
        <Shimmer className="h-24 flex-1" />
      </div>
    </div>
  );
}
