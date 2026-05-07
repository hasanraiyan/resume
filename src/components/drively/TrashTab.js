'use client';

import { useState, useEffect } from 'react';
import { useDrively } from '@/context/DrivelyContext';
import { Trash2, AlertTriangle, RefreshCcw, Loader2 } from 'lucide-react';
import FileCard from './FileCard';
import FolderCard from './FolderCard';
import { toast } from 'sonner';

export default function TrashTab() {
  const { isLoading, refresh, emptyTrash } = useDrively();
  const [trashItems, setTrashItems] = useState({ folders: [], files: [] });
  const [isFetching, setIsFetching] = useState(false);

  const fetchTrash = async () => {
    try {
      setIsFetching(true);
      const res = await fetch('/api/drively/bootstrap?trash=true');
      const data = await res.json();
      if (data.success) {
        setTrashItems({ folders: data.folders, files: data.files });
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load trash');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const hasItems = trashItems.folders.length > 0 || trashItems.files.length > 0;

  if (isFetching && !hasItems) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-[#e5e3d8] rounded-xl" />
        ))}
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
          <div className="w-20 h-20 bg-[#e5e3d8]/50 rounded-full flex items-center justify-center mb-4 text-[#7c8e88]">
            <Trash2 className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-[#1e3a34]">Trash is empty</h3>
          <p className="text-[#7c8e88] text-sm mt-1">Deleted files and folders will appear here</p>
        </div>
      ) : (
        <div className="space-y-8">
          {trashItems.folders.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
                Folders
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {trashItems.folders.map((folder) => (
                  <FolderCard key={folder._id} folder={folder} viewMode="grid" />
                ))}
              </div>
            </section>
          )}

          {trashItems.files.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
                Files
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {trashItems.files.map((file) => (
                  <FileCard key={file._id} file={file} viewMode="grid" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
