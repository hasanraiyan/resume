'use client';

import React from 'react';
import { useDrively } from '@/context/DrivelyContext';
import { ChevronRight, Home, HardDrive } from 'lucide-react';

export default function Breadcrumbs() {
  const { currentFolderId, setCurrentFolderId, folders } = useDrively();

  const getBreadcrumbs = () => {
    if (!currentFolderId) return [];

    const crumbs = [];
    let current = folders.find((f) => f._id === currentFolderId);

    while (current) {
      crumbs.unshift(current);
      current = folders.find((f) => f._id === current.parentId);
    }

    return crumbs;
  };

  const crumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar whitespace-nowrap py-1">
      <button
        onClick={() => setCurrentFolderId(null)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-bold transition-colors ${
          !currentFolderId ? 'text-[#1e3a34] bg-[#e5e3d8]' : 'text-[#7c8e88] hover:bg-[#e5e3d8]/50'
        }`}
      >
        <HardDrive className="w-4 h-4" />
        My Drive
      </button>

      {crumbs.map((crumb, idx) => (
        <React.Fragment key={crumb._id}>
          <ChevronRight className="w-4 h-4 text-[#e5e3d8] flex-shrink-0" />
          <button
            onClick={() => setCurrentFolderId(crumb._id)}
            className={`px-2 py-1 rounded-lg text-sm font-bold transition-colors ${
              idx === crumbs.length - 1
                ? 'text-[#1e3a34] bg-[#e5e3d8]'
                : 'text-[#7c8e88] hover:bg-[#e5e3d8]/50'
            }`}
          >
            {crumb.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}
