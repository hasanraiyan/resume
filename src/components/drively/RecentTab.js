'use client';

import { useDrively } from '@/context/DrivelyContext';
import { Clock, HardDrive, File, Image as ImageIcon, FileText } from 'lucide-react';
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
      <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-[#e5e3d8] rounded-xl" />
        ))}
      </div>
    );
  }

  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-[#e5e3d8]/50 rounded-full flex items-center justify-center mb-4 text-[#7c8e88]">
          <Clock className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-[#1e3a34]">No recent files</h3>
        <p className="text-[#7c8e88] text-sm mt-1">Recently uploaded files will appear here</p>
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
