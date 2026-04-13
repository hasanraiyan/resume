'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const MemoscribeContext = createContext();

export function MemoscribeProvider({ children }) {
  const [activeTab, setActiveTab] = useState('notes');
  const [notes, setNotes] = useState([]);
  const [settings, setSettings] = useState({ qdrantUrl: '', hasApiKey: false });
  const [loading, setLoading] = useState(true);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    fetchNotes();
    fetchSettings();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/memoscribe/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/memoscribe/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const addNote = async (title, description, text) => {
    try {
      const res = await fetch('/api/memoscribe/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, text }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes([data.note, ...notes]);
        return true;
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
    return false;
  };

  const deleteNote = async (id) => {
    try {
      const res = await fetch(`/api/memoscribe/notes/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotes(notes.filter((n) => n._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const saveSettings = async (qdrantUrl, qdrantApiKey) => {
    try {
      const res = await fetch('/api/memoscribe/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qdrantUrl, qdrantApiKey }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        return true;
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
    return false;
  };

  return (
    <MemoscribeContext.Provider
      value={{
        activeTab,
        setActiveTab,
        notes,
        settings,
        loading,
        addNote,
        deleteNote,
        saveSettings,
        chatMessages,
        setChatMessages,
        chatInput,
        setChatInput,
      }}
    >
      {children}
    </MemoscribeContext.Provider>
  );
}

export const useMemoscribe = () => useContext(MemoscribeContext);
