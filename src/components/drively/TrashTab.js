'use client';

import { useDrively } from '@/context/DrivelyContext';
import { Trash2, AlertTriangle, Clock } from 'lucide-react';
import FileCard from './FileCard';
import FolderCard from './FolderCard';
import { differenceInDays } from 'date-fns';

export default function TrashTab() {
  const { isLoading, trashFiles, trashFolders, emptyTrash } = useDrively();

  const hasItems = trashFolders.length > 0 || trashFiles.length > 0;

  const renderExpiryBadge = (deletedAt) => {
    if (!deletedAt) return null;
    const daysLeft = Math.max(0, 30 - differenceInDays(new Date(), new Date(deletedAt)));
    return (
      <div
        className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[8px] font-extrabold flex items-center gap-1 border shadow-sm z-10 ${
          daysLeft <= 5
            ? 'bg-red-100 text-red-700 border-red-200'
            : 'bg-amber-50 text-amber-700 border-amber-100'
        }`}
      >
        <Clock className="w-2.5 h-2.5" />
        {daysLeft} DAYS UNTIL DELETION
      </div>
    );
  };

  if (isLoading && !hasItems) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[#e5e3d8] rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square bg-[#e5e3d8] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#7c8e88]">
          <AlertTriangle className="w-4 h-4" />
          <p className="text-xs font-medium">Items in trash are deleted after 30 days</p>
        </div>
        {hasItems && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to permanently delete all items in trash?')) {
                emptyTrash();
              }
            }}
            className="text-sm font-bold text-[#c94c4c] hover:underline"
          >
            Empty Trash
          </button>
        )}
      </div>

      {!hasItems ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-[#fcfbf5] border-2 border-dashed border-[#e5e3d8] rounded-full flex items-center justify-center mb-6 text-[#7c8e88]">
            <Trash2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-[#1e3a34]">Trash is empty</h3>
          <p className="text-[#7c8e88] max-w-xs mt-2">
            Items you delete will stay here for 30 days before being permanently removed.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {trashFolders.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
                Folders
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {trashFolders.map((folder) => (
                  <div key={folder._id} className="relative">
                    {renderExpiryBadge(folder.deletedAt)}
                    <FolderCard folder={folder} viewMode="grid" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {trashFiles.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
                Files
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {trashFiles.map((file) => (
                  <div key={file._id} className="relative">
                    {renderExpiryBadge(file.deletedAt)}
                    <FileCard file={file} viewMode="grid" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
