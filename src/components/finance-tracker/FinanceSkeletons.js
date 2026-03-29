'use client';

export function Shimmer({ className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-[#e5e3d8] rounded ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#fcfbf5]/60 to-transparent -translate-x-full animate-shimmer" />
    </div>
  );
}

export function RecordsSkeleton() {
  return (
    <div className="pb-4">
      {/* Period Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <Shimmer className="w-6 h-6 rounded-full" />
        <Shimmer className="w-32 h-4" />
        <div className="flex items-center gap-1">
          <Shimmer className="w-6 h-6 rounded-full" />
          <Shimmer className="w-6 h-6 rounded-full" />
        </div>
      </div>

      {/* Summary Bar */}
      <div className="flex text-center border-b border-[#e5e3d8] pb-2 mb-4 mx-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <Shimmer className="w-14 h-2.5" />
            <Shimmer className="w-20 h-4" />
          </div>
        ))}
      </div>

      {/* Transaction Groups */}
      {[1, 2, 3].map((group) => (
        <div key={group} className="px-4 mb-4">
          <Shimmer className="w-40 h-3 mb-2" />
          {[1, 2].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between py-3 border-b border-[#e5e3d8]"
            >
              <div className="flex items-center gap-3">
                <Shimmer className="w-9 h-9 rounded-full" />
                <div className="space-y-1">
                  <Shimmer className="w-24 h-3.5" />
                  <Shimmer className="w-16 h-2.5" />
                </div>
              </div>
              <Shimmer className="w-20 h-4" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AnalysisSkeleton() {
  return (
    <div className="pb-4">
      {/* Period Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <Shimmer className="w-6 h-6 rounded-full" />
        <Shimmer className="w-32 h-4" />
        <div className="flex items-center gap-1">
          <Shimmer className="w-6 h-6 rounded-full" />
          <Shimmer className="w-6 h-6 rounded-full" />
        </div>
      </div>

      {/* Summary */}
      <div className="flex text-center border-b border-[#e5e3d8] pb-2 mb-4 mx-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <Shimmer className="w-14 h-2.5" />
            <Shimmer className="w-20 h-4" />
          </div>
        ))}
      </div>

      {/* View Dropdown */}
      <div className="flex justify-center mb-6">
        <Shimmer className="w-40 h-8 rounded" />
      </div>

      {/* Donut + Legend */}
      <div className="flex items-center gap-4 mb-6 justify-center px-4">
        <Shimmer className="w-[140px] h-[140px] rounded-full" />
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Shimmer className="w-2.5 h-2.5 rounded-full" />
              <Shimmer className="w-16 h-3" />
              <Shimmer className="w-10 h-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Category Bars */}
      <div className="space-y-3 px-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Shimmer className="w-6 h-6 rounded-full" />
                <Shimmer className="w-20 h-3.5" />
              </div>
              <Shimmer className="w-16 h-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <Shimmer className="flex-1 h-1.5 rounded-full" />
              <Shimmer className="w-10 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AccountsSkeleton() {
  return (
    <div className="pb-4">
      {/* Net Worth Header */}
      <div className="flex justify-center my-4 px-4">
        <Shimmer className="w-48 h-4" />
      </div>

      {/* Summary */}
      <div className="flex text-center border-b border-[#e5e3d8] pb-2 mb-4 mx-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <Shimmer className="w-20 h-2.5" />
            <Shimmer className="w-24 h-4" />
          </div>
        ))}
      </div>

      {/* Section Label */}
      <div className="px-4 mb-2">
        <Shimmer className="w-16 h-3" />
      </div>

      {/* Account List */}
      <div className="px-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border border-[#e5e3d8] bg-[#faf9ed] rounded-lg p-3 flex justify-between items-center"
          >
            <div className="flex gap-3 items-center">
              <Shimmer className="w-10 h-8 rounded" />
              <div className="space-y-1">
                <Shimmer className="w-24 h-3.5" />
                <Shimmer className="w-32 h-3" />
              </div>
            </div>
            <Shimmer className="w-5 h-5 rounded-full" />
          </div>
        ))}
      </div>

      {/* Add Button */}
      <div className="flex justify-center mt-6">
        <Shimmer className="w-44 h-9 rounded" />
      </div>
    </div>
  );
}

export function CategoriesSkeleton() {
  return (
    <div className="pb-4">
      {/* Net Worth Header */}
      <div className="flex justify-center my-4 px-4">
        <Shimmer className="w-48 h-4" />
      </div>

      {/* Income Categories */}
      <div className="mb-6">
        <div className="px-4 mb-2">
          <Shimmer className="w-32 h-3" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 px-4">
            <div className="flex items-center gap-3">
              <Shimmer className="w-7 h-7 rounded-full" />
              <Shimmer className="w-20 h-3.5" />
            </div>
            <Shimmer className="w-5 h-5 rounded-full" />
          </div>
        ))}
      </div>

      {/* Expense Categories */}
      <div className="mb-6">
        <div className="px-4 mb-2">
          <Shimmer className="w-32 h-3" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 px-4">
            <div className="flex items-center gap-3">
              <Shimmer className="w-7 h-7 rounded-full" />
              <Shimmer className="w-20 h-3.5" />
            </div>
            <Shimmer className="w-5 h-5 rounded-full" />
          </div>
        ))}
      </div>

      {/* Add Button */}
      <div className="flex justify-center mt-6">
        <Shimmer className="w-48 h-9 rounded" />
      </div>
    </div>
  );
}

export function BudgetsSkeleton() {
  return (
    <div className="pb-4 px-4">
      {/* Month Label */}
      <div className="flex justify-center my-4">
        <Shimmer className="w-28 h-3" />
      </div>

      {/* Budget Cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-[#e5e3d8] bg-[#faf9ed] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shimmer className="w-7 h-7 rounded-full" />
                <Shimmer className="w-20 h-3.5" />
              </div>
              <Shimmer className="w-24 h-3" />
            </div>
            <Shimmer className="h-1.5 rounded-full mb-1" />
            <div className="flex justify-between">
              <Shimmer className="w-12 h-2.5" />
              <Shimmer className="w-16 h-2.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
