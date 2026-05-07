'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const JournalyContext = createContext();

export function JournalyProvider({ children }) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('journal');
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  const fetchBootstrap = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/journaly/bootstrap');
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries);
        setStats(data.stats);
        setTags(data.tags);
      } else {
        setError(data.message || 'Failed to load journal');
      }
    } catch (err) {
      setError('Connection error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  const addEntry = async (payload) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/journaly/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setEntries((prev) => [data.entry, ...prev]);
        fetchBootstrap(); // Refresh stats and tags
        return data.entry;
      } else {
        toast.error(data.message || 'Failed to save entry');
      }
    } catch (err) {
      toast.error('Failed to save entry');
    } finally {
      setIsSyncing(false);
    }
    return null;
  };

  const updateEntry = async (id, patch) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/journaly/entries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.success) {
        setEntries((prev) => prev.map((e) => (e._id === id ? data.entry : e)));
        fetchBootstrap();
        return data.entry;
      } else {
        toast.error(data.message || 'Failed to update entry');
      }
    } catch (err) {
      toast.error('Failed to update entry');
    } finally {
      setIsSyncing(false);
    }
    return null;
  };

  const deleteEntry = async (id) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/journaly/entries/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setEntries((prev) => prev.filter((e) => e._id !== id));
        fetchBootstrap();
        toast.success('Entry deleted');
        return true;
      } else {
        toast.error(data.message || 'Failed to delete entry');
      }
    } catch (err) {
      toast.error('Failed to delete entry');
    } finally {
      setIsSyncing(false);
    }
    return false;
  };

  return (
    <JournalyContext.Provider
      value={{
        activeTab,
        setActiveTab,
        entries,
        stats,
        tags,
        isLoading,
        isSyncing,
        error,
        fetchBootstrap,
        addEntry,
        updateEntry,
        deleteEntry,
      }}
    >
      {children}
    </JournalyContext.Provider>
  );
}

export const useJournaly = () => useContext(JournalyContext);
