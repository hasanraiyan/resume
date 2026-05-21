'use client';

import { useDrively } from '@/context/DrivelyContext';
import {
  File,
  FileText,
  Image as ImageIcon,
  FileCode,
  FileArchive,
  Download,
  Star,
  Link as LinkIcon,
  Music,
} from 'lucide-react';
import ActionMenu from './ActionMenu';
import { formatDistanceToNow } from 'date-fns';

const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-full h-full" />;
  if (mimeType.startsWith('audio/')) return <Music className="w-full h-full text-emerald-600" />;
  if (mimeType === 'application/pdf') return <FileText className="w-full h-full text-red-500" />;
  if (mimeType.includes('zip') || mimeType.includes('tar'))
    return <FileArchive className="w-full h-full text-amber-500" />;
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html'))
    return <FileCode className="w-full h-full text-blue-500" />;
  return <File className="w-full h-full text-[#7c8e88]" />;
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function FileCard({ file, viewMode }) {
  const { updateItem, selectedItems, toggleSelection, setPreviewFile, shares } = useDrively();

  const isSelected = selectedItems.files.includes(file._id);
  const hasShare = !!shares[file._id];

  const handleToggleStar = (e) => {
    e.stopPropagation();
    updateItem('file', file._id, { starred: !file.starred });
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    window.open(`/api/drively/download/${file._id}`, '_blank');
  };

  const isImage = file.mimeType.startsWith('image/') && file.secureUrl;

  // Optimize Cloudinary thumbnails
  const thumbnailUrl = isImage
    ? file.secureUrl.replace('/upload/', '/upload/w_400,c_fill,q_auto,f_auto/')
    : null;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('drivelyItem', JSON.stringify({ type: 'file', id: file._id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  if (viewMode === 'list') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onClick={() => setPreviewFile(file)}
        className={`group flex items-center justify-between p-3 border rounded-xl transition-colors cursor-pointer ${isSelected ? 'bg-[#f0f5f2] border-[#1f644e]' : 'bg-white border-[#e5e3d8] hover:border-[#1f644e]'}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection('file', file._id)}
            className="w-4 h-4 rounded border-[#e5e3d8] text-[#1f644e] focus:ring-[#1f644e] cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="w-8 h-8 flex-shrink-0">{getFileIcon(file.mimeType)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">{file.filename}</p>
            <p className="text-[10px] text-[#7c8e88]">
              {formatSize(file.size)} •{' '}
              {formatDistanceToNow(new Date(file.updatedAt || file.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-1 hover:bg-[#fcfbf5] rounded text-[#7c8e88] hover:text-[#1f644e]"
          >
            <Download className="w-4 h-4" />
          </button>
          <button onClick={handleToggleStar} className="p-1 hover:bg-[#fcfbf5] rounded">
            <Star
              className={`w-4 h-4 ${file.starred ? 'text-[#1f644e] fill-[#1f644e]' : 'text-[#7c8e88]'}`}
            />
          </button>
          {hasShare && (
            <div className="p-1" title="Shared publicly">
              <LinkIcon className="w-4 h-4 text-[#1f644e]" />
            </div>
          )}
          <ActionMenu type="file" item={file} />
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => setPreviewFile(file)}
      className={`group border rounded-2xl overflow-hidden transition-all hover:shadow-sm relative cursor-pointer ${isSelected ? 'bg-[#f0f5f2] border-[#1f644e]' : 'bg-white border-[#e5e3d8] hover:border-[#1f644e]'}`}
    >
      {/* Mobile: compact horizontal row */}
      <div className="flex items-center gap-3 p-3 sm:hidden">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelection('file', file._id)}
          className="w-4 h-4 rounded border-[#e5e3d8] text-[#1f644e] focus:ring-[#1f644e] cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
        <div
          className={`w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden ${
            isImage ? '' : 'bg-[#f8f9fa] flex items-center justify-center'
          }`}
        >
          {isImage ? (
            <img src={thumbnailUrl} alt={file.filename} className="w-full h-full object-cover" />
          ) : (
            <div className="w-7 h-7 text-[#7c8e88]">{getFileIcon(file.mimeType)}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold truncate leading-tight">{file.filename}</h3>
          <p className="text-[10px] text-[#7c8e88] font-medium">
            {formatSize(file.size)} •{' '}
            {formatDistanceToNow(new Date(file.updatedAt || file.createdAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-[#f0f5f2] rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#7c8e88]" />
          </button>
          <ActionMenu type="file" item={file} />
        </div>
      </div>

      {/* Desktop (sm+): vertical card with full-bleed thumbnail */}
      <div className="hidden sm:block">
        <div
          className={`absolute top-3 left-3 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection('file', file._id)}
            className="w-4 h-4 rounded border-[#e5e3d8] text-[#1f644e] focus:ring-[#1f644e] cursor-pointer shadow-sm bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div
          className={`aspect-square relative overflow-hidden ${
            isImage
              ? ''
              : 'bg-[#f8f9fa] flex items-center justify-center p-6 group-hover:bg-[#f0f5f2] transition-colors'
          }`}
        >
          {isImage ? (
            <img
              src={thumbnailUrl}
              alt={file.filename}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-12 h-12 text-[#7c8e88] group-hover:text-[#1f644e] transition-colors">
              {getFileIcon(file.mimeType)}
            </div>
          )}
          {file.starred && !file.deletedAt && (
            <Star className="absolute top-3 right-3 w-4 h-4 text-[#1f644e] fill-[#1f644e] drop-shadow-sm" />
          )}
          {hasShare && (
            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-black/5">
              <LinkIcon className="w-3 h-3 text-[#1f644e]" />
            </div>
          )}
        </div>
        <div className="p-3 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold truncate leading-tight mb-0.5" title={file.filename}>
              {file.filename}
            </h3>
            <p className="text-[10px] text-[#7c8e88] font-medium">
              {formatSize(file.size)} •{' '}
              {formatDistanceToNow(new Date(file.updatedAt || file.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleDownload}
              className="p-1.5 hover:bg-[#f0f5f2] rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#7c8e88] hover:text-[#1f644e]" />
            </button>
            <ActionMenu type="file" item={file} />
          </div>
        </div>
      </div>
    </div>
  );
}
