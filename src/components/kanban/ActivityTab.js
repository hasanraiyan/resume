'use client';

import { useState, useEffect } from 'react';
import { SkeletonWrapper } from 'react-skeletonify';
import {
  Activity,
  PlusCircle,
  ArrowRight,
  Edit3,
  Trash2,
  Columns,
  Copy,
  RefreshCw,
} from 'lucide-react';

const actionConfig = {
  card_created: { icon: PlusCircle, color: '#1f644e', label: 'Card created' },
  card_moved: { icon: ArrowRight, color: '#4a6fa5', label: 'Card moved' },
  card_updated: { icon: Edit3, color: '#c97b3a', label: 'Card updated' },
  card_deleted: { icon: Trash2, color: '#c94c4c', label: 'Card deleted' },
  column_created: { icon: Columns, color: '#1f644e', label: 'Column created' },
  column_deleted: { icon: Columns, color: '#c94c4c', label: 'Column deleted' },
  board_created: { icon: PlusCircle, color: '#1f644e', label: 'Board created' },
  board_duplicated: { icon: Copy, color: '#7b4f9c', label: 'Board duplicated' },
};

export default function ActivityTab({ boardId }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivity = async () => {
    if (!boardId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/kanban/boards/${boardId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [boardId]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-3 max-w-3xl mx-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonWrapper loading>
              <div className="w-8 h-8 rounded-full" />
            </SkeletonWrapper>
            <div className="flex-1 space-y-1.5">
              <SkeletonWrapper loading>
                <div className="h-4 w-48" />
              </SkeletonWrapper>
              <SkeletonWrapper loading>
                <div className="h-3 w-32" />
              </SkeletonWrapper>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1e3a34]">Activity Log</h2>
          <p className="text-sm text-[#7c8e88] mt-1">
            {activities.length} {activities.length === 1 ? 'event' : 'events'}
          </p>
        </div>
        <button
          onClick={fetchActivity}
          className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[#e5e3d8] rounded-xl bg-gradient-to-b from-[#fcfbf5] to-white">
          <div className="inline-flex p-3 bg-[#1f644e]/5 rounded-full mb-4">
            <Activity className="w-10 h-10 text-[#1f644e]" />
          </div>
          <p className="text-[#1e3a34] font-bold text-lg mb-1">No activity yet</p>
          <p className="text-[#7c8e88] text-sm">Activity will appear as you use the board</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-[#e5e3d8]" />
          <div className="space-y-0">
            {activities.map((act) => {
              const config = actionConfig[act.action] || {
                icon: Activity,
                color: '#7c8e88',
                label: act.action,
              };
              const Icon = config.icon;
              return (
                <div key={act._id} className="flex items-start gap-3 pb-4 relative">
                  <div
                    className="relative z-10 flex-shrink-0 w-[34px] h-[34px] rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${config.color}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm font-bold text-[#1e3a34]">{config.label}</p>
                    {act.details && <p className="text-xs text-[#7c8e88] mt-0.5">{act.details}</p>}
                    <p className="text-[10px] text-[#a0b2ac] mt-1 font-semibold">
                      {new Date(act.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
