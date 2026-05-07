'use client';

import { useState } from 'react';
import { MoreVertical, Star, Trash2, Pencil, Download, ExternalLink, RefreshCcw } from 'lucide-react';
import { useDrively } from '@/context/DrivelyContext';

export default function ActionMenu({ type, item, variant = 'default' }) {
  const [isOpen, setIsOpen] = useState(false);
  const { deleteItem, updateItem } = useDrively();

  const handleAction = async (action, e) => {
    e.stopPropagation();
    setIsOpen(false);

    switch (action) {
      case 'star':
        await updateItem(type, item._id, { starred: !item.starred });
        break;
      case 'rename':
        const newName = prompt(`Enter new name for ${type === 'file' ? 'file' : 'folder'}:`, type === 'file' ? item.filename : item.name);
        if (newName) {
          await updateItem(type, id, type === 'file' ? { filename: newName } : { name: newName });
        }
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
        if (type === 'file') window.open(item.secureUrl, '_blank');
        break;
    }
  };

  const isDeleted = !!item.deletedAt;

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`p-1.5 rounded-lg transition-colors ${
          variant === 'overlay' ? 'bg-white shadow-sm' : 'hover:bg-[#fcfbf5]'
        }`}
      >
        <MoreVertical className="w-4 h-4 text-[#7c8e88]" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#e5e3d8] rounded-xl shadow-xl z-20 overflow-hidden py-1">
            {!isDeleted ? (
              <>
                {type === 'file' && (
                  <button
                    onClick={(e) => handleAction('download', e)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
                <button
                  onClick={(e) => handleAction('star', e)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors"
                >
                  <Star className={`w-4 h-4 ${item.starred ? 'fill-[#1f644e] text-[#1f644e]' : ''}`} />
                  {item.starred ? 'Unstar' : 'Star'}
                </button>
                <button
                  onClick={(e) => handleAction('delete', e)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#c94c4c] hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => handleAction('restore', e)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1f644e] hover:bg-[#f0f5f2] transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Restore
                </button>
                <button
                  onClick={(e) => handleAction('delete', e)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#c94c4c] hover:bg-red-50 transition-colors"
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
  );
}
