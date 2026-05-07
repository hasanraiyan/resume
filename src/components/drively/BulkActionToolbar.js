'use client';

import { useDrively } from '@/context/DrivelyContext';
import { Trash2, Star, X, Download, FolderInput } from 'lucide-react';
import { useState } from 'react';
import MoveModal from './MoveModal';
import { toast } from 'sonner';

export default function BulkActionToolbar() {
  const { selectedItems, clearSelection, executeBulk, files: allFiles } = useDrively();
  const [showMoveModal, setShowMoveModal] = useState(false);

  const totalSelected = selectedItems.files.length + selectedItems.folders.length;

  if (totalSelected === 0) return null;

  const handleBulkAction = async (action) => {
    if (action === 'delete') {
      if (confirm(`Are you sure you want to delete ${totalSelected} items?`)) {
        await executeBulk('delete');
      }
    } else if (action === 'download') {
      // For v2, we'll open download links for each file in a new tab
      // Folders are not easily downloadable without server-side zipping
      if (selectedItems.folders.length > 0) {
        toast.info('Only files can be downloaded in bulk for now');
      }

      const filesToDownload = allFiles.filter(f => selectedItems.files.includes(f._id));

      filesToDownload.forEach((file, index) => {
        // Stagger to avoid browser popup blocks
        setTimeout(() => {
          if (file.mimeType.startsWith('image/')) {
            window.open(file.secureUrl, '_blank');
          } else {
            window.open(`/api/drively/download/${file._id}`, '_blank');
          }
        }, index * 200);
      });

      if (selectedItems.files.length > 0) {
        toast.success(`Starting download for ${selectedItems.files.length} files`);
        clearSelection();
      }
    } else {
      await executeBulk(action);
    }
  };

  const handleMove = async (targetFolderId) => {
    await executeBulk('move', targetFolderId);
    setShowMoveModal(false);
  };

  return (
    <>
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-[#1e3a34] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-lg">
          <div className="flex items-center gap-3 pr-4 border-r border-white/20">
            <button
              onClick={clearSelection}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold">{totalSelected} selected</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleBulkAction('star')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors flex flex-col items-center gap-1 min-w-[60px]"
              title="Star all"
            >
              <Star className="w-5 h-5" />
              <span className="text-[10px] font-medium">Star</span>
            </button>

            <button
              onClick={() => setShowMoveModal(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors flex flex-col items-center gap-1 min-w-[60px]"
              title="Move all"
            >
              <FolderInput className="w-5 h-5" />
              <span className="text-[10px] font-medium">Move</span>
            </button>

            <button
              onClick={() => handleBulkAction('download')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors flex flex-col items-center gap-1 min-w-[60px]"
              title="Download all"
            >
              <Download className="w-5 h-5" />
              <span className="text-[10px] font-medium">Download</span>
            </button>

            <button
              onClick={() => handleBulkAction('delete')}
              className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-colors flex flex-col items-center gap-1 min-w-[60px]"
              title="Delete all"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-[10px] font-medium">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {showMoveModal && (
        <MoveModal
          onConfirm={handleMove}
          onClose={() => setShowMoveModal(false)}
        />
      )}
    </>
  );
}
