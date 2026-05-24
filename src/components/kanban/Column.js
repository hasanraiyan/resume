'use client';

import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, Pencil, Check, X, Loader2, MoreHorizontal } from 'lucide-react';
import KanbanCard from '@/components/kanban/Card';

export default function Column({
  column,
  cards,
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
  index,
}) {
  const [quickAddText, setQuickAddText] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleQuickAddSubmit = (e) => {
    e.preventDefault();
    if (!quickAddText.trim()) return;
    onQuickAdd(column._id, quickAddText.trim());
    setQuickAddText('');
    setShowQuickAdd(false);
  };

  const wipExceeded = column.wipLimit && cards.length > column.wipLimit;
  const columnId = String(column._id);

  return (
    <Draggable draggableId={`column-${columnId}`} index={index} isDragDisabled={collapsed}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex-shrink-0 flex flex-col rounded-xl bg-[#f0f5f2] ${
            collapsed ? 'w-[50px]' : 'w-[280px]'
          }`}
        >
          <div
            {...provided.dragHandleProps}
            className="flex items-center justify-between px-3 py-3 border-b border-[#e5e3d8]"
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
                      className={`text-[10px] font-bold ${wipExceeded ? 'text-[#c94c4c]' : 'text-[#7c8e88]'}`}
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
            <Droppable droppableId={columnId} type="CARD">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 overflow-y-auto p-2 space-y-0 min-h-[60px] transition-colors duration-200 ${
                    snapshot.isDraggingOver ? 'bg-[#1f644e]/5' : ''
                  }`}
                >
                  {cards.length === 0 && !snapshot.isDraggingOver ? (
                    <div className="text-center py-8 text-xs text-[#a0b2ac]">No cards yet</div>
                  ) : (
                    cards.map((card, index) => (
                      <Draggable key={card._id} draggableId={`card-${card._id}`} index={index}>
                        {(provided, snap) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onCardClick(card)}
                            className={`mb-2 ${snap.isDragging ? 'rotate-2 shadow-xl' : ''}`}
                          >
                            <KanbanCard card={card} onDelete={onCardDeleted} compact={compact} />
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  );
}
