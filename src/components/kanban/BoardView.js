'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Search,
  Copy,
  Download,
  Upload,
  LayoutList,
  ChevronDown,
  CheckSquare,
  Square,
  GripVertical,
} from 'lucide-react';
import { SkeletonWrapper } from 'react-skeletonify';
import Column from '@/components/kanban/Column';
import CardModal from '@/components/kanban/CardModal';

const TEMPLATES = [
  {
    name: 'Bug Report',
    labels: ['Bug'],
    priority: 'urgent',
    checklist: [
      { text: 'Steps to reproduce', done: false },
      { text: 'Expected behavior', done: false },
      { text: 'Actual behavior', done: false },
    ],
  },
  {
    name: 'Feature Request',
    labels: ['Feature'],
    priority: 'medium',
    checklist: [
      { text: 'Description', done: false },
      { text: 'Acceptance criteria', done: false },
    ],
  },
  {
    name: 'Task',
    labels: ['Chore'],
    priority: 'medium',
    checklist: [{ text: 'Subtask 1', done: false }],
  },
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [compact, setCompact] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState(new Set());
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [collapsedColumns, setCollapsedColumns] = useState(new Set());
  const [columnOrder, setColumnOrder] = useState(null);
  const searchRef = useRef(null);

  const sortedColumns = columnOrder
    ? columnOrder.map((id) => columns.find((c) => c._id === id)).filter(Boolean)
    : [...columns].sort((a, b) => a.position - b.position);

  const filteredCards = searchQuery.trim()
    ? cards.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.labels?.some((l) => l.toLowerCase().includes(q)) ||
          c.priority?.toLowerCase().includes(q)
        );
      })
    : cards;

  useEffect(() => {
    if (!columnOrder && columns.length > 0) {
      setColumnOrder(columns.map((c) => c._id));
    }
  }, [columns, columnOrder]);

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
        setColumnOrder((prev) => (prev ? [...prev, data.column._id] : null));
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
        setColumnOrder((prev) => prev?.filter((id) => id !== columnId) || null);
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

  const handleTemplateAdd = async (columnId, template) => {
    try {
      const res = await fetch(`/api/kanban/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: template.name,
          columnId,
          labels: template.labels,
          priority: template.priority,
          checklist: template.checklist,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onCardCreated(data.card);
      }
    } catch (error) {
      console.error('Failed to add template card:', error);
    }
  };

  const toggleBulkSelect = (cardId) => {
    setSelectedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedCards.size === 0) return;
    if (!confirm(`Delete ${selectedCards.size} selected cards?`)) return;
    for (const id of selectedCards) {
      try {
        await fetch(`/api/kanban/cards/${id}`, { method: 'DELETE' });
        onCardDeleted(id);
      } catch (error) {
        console.error('Bulk delete failed:', error);
      }
    }
    setSelectedCards(new Set());
    setBulkMode(false);
  };

  const handleBulkMove = async (targetColumnId) => {
    if (selectedCards.size === 0) return;
    for (const id of selectedCards) {
      onCardMoved(id, targetColumnId, 999);
    }
    setSelectedCards(new Set());
    setBulkMode(false);
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/kanban/boards/${boardId}/export`);
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kanban-board-${boardId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const res = await fetch(`/api/kanban/boards/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: text,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.board) {
            window.location.href = `/apps/kanban`;
          }
        } else {
          alert('Import failed. Check the file format.');
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed.');
      }
    };
    input.click();
  };

  const handleColumnDragStart = (e, columnId) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `column:${columnId}`);
  };

  const handleColumnDrop = (e, targetColumnId) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data.startsWith('column:')) return;
    const draggedId = data.replace('column:', '');
    if (draggedId === targetColumnId) return;
    setColumnOrder((prev) => {
      if (!prev) return prev;
      const idx = prev.indexOf(draggedId);
      const targetIdx = prev.indexOf(targetColumnId);
      if (idx === -1 || targetIdx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      next.splice(targetIdx, 0, draggedId);
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'SELECT'
      )
        return;
      if (e.key === '/' && !searchQuery) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setModalCard(null);
        setBulkMode(false);
        setSelectedCards(new Set());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

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
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex items-center gap-2 px-4 pt-3 pb-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0b2ac]" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards... (/)"
            className="w-full rounded-lg border border-[#e5e3d8] bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0b2ac] hover:text-[#1e3a34] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#1f644e] bg-[#f0f5f2] hover:bg-[#e2ede7] rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Template
              <ChevronDown className="w-3 h-3" />
            </button>
            {showTemplateMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTemplateMenu(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg border border-[#e5e3d8] shadow-lg py-1 min-w-[160px]">
                  {sortedColumns.map((col) => (
                    <div key={col._id}>
                      <div className="px-3 py-1.5 text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                        {col.title}
                      </div>
                      {TEMPLATES.map((tpl) => (
                        <button
                          key={`${col._id}-${tpl.name}`}
                          onClick={() => {
                            handleTemplateAdd(col._id, tpl);
                            setShowTemplateMenu(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] cursor-pointer"
                        >
                          {tpl.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setCompact(!compact)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              compact ? 'bg-[#1f644e]/10 text-[#1f644e]' : 'text-[#7c8e88] hover:bg-[#f0f5f2]'
            }`}
            title={compact ? 'Expanded view' : 'Compact view'}
          >
            <LayoutList className="w-4 h-4" />
          </button>

          <button
            onClick={() => setBulkMode(!bulkMode)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              bulkMode ? 'bg-[#1f644e]/10 text-[#1f644e]' : 'text-[#7c8e88] hover:bg-[#f0f5f2]'
            }`}
            title="Bulk actions"
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            className="p-2 text-[#7c8e88] hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer"
            title="Export board"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleImport}
            className="p-2 text-[#7c8e88] hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer"
            title="Import board"
          >
            <Upload className="w-4 h-4" />
          </button>

          <button
            onClick={onRefresh}
            className="p-2 text-[#7c8e88] hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {bulkMode && selectedCards.size > 0 && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-[#f0f5f2] border-b border-[#e5e3d8]">
          <span className="text-xs font-bold text-[#1e3a34]">{selectedCards.size} selected</span>
          <span className="text-[#a0b2ac] text-xs">|</span>
          <button
            onClick={handleBulkDelete}
            className="text-xs font-bold text-[#c94c4c] hover:bg-red-50 px-2 py-1 rounded cursor-pointer"
          >
            Delete
          </button>
          <span className="text-[#a0b2ac] text-xs">|</span>
          <span className="text-xs font-bold text-[#7c8e88]">Move to:</span>
          {sortedColumns.map((col) => (
            <button
              key={col._id}
              onClick={() => handleBulkMove(col._id)}
              className="text-xs font-bold text-[#1f644e] hover:bg-[#e2ede7] px-2 py-1 rounded cursor-pointer"
            >
              {col.title}
            </button>
          ))}
          <button
            onClick={() => {
              setBulkMode(false);
              setSelectedCards(new Set());
            }}
            className="text-xs font-bold text-[#7c8e88] hover:bg-[#e5e3d8] px-2 py-1 rounded cursor-pointer ml-auto"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex-1 overflow-x-auto">
        <div
          className="flex gap-4 p-4 lg:p-6 min-h-[calc(100vh-16rem)]"
          style={{ minWidth: sortedColumns.length * 300 + 80 }}
        >
          {sortedColumns.map((column) => {
            const columnCards = filteredCards
              .filter(
                (c) =>
                  c.columnId === column._id || c.columnId?.toString() === column._id?.toString()
              )
              .sort((a, b) => a.position - b.position);

            const isCollapsed = collapsedColumns.has(column._id);

            return (
              <div
                key={column._id}
                draggable
                onDragStart={(e) => handleColumnDragStart(e, column._id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => handleColumnDrop(e, column._id)}
              >
                <Column
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
                  collapsed={isCollapsed}
                  onToggleCollapse={() =>
                    setCollapsedColumns((prev) => {
                      const next = new Set(prev);
                      if (next.has(column._id)) next.delete(column._id);
                      else next.add(column._id);
                      return next;
                    })
                  }
                  compact={compact}
                />
              </div>
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
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
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
