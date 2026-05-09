'use client';

import { useDrively } from '@/context/DrivelyContext';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import {
  Trash2,
  FolderInput,
  File,
  Image as ImageIcon,
  Video,
  FileText,
  FileArchive,
} from 'lucide-react';
import { useState } from 'react';
import MoveModal from './MoveModal';
import { formatSize, getFileIcon } from './utils';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

export default function StorageDashboard() {
  const { stats, deleteItem, updateItem } = useDrively();
  const [moveTarget, setMoveTarget] = useState(null);

  if (!stats) return null;

  const chartData = {
    labels: stats.typeBreakdown.map((t) => t._id),
    datasets: [
      {
        data: stats.typeBreakdown.map((t) => t.size),
        backgroundColor: [
          '#1f644e',
          '#10b981',
          '#3b82f6',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#ec4899',
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 11,
            weight: 'bold',
          },
        },
      },
    },
    cutout: '70%',
    maintainAspectRatio: false,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Chart Section */}
      <div className="lg:col-span-1 bg-white border border-[#e5e3d8] rounded-3xl p-6 flex flex-col min-h-[400px]">
        <h3 className="text-sm font-bold text-[#1e3a34] mb-6">Storage Distribution</h3>
        <div className="flex-1 relative flex items-center justify-center">
          <div className="w-full h-full">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
            <p className="text-2xl font-bold text-[#1e3a34]">{formatSize(stats.totalSize)}</p>
            <p className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest">Used</p>
          </div>
        </div>
      </div>

      {/* Top Space Consumers */}
      <div className="lg:col-span-2 bg-white border border-[#e5e3d8] rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-[#1e3a34]">Top Space Consumers</h3>
          <span className="text-[10px] font-bold text-[#7c8e88] uppercase bg-[#fcfbf5] px-2 py-1 rounded-md border border-[#e5e3d8]">
            Largest 10 Files
          </span>
        </div>

        <div className="space-y-2">
          {stats.largestFiles.map((file) => (
            <div
              key={file._id}
              className="group flex items-center justify-between p-3 rounded-2xl hover:bg-[#f0f5f2] transition-all border border-transparent hover:border-[#e5e3d8]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#fcfbf5] border border-[#e5e3d8] flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
                  {file.mimeType.startsWith('image/') && file.secureUrl ? (
                    <img src={file.secureUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getFileIcon(file.mimeType)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1e3a34] truncate">{file.filename}</p>
                  <p className="text-[10px] text-[#7c8e88] font-medium">{formatSize(file.size)}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setMoveTarget(file)}
                  className="p-2 hover:bg-white rounded-lg text-[#7c8e88] hover:text-[#1f644e] transition-colors"
                  title="Move"
                >
                  <FolderInput className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${file.filename}?`)) {
                      deleteItem('file', file._id);
                    }
                  }}
                  className="p-2 hover:bg-white rounded-lg text-[#7c8e88] hover:text-[#c94c4c] transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {stats.largestFiles.length === 0 && (
            <div className="py-12 text-center text-[#7c8e88] text-sm italic">
              No files uploaded yet.
            </div>
          )}
        </div>
      </div>

      {moveTarget && (
        <MoveModal
          onConfirm={async (folderId) => {
            await updateItem('file', moveTarget._id, { folderId });
            setMoveTarget(null);
          }}
          onClose={() => setMoveTarget(null)}
        />
      )}
    </div>
  );
}
