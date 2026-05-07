'use client';

import { useDrively } from '@/context/DrivelyContext';
import { Folder, MoreVertical, Star, Trash2, Pencil, ExternalLink } from 'lucide-react';
import ActionMenu from './ActionMenu';

export default function FolderCard({ folder, viewMode }) {
  const { setCurrentFolderId, updateItem, deleteItem } = useDrively();

  const handleToggleStar = (e) => {
    e.stopPropagation();
    updateItem('folder', folder._id, { starred: !folder.starred });
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => setCurrentFolderId(folder._id)}
        className="group flex items-center justify-between p-3 bg-white border border-[#e5e3d8] rounded-xl hover:border-[#1f644e] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#f0f5f2] rounded-lg">
            <Folder className="w-5 h-5 text-[#1f644e]" fill="currentColor" />
          </div>
          <span className="text-sm font-bold truncate max-w-[200px]">{folder.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleToggleStar} className="p-1 hover:bg-[#fcfbf5] rounded">
            <Star
              className={`w-4 h-4 ${folder.starred ? 'text-[#1f644e] fill-[#1f644e]' : 'text-[#7c8e88]'}`}
            />
          </button>
          <ActionMenu type="folder" item={folder} />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setCurrentFolderId(folder._id)}
      className="group bg-white border border-[#e5e3d8] rounded-2xl p-4 hover:border-[#1f644e] transition-all hover:shadow-sm cursor-pointer relative"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 bg-[#f0f5f2] rounded-xl text-[#1f644e]">
          <Folder className="w-6 h-6" fill="currentColor" />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleToggleStar} className="p-1.5 hover:bg-[#fcfbf5] rounded-lg">
            <Star
              className={`w-4 h-4 ${folder.starred ? 'text-[#1f644e] fill-[#1f644e]' : 'text-[#7c8e88]'}`}
            />
          </button>
          <ActionMenu type="folder" item={folder} />
        </div>
      </div>
      <h3 className="text-sm font-bold truncate leading-tight mb-1">{folder.name}</h3>
      <p className="text-[10px] text-[#7c8e88] font-medium">Folder</p>

      {folder.starred && !folder.deletedAt && (
        <Star className="absolute top-4 right-12 w-3 h-3 text-[#1f644e] fill-[#1f644e] group-hover:hidden" />
      )}
    </div>
  );
}
