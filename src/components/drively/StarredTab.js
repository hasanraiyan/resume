'use client';

import { useDrively } from '@/context/DrivelyContext';
import { Star } from 'lucide-react';
import FileCard from './FileCard';
import FolderCard from './FolderCard';

export default function StarredTab() {
  const { starred, isLoading } = useDrively();

  if (isLoading && starred.files.length === 0 && starred.folders.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 bg-[#e5e3d8] rounded-xl" />
        <div className="h-40 bg-[#e5e3d8] rounded-xl" />
      </div>
    );
  }

  if (starred.files.length === 0 && starred.folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-[#e5e3d8]/50 rounded-full flex items-center justify-center mb-4 text-[#7c8e88]">
          <Star className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-[#1e3a34]">No starred items</h3>
        <p className="text-[#7c8e88] text-sm mt-1">Star files and folders for quick access</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {starred.folders.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
            Starred Folders
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {starred.folders.map((folder) => (
              <FolderCard key={folder._id} folder={folder} viewMode="grid" />
            ))}
          </div>
        </section>
      )}

      {starred.files.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
            Starred Files
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {starred.files.map((file) => (
              <FileCard key={file._id} file={file} viewMode="grid" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
