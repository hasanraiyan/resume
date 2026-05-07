'use client';

import { useDrively } from '@/context/DrivelyContext';
import { Star } from 'lucide-react';
import FileCard from './FileCard';
import FolderCard from './FolderCard';
import SortDropdown from './SortDropdown';
import { useMemo } from 'react';

export default function StarredTab() {
  const { starred, isLoading, sortConfig, searchQuery } = useDrively();

  const sortItems = (items, type) => {
    let filtered = [...items];
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        (type === 'file' ? item.filename : item.name)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      let valA, valB;
      if (sortConfig.key === 'name') {
        valA = (type === 'file' ? a.filename : a.name).toLowerCase();
        valB = (type === 'file' ? b.filename : b.name).toLowerCase();
      } else {
        valA = a[sortConfig.key];
        valB = b[sortConfig.key];
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedFolders = useMemo(
    () => sortItems(starred.folders, 'folder'),
    [starred.folders, sortConfig, searchQuery]
  );
  const sortedFiles = useMemo(
    () => sortItems(starred.files, 'file'),
    [starred.files, sortConfig, searchQuery]
  );

  if (isLoading && starred.files.length === 0 && starred.folders.length === 0) {
    return (
      <div className="space-y-8">
        <section>
          <div className="h-4 w-24 bg-[#e5e3d8] rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-[#e5e3d8] rounded-2xl animate-pulse" />
            ))}
          </div>
        </section>
        <section>
          <div className="h-4 w-24 bg-[#e5e3d8] rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-[#e5e3d8] rounded-2xl animate-pulse" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (starred.files.length === 0 && starred.folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-[#f0f5f2] rounded-full flex items-center justify-center mb-6 text-[#1f644e]">
          <Star className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold text-[#1e3a34]">No starred items</h3>
        <p className="text-[#7c8e88] max-w-xs mt-2">
          Star files and folders that you want to find easily later. They will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <SortDropdown />
      </div>

      {sortedFolders.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
            Starred Folders
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedFolders.map((folder) => (
              <FolderCard key={folder._id} folder={folder} viewMode="grid" />
            ))}
          </div>
        </section>
      )}

      {sortedFiles.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
            Starred Files
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedFiles.map((file) => (
              <FileCard key={file._id} file={file} viewMode="grid" />
            ))}
          </div>
        </section>
      )}

      {sortedFolders.length === 0 && sortedFiles.length === 0 && searchQuery && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h3 className="text-lg font-bold text-[#1e3a34]">No matches found</h3>
          <p className="text-[#7c8e88] text-sm mt-1">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
}
