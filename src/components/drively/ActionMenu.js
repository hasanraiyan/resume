'use client';

import { useState, useRef } from 'react';
import {
  MoreVertical,
  Star,
  Trash2,
  Pencil,
  Download,
  RefreshCcw,
  FolderInput,
} from 'lucide-react';
import { useDrively } from '@/context/DrivelyContext';
import RenameModal from './RenameModal';
import MoveModal from './MoveModal';

export default function ActionMenu({ type, item, variant = 'default' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [showRename, setShowRename] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const buttonRef = useRef(null);
  const { deleteItem, updateItem } = useDrively();

  const handleAction = async (action, e) => {
    if (e) e.stopPropagation();
    setIsOpen(false);

    switch (action) {
      case 'star':
        await updateItem(type, item._id, { starred: !item.starred });
        break;
      case 'rename':
        setShowRename(true);
        break;
      case 'move':
        setShowMove(true);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete this ${type}?`)) {
          await deleteItem(type, item._id, !!item.deletedAt);
        }
        break;
      case 'restore':
        await updateItem(type, item._id, { restore: true });
        break;
      case 'download':
        if (type === 'file') {
          window.open(`/api/drively/download/${item._id}`, '_blank');
        }
        break;
    }
  };

  const handleRename = async (newName) => {
    const payload = type === 'file' ? { filename: newName } : { name: newName };
    await updateItem(type, item._id, payload);
  };

  const isDeleted = !!item.deletedAt;

  const handleOpen = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleOpen}
          className={`p-1.5 rounded-lg transition-colors ${
            variant === 'overlay' ? 'bg-white shadow-sm' : 'hover:bg-[#fcfbf5]'
          }`}
        >
          <MoreVertical className="w-4 h-4 text-[#7c8e88]" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />
            <div
              className="fixed w-56 bg-white border border-[#e5e3d8] rounded-xl shadow-xl z-50 overflow-hidden py-1"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              {!isDeleted ? (
                <>
                  {type === 'file' && (
                    <button
                      onClick={(e) => handleAction('download', e)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  )}
                  <button
                    onClick={(e) => handleAction('rename', e)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors whitespace-nowrap"
                  >
                    <Pencil className="w-4 h-4" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => handleAction('move', e)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors whitespace-nowrap"
                  >
                    <FolderInput className="w-4 h-4" />
                    Move to...
                  </button>
                  <button
                    onClick={(e) => handleAction('star', e)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors whitespace-nowrap"
                  >
                    <Star
                      className={`w-4 h-4 ${item.starred ? 'fill-[#1f644e] text-[#1f644e]' : ''}`}
                    />
                    {item.starred ? 'Unstar' : 'Star'}
                  </button>
                  <button
                    onClick={(e) => handleAction('delete', e)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#c94c4c] hover:bg-red-50 transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={(e) => handleAction('restore', e)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1f644e] hover:bg-[#f0f5f2] transition-colors whitespace-nowrap"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Restore
                  </button>
                  <button
                    onClick={(e) => handleAction('delete', e)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#c94c4c] hover:bg-red-50 transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {showRename && (
        <RenameModal
          type={type}
          item={item}
          onConfirm={handleRename}
          onClose={() => setShowRename(false)}
        />
      )}

      {showMove && (
        <MoveModal
          onConfirm={async (targetFolderId) => {
            const payload =
              type === 'file' ? { folderId: targetFolderId } : { parentId: targetFolderId };
            await updateItem(type, item._id, payload);
            setShowMove(false);
          }}
          onClose={() => setShowMove(false)}
        />
      )}
    </>
  );
}
