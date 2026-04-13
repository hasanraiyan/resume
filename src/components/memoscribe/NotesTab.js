'use client';

import React, { useState } from 'react';
import { useMemoscribe } from '@/context/MemoscribeContext';
import { Plus, Copy, Trash2, Loader2, Check } from 'lucide-react';

export default function NotesTab() {
  const { notes, loading, addNote, deleteNote } = useMemoscribe();
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleSave = async () => {
    if (!title || !text) return;
    setSaving(true);
    const success = await addNote(title, description, text);
    setSaving(false);
    if (success) {
      setTitle('');
      setDescription('');
      setText('');
      setShowAddModal(false);
    }
  };

  const handleCopy = (id, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1f644e]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Your Clips</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#1f644e] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#17503e] transition cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Clip
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-[#e5e3d8] bg-white">
          <p className="text-[#7c8e88] font-bold">No clips found. Add one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((note) => (
            <div
              key={note._id}
              className="rounded-xl border border-[#e5e3d8] bg-white p-5 flex flex-col gap-3 relative group"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-[#1e3a34]">{note.title}</h3>
                  {note.description && (
                    <p className="text-sm text-[#7c8e88] mt-1">{note.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(note._id, note.text)}
                    className="p-2 text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2] rounded-lg transition"
                    title="Copy to clipboard"
                  >
                    {copiedId === note._id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteNote(note._id)}
                    className="p-2 text-[#7c8e88] hover:text-[#c94c4c] hover:bg-red-50 rounded-lg transition"
                    title="Delete clip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-[#f0f5f2] p-3 rounded-lg text-sm text-[#1e3a34] whitespace-pre-wrap font-mono mt-auto max-h-32 overflow-y-auto">
                {note.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[#fcfbf5] w-full max-w-md rounded-xl border border-[#e5e3d8] shadow-xl p-5 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-4">Add New Clip</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#7c8e88] mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., API Key, Recipe, Note"
                  className="w-full rounded-xl border border-[#e5e3d8] bg-white py-2.5 px-4 text-sm outline-none transition placeholder:text-[#7c8e88] focus:border-[#1f644e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#7c8e88] mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief context..."
                  className="w-full rounded-xl border border-[#e5e3d8] bg-white py-2.5 px-4 text-sm outline-none transition placeholder:text-[#7c8e88] focus:border-[#1f644e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#7c8e88] mb-1">
                  Content *
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="The text you want to save and retrieve later..."
                  rows={4}
                  className="w-full rounded-xl border border-[#e5e3d8] bg-white py-2.5 px-4 text-sm outline-none transition placeholder:text-[#7c8e88] focus:border-[#1f644e] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-[#7c8e88] hover:bg-[#e5e3d8]/50 transition cursor-pointer"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title || !text}
                className="bg-[#1f644e] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#17503e] transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Clip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
