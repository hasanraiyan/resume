'use client';

import { useDrively } from '@/context/DrivelyContext';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const { folders, currentFolderId, setCurrentFolderId, files } = useDrively();

  const getPath = () => {
    const path = [];
    let currentId = currentFolderId;

    while (currentId) {
      const folder = folders.find((f) => f._id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return path;
  };

  const path = getPath();

  // Compute item count for current folder
  const currentItemCount =
    files.filter((f) => f.folderId === currentFolderId && !f.deletedAt).length +
    folders.filter((f) => f.parentId === currentFolderId && !f.deletedAt).length;

  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
      <button
        onClick={() => setCurrentFolderId(null)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[#e5e3d8] transition-colors shrink-0 ${!currentFolderId ? 'text-[#1e3a34] font-bold' : 'text-[#7c8e88] font-medium'}`}
      >
        <Home className="w-4 h-4" />
        <span className="text-sm">My Drive</span>
      </button>

      {path.map((folder, index) => (
        <div key={folder._id} className="flex items-center gap-1 shrink-0">
          <ChevronRight className="w-4 h-4 text-[#e5e3d8]" />
          <button
            onClick={() => setCurrentFolderId(folder._id)}
            className={`px-2 py-1 rounded-lg hover:bg-[#e5e3d8] transition-colors text-sm ${index === path.length - 1 ? 'text-[#1e3a34] font-bold' : 'text-[#7c8e88] font-medium'}`}
          >
            {folder.name}
          </button>
        </div>
      ))}

      <div className="ml-2 flex items-center gap-1.5 px-2 py-0.5 bg-[#f0f5f2] border border-[#1f644e]/10 rounded-full shrink-0">
        <span className="text-[10px] font-extrabold text-[#1f644e] uppercase tracking-wider">
          {currentItemCount} {currentItemCount === 1 ? 'item' : 'items'}
        </span>
      </div>
    </div>
  );
}
