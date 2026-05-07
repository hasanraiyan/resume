'use client';

import { useState, useMemo } from 'react';
import { useDrively } from '@/context/DrivelyContext';
import {
  Folder,
  File,
  Plus,
  Upload,
  FolderPlus,
  ChevronRight,
  Search,
  LayoutGrid,
  List as ListIcon,
} from 'lucide-react';
import FileCard from './FileCard';
import FolderCard from './FolderCard';
import Breadcrumbs from './Breadcrumbs';
import UploadModal from './UploadModal';
import SortDropdown from './SortDropdown';

export default function MyDriveTab() {
  const {
    files,
    folders,
    currentFolderId,
    setCurrentFolderId,
    isLoading,
    searchQuery,
    sortConfig,
    uploadFiles,
  } = useDrively();
  const [viewMode, setViewMode] = useState('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      await uploadFiles(droppedFiles, currentFolderId);
    }
  };

  const sortItems = (items, type) => {
    return [...items].sort((a, b) => {
      let valA, valB;
      if (sortConfig.key === 'name') {
        valA = (type === 'file' ? a.filename : a.name).toLowerCase();
        valB = (type === 'file' ? b.filename : b.name).toLowerCase();
      } else {
        valA = a[sortConfig.key];
        valB = b[sortConfig.key];
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const currentFolders = useMemo(() => {
    const filtered = folders.filter((f) => f.parentId === currentFolderId && !f.deletedAt);
    return sortItems(filtered, 'folder');
  }, [folders, currentFolderId, sortConfig]);

  const currentFiles = useMemo(() => {
    const filtered = files.filter((f) => f.folderId === currentFolderId && !f.deletedAt);
    return sortItems(filtered, 'file');
  }, [files, currentFolderId, sortConfig]);

  const filteredFolders = currentFolders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFiles = currentFiles.filter((f) =>
    f.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && files.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="h-5 w-32 bg-[#e5e3d8] rounded-lg animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-[#e5e3d8] rounded-lg animate-pulse" />
            <div className="h-9 w-20 bg-[#e5e3d8] rounded-xl animate-pulse" />
          </div>
        </div>
        <section>
          <div className="h-3 w-14 bg-[#e5e3d8] rounded animate-pulse mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-[#e5e3d8] rounded-2xl animate-pulse">
                {/* Mobile skeleton row */}
                <div className="flex items-center gap-3 p-3 sm:hidden">
                  <div className="w-9 h-9 bg-[#e5e3d8] rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-[#e5e3d8] rounded w-2/3 mb-1.5" />
                    <div className="h-2 bg-[#e5e3d8] rounded w-1/4" />
                  </div>
                </div>
                {/* Desktop skeleton card */}
                <div className="hidden sm:block p-4">
                  <div className="w-10 h-10 bg-[#e5e3d8] rounded-xl mb-3" />
                  <div className="h-3 bg-[#e5e3d8] rounded w-3/4 mb-2" />
                  <div className="h-2 bg-[#e5e3d8] rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="h-3 w-10 bg-[#e5e3d8] rounded animate-pulse mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#e5e3d8] rounded-2xl overflow-hidden animate-pulse"
              >
                {/* Mobile skeleton row */}
                <div className="flex items-center gap-3 p-3 sm:hidden">
                  <div className="w-12 h-12 bg-[#e5e3d8] rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-[#e5e3d8] rounded w-3/4 mb-1.5" />
                    <div className="h-2 bg-[#e5e3d8] rounded w-1/3" />
                  </div>
                </div>
                {/* Desktop skeleton card */}
                <div className="hidden sm:block">
                  <div className="aspect-square bg-[#e5e3d8]" />
                  <div className="p-3">
                    <div className="h-3 bg-[#e5e3d8] rounded w-4/5 mb-2" />
                    <div className="h-2 bg-[#e5e3d8] rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 relative min-h-[400px]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[#1f644e]/10 border-2 border-dashed border-[#1f644e] rounded-3xl flex items-center justify-center backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white px-8 py-6 rounded-2xl shadow-xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-[#f0f5f2] rounded-full flex items-center justify-center text-[#1f644e]">
              <Upload className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-lg font-extrabold text-[#1e3a34]">Drop to upload</p>
              <p className="text-sm text-[#7c8e88] font-medium">Release to start uploading to this folder</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumbs />
        <div className="flex items-center gap-2">
          <SortDropdown />
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 hover:bg-[#e5e3d8] rounded-lg transition-colors text-[#7c8e88]"
          >
            {viewMode === 'grid' ? (
              <ListIcon className="w-5 h-5" />
            ) : (
              <LayoutGrid className="w-5 h-5" />
            )}
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


      {filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-[#e5e3d8]/50 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-10 h-10 text-[#7c8e88]" />
          </div>
          <h3 className="text-lg font-bold text-[#1e3a34]">Folder is empty</h3>
          <p className="text-[#7c8e88] text-sm mt-1">
            Upload files or create folders to get started
          </p>
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
                Folders
              </h2>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'space-y-2'
                }
              >
                {filteredFolders.map((folder) => (
                  <FolderCard key={folder._id} folder={folder} viewMode={viewMode} />
                ))}
              </div>
            </section>
          )}

          {filteredFiles.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
                Files
              </h2>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                    : 'space-y-2'
                }
              >
                {filteredFiles.map((file) => (
                  <FileCard key={file._id} file={file} viewMode={viewMode} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} currentFolderId={currentFolderId} />
      )}
    </div>
  );
}
