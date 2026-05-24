'use client';

import { useState } from 'react';
import { Plus, LayoutDashboard, Trash2, Pencil, Check, X, Loader2, Copy } from 'lucide-react';

export default function BoardsTab({
  boards,
  onSelectBoard,
  onBoardCreated,
  onBoardDeleted,
  onBoardUpdated,
  onBoardDuplicated,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/kanban/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onBoardCreated(data.board);
        setNewName('');
        setNewDescription('');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to create board:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (board) => {
    setEditingId(board._id);
    setEditName(board.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleUpdate = async (id) => {
    if (!editName.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/kanban/boards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        onBoardUpdated(data.board);
        setEditingId(null);
      }
    } catch (error) {
      console.error('Failed to update board:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    const board = boards.find((b) => b._id === id);
    if (!confirm(`Delete "${board?.name}" and all its cards?`)) return;

    try {
      const res = await fetch(`/api/kanban/boards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onBoardDeleted(id);
      }
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await fetch(`/api/kanban/boards/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        onBoardDuplicated(data.board);
      }
    } catch (error) {
      console.error('Failed to duplicate board:', error);
    }
  };

  const boardColors = [
    '#1f644e',
    '#4a6fa5',
    '#c97b3a',
    '#7b4f9c',
    '#c94c4c',
    '#3a8a7a',
    '#b5536b',
    '#5a7a3a',
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1e3a34]">All Boards</h2>
          <p className="text-sm text-[#7c8e88] mt-1">
            {boards.length} board{boards.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1f644e] text-white text-sm font-bold rounded-lg hover:bg-[#17503e] transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Board
        </button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-[#e5e3d8] p-6 shadow-sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1e3a34] mb-1.5">Board Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Sprint 24, Personal Goals"
                className="w-full rounded-lg border border-[#e5e3d8] bg-[#fcfbf5] px-4 py-2.5 text-sm outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1e3a34] mb-1.5">
                Description (optional)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What is this board for?"
                className="w-full rounded-lg border border-[#e5e3d8] bg-[#fcfbf5] px-4 py-2.5 text-sm outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20 resize-none min-h-[60px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newName.trim() || isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#1f644e] text-white text-sm font-bold rounded-lg hover:bg-[#17503e] disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Board
              </button>
            </div>
          </div>
        </form>
      )}

      {boards.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[#e5e3d8] rounded-xl bg-gradient-to-b from-[#fcfbf5] to-white">
          <div className="inline-flex p-3 bg-[#1f644e]/5 rounded-full mb-4">
            <LayoutDashboard className="w-10 h-10 text-[#1f644e]" />
          </div>
          <p className="text-[#1e3a34] font-bold text-lg mb-1">No boards yet</p>
          <p className="text-[#7c8e88] text-sm">Create your first Kanban board to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board, i) => (
            <div
              key={board._id}
              className="group bg-white rounded-xl border border-[#e5e3d8] hover:border-[#1f644e]/30 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
            >
              <div
                className="h-2"
                style={{ backgroundColor: boardColors[i % boardColors.length] }}
              />
              <div className="p-5">
                {editingId === board._id ? (
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded-lg border border-[#e5e3d8] bg-[#fcfbf5] px-3 py-1.5 text-sm font-bold outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdate(board._id)}
                      disabled={isUpdating || !editName.trim()}
                      className="p-1.5 text-[#1f644e] hover:bg-[#f0f5f2] rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1.5 text-[#7c8e88] hover:bg-[#f0f5f2] rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div onClick={() => onSelectBoard(board._id)} className="cursor-pointer">
                    <h3 className="text-base font-bold text-[#1e3a34] mb-1">{board.name}</h3>
                    {board.description && (
                      <p className="text-sm text-[#7c8e88] line-clamp-2">{board.description}</p>
                    )}
                  </div>
                )}

                {editingId !== board._id && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0f5f2]">
                    <span className="text-xs font-semibold text-[#a0b2ac]">
                      Created {new Date(board.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(board._id);
                        }}
                        className="p-1.5 text-[#7c8e88] hover:text-[#7b4f9c] hover:bg-[#f3e5f5] rounded-lg transition-colors cursor-pointer"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(board);
                        }}
                        className="p-1.5 text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer"
                        title="Rename"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(board._id);
                        }}
                        className="p-1.5 text-[#7c8e88] hover:text-[#c94c4c] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
