'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useDrively } from '@/context/DrivelyContext';
import {
  Upload,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Grid2X2,
  Grid3X3,
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
    isLoading,
    searchQuery,
    sortConfig,
    uploadFiles,
    loadMore,
    pagination,
    isFetchingMore,
  } = useDrively();
  const [viewMode, setViewMode] = useState('grid');
  const [density, setDensity] = useState('normal'); // 'normal' or 'compact'
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const savedViewMode = localStorage.getItem('drively-view-mode');
    const savedDensity = localStorage.getItem('drively-density');
    if (savedViewMode) setViewMode(savedViewMode);
    if (savedDensity) setDensity(savedDensity);
  }, []);

  useEffect(() => {
    localStorage.setItem('drively-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('drively-density', density);
  }, [density]);
  const [isDragging, setIsDragging] = useState(false);

  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore && !isFetchingMore) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [pagination.hasMore, isFetchingMore, loadMore]);

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
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#e5e3d8] rounded-2xl overflow-hidden animate-pulse"
              >
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
              <p className="text-sm text-[#7c8e88] font-medium">
                Release to start uploading to this folder
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumbs />
        <div className="flex items-center gap-2">
          <SortDropdown />
          <div className="flex items-center bg-white border border-[#e5e3d8] rounded-xl overflow-hidden p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#f0f5f2] text-[#1f644e]' : 'text-[#7c8e88] hover:text-[#1e3a34]'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#f0f5f2] text-[#1f644e]' : 'text-[#7c8e88] hover:text-[#1e3a34]'}`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          {viewMode === 'grid' && (
            <div className="flex items-center bg-white border border-[#e5e3d8] rounded-xl overflow-hidden p-1">
              <button
                onClick={() => setDensity('normal')}
                className={`p-1.5 rounded-lg transition-colors ${density === 'normal' ? 'bg-[#f0f5f2] text-[#1f644e]' : 'text-[#7c8e88] hover:text-[#1e3a34]'}`}
                title="Normal Grid"
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={`p-1.5 rounded-lg transition-colors ${density === 'compact' ? 'bg-[#f0f5f2] text-[#1f644e]' : 'text-[#7c8e88] hover:text-[#1e3a34]'}`}
                title="Compact Grid"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          )}
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
          <div className="w-24 h-24 bg-[#f0f5f2] rounded-full flex items-center justify-center mb-6 text-[#1f644e]">
            <Upload className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-[#1e3a34]">Folder is empty</h3>
          <p className="text-[#7c8e88] max-w-xs mt-2">
            Upload files or create folders to get started with your private cloud.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-6 flex items-center gap-2 bg-white border border-[#1f644e] text-[#1f644e] px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#f0f5f2] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Something
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
                    ? `grid grid-cols-1 sm:grid-cols-2 ${density === 'compact' ? 'lg:grid-cols-4 xl:grid-cols-6' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-4`
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
                    ? `grid grid-cols-1 sm:grid-cols-2 ${density === 'compact' ? 'lg:grid-cols-6 xl:grid-cols-8' : 'lg:grid-cols-4 xl:grid-cols-5'} gap-4`
                    : 'space-y-2'
                }
              >
                {filteredFiles.map((file) => (
                  <FileCard key={file._id} file={file} viewMode={viewMode} />
                ))}
              </div>
            </section>
          )}

          {/* Infinite Scroll Trigger */}
          <div ref={observerTarget} className="py-8 flex justify-center">
            {isFetchingMore && (
              <div className="flex items-center gap-2 text-[#7c8e88] text-sm font-bold animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading more files...
              </div>
            )}
          </div>
        </div>
      )}

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} currentFolderId={currentFolderId} />
      )}
    </div>
  );
}
