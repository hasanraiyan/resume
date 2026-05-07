'use client';

import { useState } from 'react';
import { useDrively } from '@/context/DrivelyContext';
import { X, Folder, ChevronRight, HardDrive, Search } from 'lucide-react';

export default function MoveModal({ onConfirm, onClose }) {
  const { folders } = useDrively();
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFolders = folders.filter(
    (f) => !f.deletedAt && f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPath = (folderId) => {
    if (!folderId) return 'My Drive';
    const folder = folders.find((f) => f._id === folderId);
    if (!folder) return 'My Drive';

    const crumbs = [];
    let current = folder;
    while (current) {
      crumbs.unshift(current.name);
      current = folders.find((f) => f._id === current.parentId);
    }
    return ['My Drive', ...crumbs].join(' / ');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-[#e5e3d8] flex items-center justify-between bg-[#fcfbf5]">
          <div>
            <h2 className="text-xl font-extrabold text-[#1e3a34]">Move items to...</h2>
            <p className="text-xs text-[#7c8e88] mt-1 font-medium">Select a destination folder</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#e5e3d8] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#7c8e88]" />
          </button>
        </div>

        <div className="p-4 border-b border-[#e5e3d8]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8e88]" />
            <input
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#e5e3d8] bg-white text-sm outline-none focus:border-[#1f644e]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
              selectedFolderId === null
                ? 'bg-[#f0f5f2] text-[#1f644e]'
                : 'hover:bg-[#fcfbf5] text-[#1e3a34]'
            }`}
          >
            <div
              className={`p-2 rounded-lg ${selectedFolderId === null ? 'bg-[#1f644e] text-white' : 'bg-[#e5e3d8] text-[#7c8e88]'}`}
            >
              <HardDrive className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold">My Drive (Root)</span>
          </button>

          <div className="mt-2 space-y-1">
            {filteredFolders.map((folder) => (
              <button
                key={folder._id}
                onClick={() => setSelectedFolderId(folder._id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                  selectedFolderId === folder._id
                    ? 'bg-[#f0f5f2] text-[#1f644e]'
                    : 'hover:bg-[#fcfbf5] text-[#1e3a34]'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${selectedFolderId === folder._id ? 'bg-[#1f644e] text-white' : 'bg-[#f0f5f2] text-[#1f644e]'}`}
                >
                  <Folder className="w-5 h-5" fill="currentColor" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{folder.name}</p>
                  <p className="text-[10px] text-[#7c8e88] truncate">{getPath(folder.parentId)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-[#fcfbf5] border-t border-[#e5e3d8] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#7c8e88]">
              Destination
            </p>
            <p className="text-sm font-bold text-[#1e3a34] truncate">{getPath(selectedFolderId)}</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-bold text-[#7c8e88] hover:bg-[#e5e3d8] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selectedFolderId)}
              className="px-6 py-2 bg-[#1f644e] text-white rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors shadow-sm"
            >
              Move Here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
