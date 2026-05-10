'use client';

import { useDrively } from '@/context/DrivelyContext';
import {
  HardDrive,
  File,
  Image as ImageIcon,
  Video,
  FileText,
  AlertCircle,
  Folder,
  FileArchive,
  Settings,
  Trash2,
} from 'lucide-react';
import { useMemo } from 'react';
import StorageDashboard from './StorageDashboard';
import Switch from '../admin/Switch';
import { formatSize, getFileIcon } from './utils';

export default function StorageTab() {
  const { stats, isLoading, files, folders, settings, updateSettings } = useDrively();

  const folderStats = useMemo(() => {
    if (!files || !folders) return [];

    const statsMap = {};
    files.forEach((file) => {
      const fid = file.folderId || 'root';
      statsMap[fid] = (statsMap[fid] || 0) + file.size;
    });

    return Object.entries(statsMap)
      .map(([id, size]) => {
        const folder = id === 'root' ? { name: 'Root' } : folders.find((f) => f._id === id);
        return {
          id,
          name: folder?.name || 'Unknown',
          size,
        };
      })
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);
  }, [files, folders]);

  if (isLoading || !stats) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-[#e5e3d8] rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-[#e5e3d8] rounded-3xl" />
          <div className="h-64 bg-[#e5e3d8] rounded-3xl" />
        </div>
      </div>
    );
  }

  const totalUsed = stats.totalSize;
  const limitMB = parseInt(process.env.NEXT_PUBLIC_DRIVELY_QUOTA_MB) || 1000;
  const limit = limitMB * 1024 * 1024;
  const percentage = Math.min((totalUsed / limit) * 100, 100);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-[#1e3a34]">Storage Analytics</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-[#e5e3d8] px-4 py-2 rounded-2xl shadow-sm">
            <Settings className="w-4 h-4 text-[#7c8e88]" />
            <span className="text-xs font-bold text-[#1e3a34]">Auto-Empty Trash</span>
            <Switch
              checked={settings?.autoEmptyTrash ?? true}
              onCheckedChange={(checked) => updateSettings({ autoEmptyTrash: checked })}
            />
          </div>
        </div>
      </div>

      {percentage > 80 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            You are using {percentage.toFixed(1)}% of your storage. Consider deleting old files.
          </p>
        </div>
      )}

      {/* Dashboard Section */}
      <StorageDashboard />

      {/* Overview Card */}
      <div className="bg-white border border-[#e5e3d8] rounded-3xl p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-bold text-[#1e3a34]">{formatSize(totalUsed)}</h2>
              <p className="text-[#7c8e88] font-medium mt-1">Total storage used</p>
            </div>
            <div className="w-full md:w-64">
              <div className="h-2 w-full bg-[#f0f5f2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1f644e] rounded-full transition-all duration-1000"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-[10px] text-[#7c8e88] font-bold mt-2 uppercase tracking-wider">
                {percentage.toFixed(1)}% of {limitMB} MB used
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 max-w-md">
            <div className="bg-[#fcfbf5] p-4 rounded-2xl border border-[#e5e3d8]">
              <p className="text-[10px] font-bold text-[#7c8e88] uppercase mb-1">Files</p>
              <p className="text-xl font-bold text-[#1e3a34]">{stats.fileCount}</p>
            </div>
            <div className="bg-[#fcfbf5] p-4 rounded-2xl border border-[#e5e3d8]">
              <p className="text-[10px] font-bold text-[#7c8e88] uppercase mb-1">Average Size</p>
              <p className="text-xl font-bold text-[#1e3a34]">
                {stats.fileCount > 0 ? formatSize(totalUsed / stats.fileCount) : '0 B'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Type Breakdown */}
        <section>
          <h3 className="text-sm font-bold text-[#1e3a34] mb-4">File Type Breakdown</h3>
          <div className="bg-white border border-[#e5e3d8] rounded-3xl overflow-hidden">
            <div className="divide-y divide-[#e5e3d8]">
              {stats.typeBreakdown.map((type) => (
                <div
                  key={type._id}
                  className="p-4 flex items-center justify-between hover:bg-[#f0f5f2] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#fcfbf5] border border-[#e5e3d8] flex items-center justify-center p-2">
                      {getFileIcon(type._id)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1e3a34]">
                        {type._id.includes('/') ? type._id.split('/')[1].toUpperCase() : type._id}
                      </p>
                      <p className="text-[10px] text-[#7c8e88]">{type.count} files</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#1e3a34]">{formatSize(type.size)}</p>
                </div>
              ))}
              {stats.typeBreakdown.length === 0 && (
                <div className="p-8 text-center text-[#7c8e88] text-sm">No files uploaded yet</div>
              )}
            </div>
          </div>
        </section>

        {/* Largest Files */}
        <section>
          <h3 className="text-sm font-bold text-[#1e3a34] mb-4">Largest Files</h3>
          <div className="bg-white border border-[#e5e3d8] rounded-3xl overflow-hidden">
            <div className="divide-y divide-[#e5e3d8]">
              {stats.largestFiles.map((file) => (
                <div
                  key={file._id}
                  className="p-4 flex items-center justify-between hover:bg-[#f0f5f2] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#fcfbf5] border border-[#e5e3d8] flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
                      {file.mimeType.startsWith('image/') && file.secureUrl ? (
                        <img src={file.secureUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getFileIcon(file.mimeType)
                      )}
                    </div>
                    <p className="text-sm font-bold text-[#1e3a34] truncate">{file.filename}</p>
                  </div>
                  <p className="text-sm font-bold text-[#1e3a34] ml-4 flex-shrink-0">
                    {formatSize(file.size)}
                  </p>
                </div>
              ))}
              {stats.largestFiles.length === 0 && (
                <div className="p-8 text-center text-[#7c8e88] text-sm">No files uploaded yet</div>
              )}
            </div>
          </div>
        </section>
      </div>

      <section>
        <h3 className="text-sm font-bold text-[#1e3a34] mb-4">Storage by Folder</h3>
        <div className="bg-white border border-[#e5e3d8] rounded-3xl p-6">
          <div className="space-y-6">
            {folderStats.map((item) => {
              const fPercentage = (item.size / totalUsed) * 100;
              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-[#1f644e]" />
                      <span>{item.name}</span>
                    </div>
                    <span>{formatSize(item.size)}</span>
                  </div>
                  <div className="h-2 w-full bg-[#f0f5f2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1f644e] rounded-full transition-all duration-1000"
                      style={{ width: `${fPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {folderStats.length === 0 && (
              <div className="p-8 text-center text-[#7c8e88] text-sm">
                No storage data available
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
