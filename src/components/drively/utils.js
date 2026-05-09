import {
  File,
  Image as ImageIcon,
  Video,
  FileText,
  FileArchive,
  FileCode,
} from 'lucide-react';
import React from 'react';

export const getFileIcon = (mimeType) => {
  if (mimeType === 'Images' || mimeType.startsWith('image/'))
    return <ImageIcon className="w-full h-full text-emerald-500" />;
  if (mimeType === 'Videos' || mimeType.startsWith('video/'))
    return <Video className="w-full h-full text-purple-500" />;
  if (mimeType === 'Documents' || mimeType === 'application/pdf' || mimeType.startsWith('text/'))
    return <FileText className="w-full h-full text-red-500" />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar'))
    return <FileArchive className="w-full h-full text-amber-500" />;
  if (
    mimeType.includes('javascript') ||
    mimeType.includes('json') ||
    mimeType.includes('html') ||
    mimeType.includes('css')
  )
    return <FileCode className="w-full h-full text-blue-500" />;
  return <File className="w-full h-full text-[#7c8e88]" />;
};

export const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
