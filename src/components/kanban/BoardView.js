'use client';

import { useState } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { SkeletonWrapper } from 'react-skeletonify';
import Column from '@/components/kanban/Column';
import CardModal from '@/components/kanban/CardModal';

export default function BoardView({
  boardId,
  columns,
  cards,
  isLoading,
  onCardMoved,
  onCardCreated,
  onCardUpdated,
  onCardDeleted,
  onColumnCreated,
  onColumnUpdated,
  onColumnDeleted,
  onRefresh,
}) {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [editColumnTitle, setEditColumnTitle] = useState('');
  const [isUpdatingColumn, setIsUpdatingColumn] = useState(false);
  const [modalCard, setModalCard] = useState(null);

  const handleCreateColumn = async (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim() || isCreatingColumn) return;

    setIsCreatingColumn(true);
    try {
      const res = await fetch(`/api/kanban/boards/${boardId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newColumnTitle.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        onColumnCreated(data.column);
        setNewColumnTitle('');
        setIsAddingColumn(false);
      }
    } catch (error) {
      console.error('Failed to create column:', error);
    } finally {
      setIsCreatingColumn(false);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (!confirm('Delete this column and all its cards?')) return;

    try {
      const res = await fetch(`/api/kanban/columns/${columnId}`, { method: 'DELETE' });
      if (res.ok) {
        onColumnDeleted(columnId);
      }
    } catch (error) {
      console.error('Failed to delete column:', error);
    }
  };

  const startEditColumn = (column) => {
    setEditingColumnId(column._id);
    setEditColumnTitle(column.title);
  };

  const handleUpdateColumn = async (columnId) => {
    if (!editColumnTitle.trim() || isUpdatingColumn) return;

    setIsUpdatingColumn(true);
    try {
      const res = await fetch(`/api/kanban/columns/${columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editColumnTitle.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        onColumnUpdated(data.column);
        setEditingColumnId(null);
      }
    } catch (error) {
      console.error('Failed to update column:', error);
    } finally {
      setIsUpdatingColumn(false);
    }
  };

  const handleQuickAdd = async (columnId, title) => {
    try {
      const res = await fetch(`/api/kanban/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, columnId }),
      });

      if (res.ok) {
        const data = await res.json();
        onCardCreated(data.card);
      }
    } catch (error) {
      console.error('Failed to add card:', error);
    }
  };

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  if (isLoading) {
    return (
      <div className="flex gap-4 p-4 lg:p-6 min-h-[calc(100vh-12rem)]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-[280px] bg-[#f0f5f2] rounded-xl p-3 space-y-3">
            <SkeletonWrapper loading>
              <div className="h-5 w-24" />
            </SkeletonWrapper>
            <SkeletonWrapper loading>
              <div className="h-24 w-full rounded-lg" />
            </SkeletonWrapper>
            <SkeletonWrapper loading>
              <div className="h-24 w-full rounded-lg" />
            </SkeletonWrapper>
            <SkeletonWrapper loading>
              <div className="h-20 w-full rounded-lg" />
            </SkeletonWrapper>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-auto">
      <div
        className="flex gap-4 p-4 lg:p-6 min-h-[calc(100vh-12rem)]"
        style={{ minWidth: sortedColumns.length * 300 + 80 }}
      >
        {sortedColumns.map((column) => {
          const columnCards = cards
            .filter(
              (c) => c.columnId === column._id || c.columnId?.toString() === column._id?.toString()
            )
            .sort((a, b) => a.position - b.position);

          return (
            <Column
              key={column._id}
              column={column}
              cards={columnCards}
              onCardMoved={onCardMoved}
              onCardDeleted={onCardDeleted}
              onCardClick={setModalCard}
              onQuickAdd={handleQuickAdd}
              isEditing={editingColumnId === column._id}
              editTitle={editColumnTitle}
              onEditTitleChange={setEditColumnTitle}
              onStartEdit={() => startEditColumn(column)}
              onSaveEdit={() => handleUpdateColumn(column._id)}
              onCancelEdit={() => setEditingColumnId(null)}
              onDelete={() => handleDeleteColumn(column._id)}
              isUpdating={isUpdatingColumn}
            />
          );
        })}

        {isAddingColumn ? (
          <form onSubmit={handleCreateColumn} className="flex-shrink-0 w-[280px]">
            <div className="bg-[#f0f5f2] rounded-xl p-3 border border-[#e5e3d8]">
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Column title..."
                className="w-full rounded-lg border border-[#e5e3d8] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20 mb-2"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!newColumnTitle.trim() || isCreatingColumn}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#1f644e] text-white text-xs font-bold rounded-lg hover:bg-[#17503e] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isCreatingColumn ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingColumn(false);
                    setNewColumnTitle('');
                  }}
                  className="p-1.5 text-[#7c8e88] hover:bg-[#e5e3d8] rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingColumn(true)}
            className="flex-shrink-0 w-[280px] h-fit border-2 border-dashed border-[#e5e3d8] rounded-xl p-4 text-[#7c8e88] hover:border-[#1f644e]/40 hover:text-[#1f644e] hover:bg-[#f0f5f2]/50 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-bold">Add Column</span>
          </button>
        )}
      </div>

      {modalCard && (
        <CardModal
          card={modalCard}
          boardId={boardId}
          columns={columns}
          onClose={() => setModalCard(null)}
          onUpdated={onCardUpdated}
          onDeleted={(id) => {
            onCardDeleted(id);
            setModalCard(null);
          }}
        />
      )}
    </div>
  );
}
