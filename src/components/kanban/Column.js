'use client';

import { useState, useRef } from 'react';
import { Plus, Trash2, Pencil, Check, X, Loader2, MoreHorizontal } from 'lucide-react';
import KanbanCard from '@/components/kanban/Card';

export default function Column({
  column,
  cards,
  onCardMoved,
  onCardDeleted,
  onCardClick,
  onQuickAdd,
  isEditing,
  editTitle,
  onEditTitleChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  isUpdating,
  collapsed,
  onToggleCollapse,
  compact,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);
  const dragCardId = useRef(null);

  const handleDragStart = (e, cardId) => {
    dragCardId.current = cardId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
    const card = cards.find((c) => c._id === cardId);
    if (card) {
      const ghost = document.createElement('div');
      ghost.textContent = card.title;
      ghost.style.cssText =
        'padding:8px 12px;background:#1f644e;color:white;font-size:13px;font-weight:700;border-radius:8px;position:absolute;top:-1000px;';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 10, 10);
      setTimeout(() => document.body.removeChild(ghost), 0);
    }
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleColumnDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleColumnDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      onCardMoved(cardId, column._id, cards.length);
    }
    dragCardId.current = null;
  };

  const handleDropZoneDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoverIndex(index);
  };

  const handleDropZoneDragLeave = () => {
    setHoverIndex(null);
  };

  const handleDropZoneDrop = (e, index) => {
    e.preventDefault();
    setHoverIndex(null);
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      onCardMoved(cardId, column._id, index);
    }
    dragCardId.current = null;
  };

  const handleQuickAddSubmit = (e) => {
    e.preventDefault();
    if (!quickAddText.trim()) return;
    onQuickAdd(column._id, quickAddText.trim());
    setQuickAddText('');
    setShowQuickAdd(false);
  };

  const renderDropZone = (index) => {
    const isHovered = hoverIndex === index;
    return (
      <div
        onDragOver={(e) => handleDropZoneDragOver(e, index)}
        onDragLeave={handleDropZoneDragLeave}
        onDrop={(e) => handleDropZoneDrop(e, index)}
        className={`transition-all duration-150 ${
          isHovered ? 'h-2 bg-[#1f644e] rounded-full my-0.5' : 'h-0.5'
        }`}
      />
    );
  };

  const wipExceeded = column.wipLimit && cards.length > column.wipLimit;

  return (
    <div
      className={`flex-shrink-0 flex flex-col rounded-xl transition-colors duration-200 ${
        collapsed ? 'w-[50px]' : 'w-[280px]'
      } ${isDragOver ? 'bg-[#1f644e]/5 ring-2 ring-[#1f644e]/30' : 'bg-[#f0f5f2]'}`}
    >
      <div
        className="flex items-center justify-between px-3 py-3 border-b border-[#e5e3d8]"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', `column:${column._id}`);
        }}
      >
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            className="w-full text-center text-sm font-bold text-[#1e3a34] cursor-pointer py-2"
            title={column.title}
          >
            {cards.length}
          </button>
        ) : isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              className="flex-1 rounded-lg border border-[#e5e3d8] bg-white px-2 py-1 text-sm font-bold outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20"
              autoFocus
            />
            <button
              onClick={onSaveEdit}
              disabled={isUpdating || !editTitle.trim()}
              className="p-1 text-[#1f644e] hover:bg-[#e2ede7] rounded cursor-pointer disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={onCancelEdit}
              className="p-1 text-[#7c8e88] hover:bg-[#e5e3d8] rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0 cursor-grab active:cursor-grabbing">
              <span className="text-sm font-bold text-[#1e3a34] truncate">{column.title}</span>
              <span
                className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                  wipExceeded ? 'bg-[#c94c4c] text-white' : 'bg-[#e5e3d8] text-[#7c8e88]'
                }`}
              >
                {cards.length}
              </span>
              {column.wipLimit && (
                <span
                  className={`text-[10px] font-bold ${
                    wipExceeded ? 'text-[#c94c4c]' : 'text-[#7c8e88]'
                  }`}
                >
                  / {column.wipLimit}
                </span>
              )}
            </div>

            <div className="relative flex items-center gap-1">
              <button
                onClick={onToggleCollapse}
                className="p-1 text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#e5e3d8] rounded transition-colors cursor-pointer"
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="p-1 text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#e2ede7] rounded transition-colors cursor-pointer"
                title="Add card"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#e5e3d8] rounded transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg border border-[#e5e3d8] shadow-lg py-1 min-w-[140px]">
                      <button
                        onClick={() => {
                          onStartEdit();
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          onDelete();
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-[#c94c4c] hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {!collapsed && showQuickAdd && (
        <form onSubmit={handleQuickAddSubmit} className="px-3 pt-2">
          <input
            type="text"
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            placeholder="Card title..."
            className="w-full rounded-lg border border-[#e5e3d8] bg-white px-3 py-2 text-sm outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20 mb-2"
            autoFocus
          />
          <div className="flex items-center gap-2 mb-2">
            <button
              type="submit"
              disabled={!quickAddText.trim()}
              className="px-3 py-1.5 bg-[#1f644e] text-white text-xs font-bold rounded-lg hover:bg-[#17503e] disabled:opacity-50 transition-colors cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowQuickAdd(false);
                setQuickAddText('');
              }}
              className="text-xs text-[#7c8e88] hover:text-[#1e3a34] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!collapsed && (
        <div
          className="flex-1 overflow-y-auto p-2 space-y-0 min-h-[60px]"
          onDragOver={handleColumnDragOver}
          onDragLeave={handleColumnDragLeave}
          onDrop={handleColumnDrop}
        >
          {cards.length === 0 && !isDragOver ? (
            <div className="text-center py-8 text-xs text-[#a0b2ac]">No cards yet</div>
          ) : (
            <>
              {renderDropZone(0)}
              {cards.map((card, index) => (
                <div key={card._id}>
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, card._id)}
                    onClick={() => onCardClick(card)}
                  >
                    <KanbanCard card={card} onDelete={onCardDeleted} compact={compact} />
                  </div>
                  {renderDropZone(index + 1)}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
