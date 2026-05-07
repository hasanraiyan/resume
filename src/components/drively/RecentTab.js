'use client';

import { useDrively } from '@/context/DrivelyContext';
import { Clock } from 'lucide-react';
import FileCard from './FileCard';
import SortDropdown from './SortDropdown';
import { useMemo } from 'react';

export default function RecentTab() {
  const { recent, isLoading, sortConfig, searchQuery } = useDrively();

  const sortedRecent = useMemo(() => {
    let items = [...recent];
    if (searchQuery) {
      items = items.filter((f) => f.filename.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return items.sort((a, b) => {
      let valA, valB;
      if (sortConfig.key === 'name') {
        valA = a.filename.toLowerCase();
        valB = b.filename.toLowerCase();
      } else {
        valA = a[sortConfig.key];
        valB = b[sortConfig.key];
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [recent, sortConfig, searchQuery]);

  if (isLoading && recent.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-square bg-[#e5e3d8] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-[#f0f5f2] rounded-full flex items-center justify-center mb-6 text-[#1f644e]">
          <Clock className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold text-[#1e3a34]">No recent files</h3>
        <p className="text-[#7c8e88] max-w-xs mt-2">
          Your recently uploaded or modified files will show up here for quick access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <SortDropdown />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedRecent.map((file) => (
          <FileCard key={file._id} file={file} viewMode="grid" />
        ))}
      </div>
    </div>
  );
}
