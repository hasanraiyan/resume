'use client';

import { useDrively } from '@/context/DrivelyContext';
import { Folder, Star, MoreVertical } from 'lucide-react';
import ActionMenu from './ActionMenu';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

export default function FolderCard({ folder, viewMode }) {
  const {
    setCurrentFolderId,
    selectedItems,
    toggleSelection,
    files,
    folders: allFolders,
    updateItem,
  } = useDrively();

  const [isDragOver, setIsDragOver] = useState(false);
  const isSelected = selectedItems.folders.includes(folder._id);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('drivelyItem', JSON.stringify({ type: 'folder', id: folder._id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const data = e.dataTransfer.getData('drivelyItem');
    if (!data) return;

    const { type, id } = JSON.parse(data);
    if (id === folder._id) return; // Can't drop on itself

    const payload = type === 'file' ? { folderId: folder._id } : { parentId: folder._id };
    await updateItem(type, id, payload);
  };

  // Compute item count for this folder
  const itemCount =
    files.filter((f) => f.folderId === folder._id).length +
    allFolders.filter((f) => f.parentId === folder._id).length;

  if (viewMode === 'list') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => setCurrentFolderId(folder._id)}
        className={`group flex items-center justify-between p-3 border rounded-xl transition-colors cursor-pointer ${
          isSelected || isDragOver ? 'bg-[#f0f5f2] border-[#1f644e]' : 'bg-white border-[#e5e3d8] hover:border-[#1f644e]'
        } ${isDragOver ? 'ring-2 ring-[#1f644e] ring-inset' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection('folder', folder._id)}
            className="w-4 h-4 rounded border-[#e5e3d8] text-[#1f644e] focus:ring-[#1f644e] cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: folder.color || '#f0f5f2',
              color: folder.color ? 'rgba(0,0,0,0.5)' : '#1f644e',
            }}
          >
            <Folder className="w-5 h-5 fill-current" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">{folder.name}</p>
            <p className="text-[10px] text-[#7c8e88]">
              {itemCount} items •{' '}
              {formatDistanceToNow(new Date(folder.updatedAt || folder.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {folder.starred && <Star className="w-4 h-4 text-[#1f644e] fill-[#1f644e]" />}
          <ActionMenu type="folder" item={folder} />
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => setCurrentFolderId(folder._id)}
      className={`group p-4 border rounded-2xl transition-all hover:shadow-sm cursor-pointer relative ${
        isSelected || isDragOver ? 'bg-[#f0f5f2] border-[#1f644e]' : 'bg-white border-[#e5e3d8] hover:border-[#1f644e]'
      } ${isDragOver ? 'ring-2 ring-[#1f644e] ring-inset' : ''}`}
    >
      <div
        className={`absolute top-3 left-3 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelection('folder', folder._id)}
          className="w-4 h-4 rounded border-[#e5e3d8] text-[#1f644e] focus:ring-[#1f644e] cursor-pointer bg-white"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
          style={{
            backgroundColor: folder.color || '#f0f5f2',
            color: folder.color ? 'rgba(0,0,0,0.5)' : '#1f644e',
          }}
        >
          <Folder className="w-6 h-6 fill-current" />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionMenu type="folder" item={folder} />
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-bold truncate text-[#1e3a34] mb-0.5" title={folder.name}>
          {folder.name}
        </h3>
        <p className="text-[10px] text-[#7c8e88] font-medium">
          {itemCount} items •{' '}
          {formatDistanceToNow(new Date(folder.updatedAt || folder.createdAt), { addSuffix: true })}
        </p>
      </div>

      {folder.starred && !folder.deletedAt && (
        <Star className="absolute top-4 right-12 w-4 h-4 text-[#1f644e] fill-[#1f644e]" />
      )}
    </div>
  );
}
