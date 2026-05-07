'use client';

import { X, Download, File, Star, Trash2, Calendar, HardDrive, Type } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDrively } from '@/context/DrivelyContext';

export default function FilePreviewPanel({ file, onClose }) {
  const { updateItem, deleteItem } = useDrively();

  if (!file) return null;

  const isImage = file.mimeType.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (file.mimeType.startsWith('image/')) {
      window.open(file.secureUrl, '_blank');
    } else {
      window.open(`/api/drively/download/${file._id}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[400px] z-[50] flex flex-col bg-white shadow-2xl border-l border-[#e5e3d8] animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-[#e5e3d8] flex items-center justify-between bg-[#fcfbf5]">
        <h2 className="font-bold text-[#1e3a34] truncate pr-4">{file.filename}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#e5e3d8] rounded-full transition-colors shrink-0"
        >
          <X className="w-5 h-5 text-[#7c8e88]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Preview Area */}
        <div className="aspect-video bg-[#f8f9fa] flex items-center justify-center border-b border-[#e5e3d8]">
          {isImage ? (
            <img src={file.secureUrl} alt={file.filename} className="max-w-full max-h-full object-contain" />
          ) : (
            <File className="w-20 h-20 text-[#7c8e88]" />
          )}
        </div>

        {/* Actions */}
        <div className="p-6 grid grid-cols-3 gap-3 border-b border-[#e5e3d8]">
          <button
            onClick={handleDownload}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-[#f0f5f2] transition-colors"
          >
            <div className="p-2 bg-[#f0f5f2] rounded-xl text-[#1f644e]">
              <Download className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-[#7c8e88]">Download</span>
          </button>
          <button
            onClick={() => updateItem('file', file._id, { starred: !file.starred })}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-[#fcfbf5] transition-colors"
          >
            <div className={`p-2 rounded-xl ${file.starred ? 'bg-[#1f644e] text-white' : 'bg-[#fcfbf5] text-[#7c8e88]'}`}>
              <Star className={`w-5 h-5 ${file.starred ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[10px] font-bold text-[#7c8e88]">{file.starred ? 'Starred' : 'Star'}</span>
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this file?')) {
                deleteItem('file', file._id);
                onClose();
              }
            }}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-red-50 transition-colors"
          >
            <div className="p-2 bg-red-50 rounded-xl text-red-500">
              <Trash2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-[#7c8e88]">Delete</span>
          </button>
        </div>

        {/* Metadata */}
        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">File Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Type className="w-4 h-4 text-[#7c8e88]" />
                <div>
                  <p className="text-[10px] text-[#7c8e88] font-bold uppercase leading-none mb-1">Type</p>
                  <p className="text-sm font-medium text-[#1e3a34]">{file.mimeType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 text-[#7c8e88]" />
                <div>
                  <p className="text-[10px] text-[#7c8e88] font-bold uppercase leading-none mb-1">Size</p>
                  <p className="text-sm font-medium text-[#1e3a34]">{formatSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#7c8e88]" />
                <div>
                  <p className="text-[10px] text-[#7c8e88] font-bold uppercase leading-none mb-1">Modified</p>
                  <p className="text-sm font-medium text-[#1e3a34]">
                    {formatDistanceToNow(new Date(file.updatedAt || file.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#7c8e88]" />
                <div>
                  <p className="text-[10px] text-[#7c8e88] font-bold uppercase leading-none mb-1">Created</p>
                  <p className="text-sm font-medium text-[#1e3a34]">
                    {new Date(file.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
