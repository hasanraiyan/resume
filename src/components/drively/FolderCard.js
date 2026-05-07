'use client';

import { useDrively } from '@/context/DrivelyContext';
import { Folder, Star } from 'lucide-react';
import ActionMenu from './ActionMenu';
import { formatDistanceToNow } from 'date-fns';

export default function FolderCard({ folder, viewMode }) {
  const { setCurrentFolderId, updateItem, selectedItems, toggleSelection } = useDrively();

  const isSelected = selectedItems.folders.includes(folder._id);

  const handleToggleStar = (e) => {
    e.stopPropagation();
    updateItem('folder', folder._id, { starred: !folder.starred });
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => setCurrentFolderId(folder._id)}
        className={`group flex items-center justify-between p-3 border rounded-xl transition-colors cursor-pointer ${isSelected ? 'bg-[#f0f5f2] border-[#1f644e]' : 'bg-white border-[#e5e3d8] hover:border-[#1f644e]'}`}
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelection('folder', folder._id);
            }}
            className="w-4 h-4 rounded border-[#e5e3d8] text-[#1f644e] focus:ring-[#1f644e] cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="p-2 bg-[#f0f5f2] rounded-lg">
            <Folder className="w-5 h-5 text-[#1f644e]" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate max-w-[200px]">{folder.name}</p>
            <p className="text-[10px] text-[#7c8e88]">
              {formatDistanceToNow(new Date(folder.updatedAt || folder.createdAt), { addSuffix: true })}
            </p>
          </div>
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
      className={`group border rounded-2xl transition-all hover:shadow-sm cursor-pointer relative ${isSelected ? 'bg-[#f0f5f2] border-[#1f644e]' : 'bg-white border-[#e5e3d8] hover:border-[#1f644e]'}`}
    >
      {/* Mobile: compact horizontal row */}
      <div className="flex items-center gap-3 p-3 sm:hidden">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            toggleSelection('folder', folder._id);
          }}
          className="w-4 h-4 rounded border-[#e5e3d8] text-[#1f644e] focus:ring-[#1f644e] cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="p-2 bg-[#f0f5f2] rounded-xl flex-shrink-0 text-[#1f644e]">
          <Folder className="w-5 h-5" fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold truncate leading-tight">{folder.name}</h3>
          <p className="text-[10px] text-[#7c8e88] font-medium">
            Folder • {formatDistanceToNow(new Date(folder.updatedAt || folder.createdAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={handleToggleStar} className="p-1.5 hover:bg-[#f0f5f2] rounded-lg">
            <Star
              className={`w-3.5 h-3.5 ${folder.starred ? 'text-[#1f644e] fill-[#1f644e]' : 'text-[#7c8e88]'}`}
            />
          </button>
          <ActionMenu type="folder" item={folder} />
        </div>
      </div>

      {/* Desktop (sm+): vertical grid card */}
      <div className="hidden sm:block p-4">
        <div className={`absolute top-3 left-3 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelection('folder', folder._id);
            }}
            className="w-4 h-4 rounded border-[#e5e3d8] text-[#1f644e] focus:ring-[#1f644e] cursor-pointer shadow-sm bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
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
        <p className="text-[10px] text-[#7c8e88] font-medium">
          Folder • {formatDistanceToNow(new Date(folder.updatedAt || folder.createdAt), { addSuffix: true })}
        </p>

        {folder.starred && !folder.deletedAt && (
          <Star className="absolute top-4 right-12 w-3 h-3 text-[#1f644e] fill-[#1f644e] group-hover:hidden" />
        )}
      </div>
    </div>
  );
}
