'use client';

export function BlockSkeleton() {
  return (
    <div className="my-6 rounded-2xl bg-[#f0f5f2] p-6 animate-pulse space-y-4">
      {/* Title */}
      <div className="h-6 w-32 rounded-lg bg-[#d4e6db]" />

      {/* Content lines */}
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-[#c2d8ce]" />
        <div className="h-4 w-5/6 rounded bg-[#c2d8ce]" />
        <div className="h-4 w-4/5 rounded bg-[#c2d8ce]" />
      </div>

      {/* Spacing */}
      <div className="h-2" />

      {/* More content */}
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-[#d4e6db]" />
        <div className="h-4 w-5/6 rounded bg-[#c2d8ce]" />
        <div className="h-4 w-4/5 rounded bg-[#c2d8ce]" />
      </div>
    </div>
  );
}
