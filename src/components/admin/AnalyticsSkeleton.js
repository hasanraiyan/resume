// src/components/admin/AnalyticsSkeleton.js
'use client';

import { Card } from '@/components/custom-ui';

export default function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-3 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-24 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
                <div className="h-8 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-16 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
                <div className="h-3 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-20 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded-lg animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Card className="p-6">
        <div className="h-80 flex items-center justify-center">
          <div className="space-y-4 w-full">
            <div className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-48 mx-auto relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
            </div>
            <div className="flex justify-center space-x-2">
              {[...Array(7)].map((_, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div
                    className={`bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded-t animate-pulse relative overflow-hidden ${
                      index === 3 ? 'h-32 w-8' : 'h-16 w-8'
                    }`}
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                  </div>
                  <div className="h-3 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-12 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                  </div>
                  <div className="h-3 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-8 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Top Pages Skeleton */}
      <Card className="p-6">
        <div className="h-6 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-32 mb-4 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <div className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-6 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
                <div className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-24 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-16 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
                <div className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-20 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Events Skeleton */}
      <Card className="p-6">
        <div className="h-6 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-36 mb-4 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
        </div>
        <div className="space-y-2">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 text-sm border-b border-neutral-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <div className="h-5 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-16 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
                <div className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-20 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
                <div className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-24 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                </div>
              </div>
              <div className="h-4 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 rounded animate-pulse w-32 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
