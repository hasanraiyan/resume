'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const DrivelyContext = createContext();

export function DrivelyProvider({ children }) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [activity, setActivity] = useState([]);
  const [starred, setStarred] = useState({ files: [], folders: [] });
  const [trashCount, setTrashCount] = useState(0);
  const [trashFiles, setTrashFiles] = useState([]);
  const [trashFolders, setTrashFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({ page: 1, hasMore: false });
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Global search and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });

  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState({ files: [], folders: [] });
  const [previewFile, setPreviewFile] = useState(null);

  const fetchBootstrap = useCallback(async (page = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) setIsFetchingMore(true);
      else setIsLoading(true);

      // Trigger trash expiry check (asynchronous)
      if (page === 1) {
        fetch('/api/drively/trash/expire', { method: 'DELETE' }).catch(console.error);
      }

      // Fetch both bootstrap and trash data
      const [bootRes, trashRes] = await Promise.all([
        fetch(`/api/drively/bootstrap?page=${page}&limit=100`),
        page === 1 ? fetch('/api/drively/bootstrap?trash=true') : Promise.resolve({ json: () => ({ success: true, files: [], folders: [] }) }),
      ]);
      const data = await bootRes.json();
      const trashData = await trashRes.json();

      if (data.success) {
        if (isLoadMore) {
          setFiles((prev) => [...prev, ...data.files]);
        } else {
          setFiles(data.files);
          setFolders(data.folders);
          setStats(data.stats);
          setRecent(data.recent);
          setStarred(data.starred);
          setTrashCount(data.trashCount);
          setActivity(data.activity);
        }
        setPagination({ page: data.pagination.page, hasMore: data.pagination.hasMore });
      } else {
        toast.error(data.error || 'Failed to load Drively');
      }

      if (trashData.success && page === 1) {
        setTrashFiles(trashData.files);
        setTrashFolders(trashData.folders);
      }
    } catch (error) {
      console.error(error);
      toast.error('Connection error');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !isFetchingMore) {
      fetchBootstrap(pagination.page + 1, true);
    }
  }, [pagination, isFetchingMore, fetchBootstrap]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchBootstrap();
    }
  }, [session, fetchBootstrap]);

  const uploadFiles = async (selectedFiles, folderId = null) => {
    const concurrencyLimit = 3;
    const results = [];

    // Concurrent uploads with limit
    const uploadTask = async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) formData.append('folderId', folderId);

      const res = await fetch('/api/drively/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setFiles((prev) => [data.file, ...prev]);
        setRecent((prev) => [data.file, ...prev]);
        return data.file;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    };

    try {
      const chunks = [];
      for (let i = 0; i < selectedFiles.length; i += concurrencyLimit) {
        chunks.push(selectedFiles.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        const chunkResults = await Promise.allSettled(chunk.map(uploadTask));
        results.push(...chunkResults);
      }

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0) toast.success(`Uploaded ${successful} files`);
      if (failed > 0) toast.error(`Failed to upload ${failed} files`);

      fetchBootstrap();
      return successful > 0;
    } catch (error) {
      toast.error('Upload process failed');
      return false;
    }
  };

  const createNewFolder = async (name, parentId = null) => {
    try {
      const res = await fetch('/api/drively/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Folder created');
        setFolders((prev) => [data.folder, ...prev]);
        fetchBootstrap();
        return true;
      } else {
        toast.error(data.error || 'Failed to create folder');
        return false;
      }
    } catch (error) {
      toast.error('Error creating folder');
      return false;
    }
  };

  const deleteItem = async (type, id, permanent = false) => {
    // Optimistic delete
    const prevFiles = [...files];
    const prevFolders = [...folders];

    if (!permanent) {
      if (type === 'file') setFiles((prev) => prev.filter((f) => f._id !== id));
      else setFolders((prev) => prev.filter((f) => f._id !== id));
    }

    const endpoint = `/api/drively/${type}s/${id}${permanent ? '?permanent=true' : ''}`;
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(permanent ? 'Permanently deleted' : 'Moved to trash');
        fetchBootstrap();
        return true;
      } else {
        setFiles(prevFiles);
        setFolders(prevFolders);
        toast.error(data.error || 'Delete failed');
        return false;
      }
    } catch (error) {
      setFiles(prevFiles);
      setFolders(prevFolders);
      toast.error('Delete error');
      return false;
    }
  };

  const updateItem = async (type, id, payload) => {
    // Optimistic update
    const prevFiles = [...files];
    const prevFolders = [...folders];

    if (type === 'file') {
      setFiles((prev) => prev.map((f) => (f._id === id ? { ...f, ...payload } : f)));
    } else {
      setFolders((prev) => prev.map((f) => (f._id === id ? { ...f, ...payload } : f)));
    }

    try {
      const res = await fetch(`/api/drively/${type}s/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        fetchBootstrap();
        return true;
      } else {
        setFiles(prevFiles);
        setFolders(prevFolders);
        toast.error(data.error || 'Update failed');
        return false;
      }
    } catch (error) {
      setFiles(prevFiles);
      setFolders(prevFolders);
      toast.error('Update error');
      return false;
    }
  };

  const emptyTrashAction = async () => {
    try {
      const res = await fetch('/api/drively/trash/empty', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Trash emptied');
        fetchBootstrap();
        return true;
      } else {
        toast.error(data.error || 'Failed to empty trash');
        return false;
      }
    } catch (error) {
      toast.error('Error emptying trash');
      return false;
    }
  };

  const executeBulk = async (action, targetFolderId = null) => {
    const payload = {
      fileIds: selectedItems.files,
      folderIds: selectedItems.folders,
      action,
      targetFolderId,
    };

    try {
      const res = await fetch('/api/drively/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Bulk action completed');
        setSelectedItems({ files: [], folders: [] });
        fetchBootstrap();
        return true;
      } else {
        toast.error(data.error || 'Bulk action failed');
        return false;
      }
    } catch (error) {
      toast.error('Bulk action error');
      return false;
    }
  };

  const toggleSelection = (type, id) => {
    setSelectedItems((prev) => {
      const list = prev[`${type}s`];
      const newList = list.includes(id) ? list.filter((i) => i !== id) : [...list, id];
      return { ...prev, [`${type}s`]: newList };
    });
  };

  const clearSelection = useCallback(() => setSelectedItems({ files: [], folders: [] }), []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to clear selection or close preview
      if (e.key === 'Escape') {
        if (previewFile) setPreviewFile(null);
        else clearSelection();
      }

      // Delete key
      if (e.key === 'Delete' || (e.metaKey && e.key === 'Backspace')) {
        const totalSelected = selectedItems.files.length + selectedItems.folders.length;
        if (totalSelected > 0) {
          if (confirm(`Are you sure you want to delete ${totalSelected} items?`)) {
            executeBulk('delete');
          }
        }
      }

      // F2 to rename single selected item
      if (e.key === 'F2') {
        const selectedFileCount = selectedItems.files.length;
        const selectedFolderCount = selectedItems.folders.length;

        if (selectedFileCount + selectedFolderCount === 1) {
           // We'd need to trigger the rename modal here.
           // For now, let's just log or skip as it requires complex wiring
           // to find which component owns the modal.
        }
      }

      // Ctrl/Cmd + A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        // Only trigger if not typing in an input
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          // Logic to select all visible files/folders
          // (This would need access to currently filtered files/folders)
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, executeBulk, clearSelection, previewFile]);

  return (
    <DrivelyContext.Provider
      value={{
        isLoading,
        files,
        folders,
        stats,
        recent,
        activity,
        starred,
        trashCount,
        trashFiles,
        trashFolders,
        currentFolderId,
        setCurrentFolderId,
        searchQuery,
        setSearchQuery,
        sortConfig,
        setSortConfig,
        selectedItems,
        toggleSelection,
        clearSelection,
        uploadFiles,
        createNewFolder,
        deleteItem,
        updateItem,
        emptyTrash: emptyTrashAction,
        executeBulk,
        previewFile,
        setPreviewFile,
        refresh: fetchBootstrap,
        pagination,
        loadMore,
        isFetchingMore,
      }}
    >
      {children}
    </DrivelyContext.Provider>
  );
}

export const useDrively = () => useContext(DrivelyContext);
