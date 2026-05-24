'use client';

import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, RotateCcw, AlertTriangle, Archive } from 'lucide-react';
import { SkeletonWrapper } from 'react-skeletonify';

export default function TrashTab({ onRestore }) {
  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchTrash = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/kanban/boards/trash');
      if (res.ok) {
        const data = await res.json();
        setBoards(data.boards || []);
      }
    } catch (error) {
      console.error('Failed to fetch trash:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestoreBoard = async (id) => {
    setIsRestoring(true);
    try {
      const res = await fetch(`/api/kanban/boards/${id}/restore`, { method: 'PUT' });
      if (res.ok) {
        setBoards((prev) => prev.filter((b) => b._id !== id));
        onRestore();
      }
    } catch (error) {
      console.error('Failed to restore board:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!confirm('Permanently delete this board and all its data? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/kanban/boards/${id}/hard-delete`, { method: 'DELETE' });
      if (res.ok) {
        setBoards((prev) => prev.filter((b) => b._id !== id));
      }
    } catch (error) {
      console.error('Failed to permanently delete board:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-3 max-w-5xl mx-auto">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-[#e5e3d8] p-4 flex items-center gap-3"
          >
            <SkeletonWrapper loading>
              <div className="w-10 h-10 rounded-lg" />
            </SkeletonWrapper>
            <div className="flex-1 space-y-2">
              <SkeletonWrapper loading>
                <div className="h-4 w-48" />
              </SkeletonWrapper>
              <SkeletonWrapper loading>
                <div className="h-3 w-64" />
              </SkeletonWrapper>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1e3a34]">Trash</h2>
          <p className="text-sm text-[#7c8e88] mt-1">
            {boards.length} deleted board{boards.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchTrash}
          className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[#e5e3d8] rounded-xl bg-gradient-to-b from-[#fcfbf5] to-white">
          <div className="inline-flex p-3 bg-[#1f644e]/5 rounded-full mb-4">
            <Archive className="w-10 h-10 text-[#1f644e]" />
          </div>
          <p className="text-[#1e3a34] font-bold text-lg mb-1">Trash is empty</p>
          <p className="text-[#7c8e88] text-sm">Deleted boards will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {boards.map((board) => (
            <div
              key={board._id}
              className="bg-white rounded-xl border border-[#e5e3d8] p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-[#fce8e8] rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-[#c94c4c]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#1e3a34]">{board.name}</h3>
                  <p className="text-xs text-[#7c8e88]">
                    Deleted {new Date(board.deletedAt).toLocaleDateString()} ·{' '}
                    {board.description || 'No description'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <button
                  onClick={() => handleRestoreBoard(board._id)}
                  disabled={isRestoring}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f5f2] text-[#1f644e] text-xs font-bold rounded-lg hover:bg-[#e2ede7] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore
                </button>
                <button
                  onClick={() => handlePermanentDelete(board._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-[#c94c4c] text-xs font-bold rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
