'use client';

export function Shimmer({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded bg-[#e5e3d8] ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[#fcfbf5]/60 to-transparent" />
    </div>
  );
}

function SummaryCardSkeleton({ accent = 'bg-[#1f644e]/10' }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#e5e3d8] bg-white p-5">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Shimmer className="h-6 w-6 rounded-lg bg-white/50" />
      </div>
      <div className="space-y-2">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-6 w-28" />
      </div>
    </div>
  );
}

function SectionHeaderSkeleton({ titleWidth = 'w-24', actionWidth = 'w-28' }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <Shimmer className={`h-4 ${titleWidth}`} />
      <Shimmer className={`h-8 rounded-lg ${actionWidth}`} />
    </div>
  );
}

export function AccountsSkeleton() {
  return (
    <div className="mb-6 pb-4 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCardSkeleton accent="bg-[#1f644e]/10" />
            <SummaryCardSkeleton accent="bg-[#c94c4c]/10" />
            <SummaryCardSkeleton accent="bg-[#1f644e]/10" />
          </div>

          <SectionHeaderSkeleton titleWidth="w-28" actionWidth="w-28" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl border border-[#e5e3d8] bg-white p-5">
                <div className="flex items-start justify-between">
                  <Shimmer className="h-12 w-12 rounded-xl" />
                  <Shimmer className="h-10 w-10 rounded-xl" />
                </div>
                <div className="mt-4">
                  <Shimmer className="h-4 w-28" />
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <Shimmer className="h-3 w-20" />
                      <Shimmer className="h-4 w-20" />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <Shimmer className="h-3 w-24" />
                      <Shimmer className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoriesSkeleton() {
  return (
    <div className="mb-6 pb-4 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryCardSkeleton accent="bg-[#1f644e]/10" />
            <SummaryCardSkeleton accent="bg-[#c94c4c]/10" />
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <Shimmer className="h-4 w-4 rounded" />
              <Shimmer className="h-4 w-16" />
              <Shimmer className="h-6 w-8 rounded-full" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={`income-${item}`}
                  className="flex items-center gap-3 rounded-xl border border-[#e5e3d8] bg-white p-4"
                >
                  <Shimmer className="h-10 w-10 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <Shimmer className="h-4 w-24" />
                  </div>
                  <Shimmer className="h-8 w-8 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Shimmer className="h-4 w-4 rounded" />
              <Shimmer className="h-4 w-20" />
              <Shimmer className="h-6 w-8 rounded-full" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={`expense-${item}`}
                  className="flex items-center gap-3 rounded-xl border border-[#e5e3d8] bg-white p-4"
                >
                  <Shimmer className="h-10 w-10 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <Shimmer className="h-4 w-28" />
                  </div>
                  <Shimmer className="h-8 w-8 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Shimmer className="h-10 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalysisSkeleton() {
  return (
    <div className="mb-6 pb-4 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SummaryCardSkeleton accent="bg-[#c94c4c]/10" />
            <SummaryCardSkeleton accent="bg-[#1f644e]/10" />
          </div>

          <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-1 rounded-xl border border-[#e5e3d8] bg-white p-1">
              {[1, 2, 3, 4].map((item) => (
                <Shimmer key={item} className="h-9 w-16 rounded-lg" />
              ))}
            </div>
            <Shimmer className="h-9 w-28 rounded-xl" />
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-[#e5e3d8] bg-white p-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <Shimmer className="h-[160px] w-[160px] rounded-full" />
                <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 w-full">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Shimmer className="h-3 w-3 rounded-full" />
                      <Shimmer className="h-3 w-20" />
                      <Shimmer className="ml-auto h-3 w-8" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#e5e3d8] bg-white p-6">
              <Shimmer className="mb-4 h-4 w-24" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shimmer className="h-8 w-8 rounded-lg" />
                        <Shimmer className="h-4 w-24" />
                      </div>
                      <Shimmer className="h-4 w-20" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Shimmer className="h-2 flex-1 rounded-full" />
                      <Shimmer className="h-3 w-10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecordsSkeleton() {
  return (
    <div className="mb-6 pb-4 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCardSkeleton accent="bg-[#c94c4c]/10" />
            <SummaryCardSkeleton accent="bg-[#1f644e]/10" />
            <SummaryCardSkeleton accent="bg-[#1f644e]/10" />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shimmer className="h-10 w-10 rounded-lg" />
              <Shimmer className="h-4 w-28" />
              <Shimmer className="h-10 w-10 rounded-lg" />
            </div>
          </div>

          <div className="mb-4">
            <Shimmer className="h-11 w-full rounded-xl" />
          </div>

          <div className="space-y-6">
            {[1, 2].map((group) => (
              <div key={group}>
                <div className="mb-3 flex items-center gap-3">
                  <Shimmer className="h-3 w-28" />
                  <div className="h-px flex-1 bg-[#e5e3d8]" />
                  <Shimmer className="h-3 w-16" />
                </div>
                <div className="overflow-hidden rounded-xl border border-[#e5e3d8] bg-white">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={`${group}-${item}`}
                      className="flex items-center justify-between border-b border-[#e5e3d8] p-4 last:border-b-0"
                    >
                      <div className="flex flex-1 items-center gap-3">
                        <Shimmer className="h-10 w-10 rounded-xl" />
                        <div className="flex-1">
                          <Shimmer className="h-4 w-28" />
                          <Shimmer className="mt-2 h-3 w-24" />
                          <Shimmer className="mt-2 h-3 w-32" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Shimmer className="h-4 w-20" />
                        <Shimmer className="h-8 w-8 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] min-w-0 flex-col overflow-x-hidden bg-[#fcfbf5] pb-16 lg:pb-0">
      <div className="min-w-0 flex-1 overflow-hidden px-4 py-4 sm:px-6">
        <div className="flex h-full flex-col gap-4 rounded-[28px] bg-gradient-to-b from-white/50 to-neutral-50/50 p-3 sm:p-5">
          <div className="flex gap-3">
            <Shimmer className="mt-1 h-7 w-7 shrink-0 rounded-full" />
            <div className="w-full max-w-[92%] space-y-3">
              <Shimmer className="h-10 w-52 rounded-full" />
              <Shimmer className="h-14 w-[78%] rounded-2xl" />
              <Shimmer className="h-40 w-full rounded-[26px]" />
              <Shimmer className="h-24 w-[88%] rounded-2xl" />
            </div>
          </div>

          <div className="flex flex-row-reverse gap-3 justify-start">
            <Shimmer className="mt-1 h-7 w-7 shrink-0 rounded-full" />
            <div className="w-full max-w-[60%] flex justify-end">
              <Shimmer className="h-16 w-full rounded-2xl" />
            </div>
          </div>

          <div className="flex gap-3">
            <Shimmer className="mt-1 h-7 w-7 shrink-0 rounded-full" />
            <div className="w-full max-w-[92%] space-y-3">
              <Shimmer className="h-11 w-44 rounded-full" />
              <Shimmer className="h-28 w-[82%] rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-neutral-200/50 bg-white p-3">
        <div className="rounded-3xl border border-neutral-200/80 bg-white shadow-sm">
          <div className="px-4 pt-3 pb-2">
            <Shimmer className="h-4 w-64" />
          </div>
          <div className="flex items-center justify-end px-2 pb-2">
            <Shimmer className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
