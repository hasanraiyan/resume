'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [starred, setStarred] = useState({ files: [], folders: [] });
  const [trashCount, setTrashCount] = useState(0);
  const [currentFolderId, setCurrentFolderId] = useState(null);

  // Global search and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });

  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState({ files: [], folders: [] });
  const [previewFile, setPreviewFile] = useState(null);

  const fetchBootstrap = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/drively/bootstrap');
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
        setFolders(data.folders);
        setStats(data.stats);
        setRecent(data.recent);
        setStarred(data.starred);
        setTrashCount(data.trashCount);
      } else {
        toast.error(data.error || 'Failed to load Drively');
      }
    } catch (error) {
      console.error(error);
      toast.error('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchBootstrap();
    }
  }, [session, fetchBootstrap]);

  const uploadFiles = async (selectedFiles, folderId = null) => {
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('file', file));
    if (folderId) formData.append('folderId', folderId);

    try {
      const res = await fetch('/api/drively/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Upload successful');
        // Optimistic update: Add newly uploaded files to state
        setFiles((prev) => [...data.files, ...prev]);
        setRecent((prev) => [...data.files, ...prev]);
        // fetchBootstrap(); // Refresh stats and counts
        return true;
      } else {
        toast.error(data.error || 'Upload failed');
        return false;
      }
    } catch (error) {
      toast.error('Upload failed');
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
        // fetchBootstrap();
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
        // fetchBootstrap();
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
        // fetchBootstrap();
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

  const clearSelection = () => setSelectedItems({ files: [], folders: [] });

  return (
    <DrivelyContext.Provider
      value={{
        isLoading,
        files,
        folders,
        stats,
        recent,
        starred,
        trashCount,
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
      }}
    >
      {children}
    </DrivelyContext.Provider>
  );
}

export const useDrively = () => useContext(DrivelyContext);
