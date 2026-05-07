'use client';

import { useDrively } from '@/context/DrivelyContext';
import {
  Upload,
  Trash2,
  RotateCcw,
  Edit2,
  Move,
  Star,
  Trash,
  File,
  Folder,
  Layers,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const actionIcons = {
  upload: <Upload className="w-3.5 h-3.5" />,
  delete: <Trash2 className="w-3.5 h-3.5" />,
  restore: <RotateCcw className="w-3.5 h-3.5" />,
  rename: <Edit2 className="w-3.5 h-3.5" />,
  move: <Move className="w-3.5 h-3.5" />,
  star: <Star className="w-3.5 h-3.5" />,
  empty_trash: <Trash className="w-3.5 h-3.5" />,
};

const typeIcons = {
  file: <File className="w-3 h-3" />,
  folder: <Folder className="w-3 h-3" />,
  bulk: <Layers className="w-3 h-3" />,
};

export default function ActivityFeed({ activity }) {
  if (!activity || activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-xs font-bold text-[#7c8e88] uppercase tracking-widest">
          No activity yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
        Recent Activity
      </h3>
      <div className="space-y-3">
        {activity.map((item) => (
          <div
            key={item._id}
            className="flex gap-3 p-3 bg-white border border-[#e5e3d8] rounded-2xl hover:border-[#1f644e]/30 transition-colors"
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                item.action === 'delete'
                  ? 'bg-red-50 text-red-500'
                  : item.action === 'restore'
                    ? 'bg-blue-50 text-blue-500'
                    : item.action === 'upload'
                      ? 'bg-emerald-50 text-emerald-500'
                      : 'bg-[#f0f5f2] text-[#1f644e]'
              }`}
            >
              {actionIcons[item.action]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-tight text-[#7c8e88]">
                  {item.action.replace('_', ' ')}
                </span>
                <span className="text-[8px] text-[#e5e3d8]">•</span>
                <div className="flex items-center gap-1 text-[10px] text-[#7c8e88]">
                  {typeIcons[item.itemType]}
                  <span className="font-medium">{item.itemType}</span>
                </div>
              </div>
              <p className="text-sm font-bold text-[#1e3a34] truncate mb-0.5">{item.itemName}</p>
              <p className="text-[10px] text-[#7c8e88] font-medium">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
