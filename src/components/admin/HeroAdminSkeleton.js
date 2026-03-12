'use client';

import { Card } from '@/components/ui';

function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 animate-pulse ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
    </div>
  );
}

function SkeletonField({ labelWidth = 'w-24', inputHeight = 'h-12' }) {
  return (
    <div className="space-y-2">
      <SkeletonBlock className={`h-4 ${labelWidth}`} />
      <SkeletonBlock className={`${inputHeight} w-full rounded-lg`} />
    </div>
  );
}

function SectionCard({ titleWidth, children }) {
  return (
    <Card className="border border-neutral-200 p-6 shadow-none">
      <div className="space-y-4">
        <SkeletonBlock className={`h-7 ${titleWidth}`} />
        {children}
      </div>
    </Card>
  );
}

export default function HeroAdminSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <SkeletonBlock className="h-10 w-44 rounded-lg" />
          <SkeletonBlock className="h-4 w-40" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-8 w-16 rounded-md" />
          <SkeletonBlock className="h-4 w-10" />
          <SkeletonBlock className="h-8 w-16 rounded-md" />
          <SkeletonBlock className="h-4 w-14" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <SectionCard titleWidth="w-20">
            <SkeletonBlock className="h-12 w-full rounded-lg" />
          </SectionCard>

          <SectionCard titleWidth="w-24">
            <div className="space-y-4">
              <SkeletonField labelWidth="w-14" />
              <SkeletonField labelWidth="w-28" />
              <SkeletonField labelWidth="w-14" />
            </div>
          </SectionCard>

          <SectionCard titleWidth="w-32">
            <div className="space-y-4">
              <SkeletonField labelWidth="w-16" />
              <SkeletonField labelWidth="w-16" />
              <SkeletonField labelWidth="w-24" inputHeight="h-28" />
            </div>
          </SectionCard>

          <SectionCard titleWidth="w-48">
            <div className="space-y-6">
              <div className="space-y-3">
                <SkeletonBlock className="h-5 w-28" />
                <SkeletonBlock className="h-12 w-full rounded-lg" />
                <SkeletonBlock className="h-12 w-full rounded-lg" />
              </div>
              <div className="space-y-3">
                <SkeletonBlock className="h-5 w-32" />
                <SkeletonBlock className="h-12 w-full rounded-lg" />
                <SkeletonBlock className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard titleWidth="w-24">
            <div className="space-y-4">
              <SkeletonField labelWidth="w-20" />
              <div className="flex gap-2">
                <SkeletonBlock className="h-12 flex-1 rounded-lg" />
                <SkeletonBlock className="h-12 w-12 rounded-lg" />
              </div>
              <SkeletonField labelWidth="w-24" />
              <div className="grid grid-cols-2 gap-4">
                <SkeletonField labelWidth="w-28" />
                <SkeletonField labelWidth="w-28" />
              </div>
            </div>
          </SectionCard>

          <SectionCard titleWidth="w-28">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <SkeletonBlock className="h-6 w-24" />
                <SkeletonBlock className="h-10 w-28 rounded-lg" />
              </div>

              {[0, 1].map((item) => (
                <div
                  key={item}
                  className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <SkeletonBlock className="h-4 w-16" />
                    <SkeletonBlock className="h-4 w-20" />
                  </div>
                  <SkeletonField labelWidth="w-24" inputHeight="h-10" />
                  <SkeletonField labelWidth="w-10" inputHeight="h-10" />
                  <SkeletonField labelWidth="w-10" inputHeight="h-10" />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-t border-neutral-200 pt-6">
        <SkeletonBlock className="h-12 w-36 rounded-lg" />
        <SkeletonBlock className="h-12 w-36 rounded-lg" />
      </div>
    </div>
  );
}
