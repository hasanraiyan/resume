'use client';

import { useState, useMemo } from 'react';
import { useDrively } from '@/context/DrivelyContext';
import { Folder, File, Plus, Upload, FolderPlus, ChevronRight, Search, LayoutGrid, List as ListIcon } from 'lucide-react';
import FileCard from './FileCard';
import FolderCard from './FolderCard';
import Breadcrumbs from './Breadcrumbs';
import UploadModal from './UploadModal';

export default function MyDriveTab() {
  const { files, folders, currentFolderId, setCurrentFolderId, isLoading } = useDrively();
  const [viewMode, setViewMode] = useState('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentFolders = useMemo(() => {
    return folders.filter(f => f.parentId === currentFolderId && !f.deletedAt);
  }, [folders, currentFolderId]);

  const currentFiles = useMemo(() => {
    return files.filter(f => f.folderId === currentFolderId && !f.deletedAt);
  }, [files, currentFolderId]);

  const filteredFolders = currentFolders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFiles = currentFiles.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading && files.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f644e]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumbs />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 hover:bg-[#e5e3d8] rounded-lg transition-colors text-[#7c8e88]"
          >
            {viewMode === 'grid' ? <ListIcon className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-[#1f644e] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      <div className="md:hidden relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8e88]" />
        <input
          type="text"
          placeholder="Search in folder..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#e5e3d8] bg-white text-sm outline-none focus:border-[#1f644e]"
        />
      </div>

      {filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-[#e5e3d8]/50 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-10 h-10 text-[#7c8e88]" />
          </div>
          <h3 className="text-lg font-bold text-[#1e3a34]">Folder is empty</h3>
          <p className="text-[#7c8e88] text-sm mt-1">Upload files or create folders to get started</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-6 text-[#1f644e] font-bold text-sm hover:underline"
          >
            Upload your first file
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredFolders.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">Folders</h2>
              <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-2"}>
                {filteredFolders.map(folder => (
                  <FolderCard key={folder._id} folder={folder} viewMode={viewMode} />
                ))}
              </div>
            </section>
          )}

          {filteredFiles.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">Files</h2>
              <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "space-y-2"}>
                {filteredFiles.map(file => (
                  <FileCard key={file._id} file={file} viewMode={viewMode} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} currentFolderId={currentFolderId} />}
    </div>
  );
}
