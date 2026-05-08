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
  Copy,
  Link as LinkIcon,
  Palette,
  Check,
} from 'lucide-react';
import { useDrively } from '@/context/DrivelyContext';
import RenameModal from './RenameModal';
import MoveModal from './MoveModal';
import { toast } from 'sonner';

const COLORS = [
  { name: 'Red', value: '#fee2e2', text: '#991b1b' },
  { name: 'Orange', value: '#ffedd5', text: '#9a3412' },
  { name: 'Amber', value: '#fef3c7', text: '#92400e' },
  { name: 'Green', value: '#dcfce7', text: '#166534' },
  { name: 'Teal', value: '#ccfbf1', text: '#115e59' },
  { name: 'Blue', value: '#dbeafe', text: '#1e40af' },
  { name: 'Purple', value: '#f3e8ff', text: '#6b21a8' },
  { name: 'Pink', value: '#fce7f3', text: '#9d174d' },
];

export default function ActionMenu({ type, item, variant = 'default' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [showRename, setShowRename] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState(null);

  const buttonRef = useRef(null);
  const { deleteItem, updateItem, duplicateItem, shareItem, revokeShare, shares } = useDrively();

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
      case 'duplicate':
        await duplicateItem(item._id);
        break;
      case 'share':
        const data = await shareItem(item._id);
        if (data) {
          setShareData(data);
          setShowShareModal(true);
        }
        break;
      case 'color':
        setShowColorPicker(true);
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
                    <>
                      <button
                        onClick={(e) => handleAction('download', e)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button
                        onClick={(e) => handleAction('duplicate', e)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors whitespace-nowrap"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={(e) => handleAction('share', e)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors whitespace-nowrap"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Share
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => handleAction('rename', e)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors whitespace-nowrap"
                  >
                    <Pencil className="w-4 h-4" />
                    Rename
                  </button>
                  {type === 'folder' && (
                    <button
                      onClick={(e) => handleAction('color', e)}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-3">
                        <Palette className="w-4 h-4" />
                        Folder Color
                      </div>
                      {item.color && (
                        <div
                          className="w-3 h-3 rounded-full border border-black/10"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                    </button>
                  )}
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

      {showColorPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          onClick={() => setShowColorPicker(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#e5e3d8]">
              <h3 className="text-lg font-bold">Choose Folder Color</h3>
              <p className="text-sm text-[#7c8e88]">Personalize "{item.name}"</p>
            </div>
            <div className="p-6 grid grid-cols-4 gap-4">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={async () => {
                    await updateItem('folder', item._id, { color: color.value });
                    setShowColorPicker(false);
                  }}
                  className="group relative aspect-square rounded-xl border border-black/5 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {item.color === color.value && (
                    <Check className="w-5 h-5" style={{ color: color.text }} />
                  )}
                </button>
              ))}
            </div>
            <div className="p-4 bg-[#fcfbf5] flex justify-between gap-3">
              <button
                onClick={async () => {
                  await updateItem('folder', item._id, { color: null });
                  setShowColorPicker(false);
                }}
                className="px-4 py-2 text-sm font-bold text-[#c94c4c] hover:bg-red-50 rounded-lg transition-colors"
              >
                Remove color
              </button>
              <button
                onClick={() => setShowColorPicker(false)}
                className="px-4 py-2 text-sm font-bold bg-[#e5e3d8] hover:bg-[#d8d6cc] rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#e5e3d8]">
              <h3 className="text-lg font-bold">Public Share Link</h3>
              <p className="text-sm text-[#7c8e88]">Anyone with this link can view the file.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                  Share URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareData?.url || ''}
                    className="flex-1 px-4 py-2 bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl text-sm outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareData?.url);
                      toast.success('Link copied to clipboard');
                    }}
                    className="px-4 py-2 bg-[#1f644e] text-white rounded-xl text-sm font-bold hover:bg-[#164a3a] transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="p-4 bg-[#f0f5f2] rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Expires on</p>
                  <p className="text-xs text-[#7c8e88]">
                    {new Date(shareData?.expiresAt).toLocaleDateString(undefined, {
                      dateStyle: 'long',
                    })}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (confirm('Are you sure you want to revoke this link?')) {
                      await revokeShare(item._id);
                      setShowShareModal(false);
                    }
                  }}
                  className="px-4 py-2 text-[#c94c4c] text-sm font-bold hover:bg-red-50 rounded-lg transition-colors"
                >
                  Revoke link
                </button>
              </div>
            </div>
            <div className="p-4 bg-[#fcfbf5] flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-6 py-2 bg-[#e5e3d8] hover:bg-[#d8d6cc] rounded-xl text-sm font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
