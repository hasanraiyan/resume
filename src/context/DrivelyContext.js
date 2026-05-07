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
        fetchBootstrap();
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
    const endpoint = `/api/drively/${type}s/${id}${permanent ? '?permanent=true' : ''}`;
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(permanent ? 'Permanently deleted' : 'Moved to trash');
        fetchBootstrap();
        return true;
      } else {
        toast.error(data.error || 'Delete failed');
        return false;
      }
    } catch (error) {
      toast.error('Delete error');
      return false;
    }
  };

  const updateItem = async (type, id, payload) => {
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
        toast.error(data.error || 'Update failed');
        return false;
      }
    } catch (error) {
      toast.error('Update error');
      return false;
    }
  };

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
        uploadFiles,
        createNewFolder,
        deleteItem,
        updateItem,
        refresh: fetchBootstrap,
      }}
    >
      {children}
    </DrivelyContext.Provider>
  );
}

export const useDrively = () => useContext(DrivelyContext);
