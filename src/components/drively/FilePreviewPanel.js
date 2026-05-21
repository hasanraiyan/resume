'use client';

import {
  X,
  Download,
  File,
  Star,
  Trash2,
  Calendar,
  HardDrive,
  Type,
  Maximize2,
  Minimize2,
  Music,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDrively } from '@/context/DrivelyContext';
import { useState, useEffect, useRef } from 'react';

export default function FilePreviewPanel({ file, onClose }) {
  const { updateItem, deleteItem } = useDrively();
  const [textContent, setTextContent] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    setIsPlaying(false);
  }, [file]);

  useEffect(() => {
    const isText =
      file?.mimeType?.startsWith('text/') ||
      file?.mimeType === 'application/json' ||
      file?.mimeType === 'application/javascript';

    if (isText && file?.secureUrl) {
      fetch(file.secureUrl)
        .then((res) => res.text())
        .then((text) => setTextContent(text.slice(0, 50000))) // Cap at 50KB for preview
        .catch((err) => console.error('Failed to fetch text content', err));
    } else {
      setTextContent(null);
    }
  }, [file]);

  if (!file) return null;

  const isImage = file.mimeType.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';
  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    window.open(`/api/drively/download/${file._id}`, '_blank');
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
        <div className="aspect-video bg-[#f8f9fa] relative flex items-center justify-center border-b border-[#e5e3d8] overflow-hidden">
          {isImage ? (
            <div
              className="relative w-full h-full cursor-zoom-in"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <img
                src={file.secureUrl}
                alt={file.filename}
                className={`w-full h-full transition-all duration-300 ${isZoomed ? 'object-contain scale-150' : 'object-cover'}`}
              />
              <div className="absolute bottom-2 right-2 p-1 bg-black/40 rounded-lg text-white pointer-events-none">
                {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </div>
            </div>
          ) : isPdf ? (
            <iframe
              src={`${file.secureUrl}#toolbar=0`}
              className="w-full h-full border-none"
              title={file.filename}
            />
          ) : isVideo ? (
            <video src={file.secureUrl} controls className="w-full h-full bg-black" />
          ) : isAudio ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#0f1d19] text-[#e0e6e4] relative overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute w-32 h-32 rounded-full bg-[#1f644e]/30 blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

              {/* Spinning/pulsing audio hub */}
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-tr from-[#1f644e] to-[#2ecc71] flex items-center justify-center shadow-lg shadow-[#1f644e]/30 relative transition-transform duration-500 ${
                    isPlaying ? 'animate-spin [animation-duration:8s]' : ''
                  }`}
                >
                  {/* Outer vinyl grooves */}
                  <div className="absolute inset-1.5 rounded-full border border-white/10" />
                  <div className="absolute inset-3.5 rounded-full border border-white/5" />
                  <div className="w-5 h-5 rounded-full bg-[#0f1d19] flex items-center justify-center">
                    <Music className="w-2.5 h-2.5 text-[#2ecc71]" />
                  </div>
                </div>

                <div className="text-center max-w-[200px]">
                  <p className="text-[11px] font-bold truncate text-white" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-[9px] text-[#7c8e88] font-bold tracking-wider uppercase mt-0.5">
                    Audio Track
                  </p>
                </div>

                {/* Animated Simulated Visualizer Equalizer */}
                <div className="flex items-end justify-center gap-0.5 h-6 mt-1 w-24">
                  {[...Array(9)].map((_, i) => {
                    const delay = [0.1, 0.4, 0.2, 0.6, 0.3, 0.5, 0.1, 0.4, 0.2][i];
                    return (
                      <span
                        key={i}
                        className="w-0.5 bg-[#2ecc71] rounded-full transition-all"
                        style={{
                          height: isPlaying ? '100%' : '15%',
                          animation: isPlaying
                            ? `bounceVisualizer 1.2s ease-in-out infinite alternate`
                            : 'none',
                          animationDelay: `${delay}s`,
                        }}
                      />
                    );
                  })}
                </div>

                {/* HTML5 Standard Audio Player Styled beautifully */}
                <div className="w-full mt-2">
                  <audio
                    ref={audioRef}
                    src={file.secureUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    controls
                    className="w-56 h-7 bg-transparent"
                  />
                </div>
              </div>

              {/* Bounce visualizer animations embedded inside CSS */}
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                @keyframes bounceVisualizer {
                  0% { height: 15%; }
                  100% { height: 100%; }
                }
              `,
                }}
              />
            </div>
          ) : textContent !== null ? (
            <div className="w-full h-full p-4 overflow-auto bg-[#1e1e1e] text-[#d4d4d4] text-[10px] font-mono leading-relaxed whitespace-pre-wrap selection:bg-[#264f78]">
              {textContent}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <File className="w-20 h-20 text-[#7c8e88]" />
              <p className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider">
                No preview available
              </p>
            </div>
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
            <div
              className={`p-2 rounded-xl ${file.starred ? 'bg-[#1f644e] text-white' : 'bg-[#fcfbf5] text-[#7c8e88]'}`}
            >
              <Star className={`w-5 h-5 ${file.starred ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[10px] font-bold text-[#7c8e88]">
              {file.starred ? 'Starred' : 'Star'}
            </span>
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
              File Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Type className="w-4 h-4 text-[#7c8e88]" />
                <div>
                  <p className="text-[10px] text-[#7c8e88] font-bold uppercase leading-none mb-1">
                    Type
                  </p>
                  <p className="text-sm font-medium text-[#1e3a34]">{file.mimeType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 text-[#7c8e88]" />
                <div>
                  <p className="text-[10px] text-[#7c8e88] font-bold uppercase leading-none mb-1">
                    Size
                  </p>
                  <p className="text-sm font-medium text-[#1e3a34]">{formatSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#7c8e88]" />
                <div>
                  <p className="text-[10px] text-[#7c8e88] font-bold uppercase leading-none mb-1">
                    Modified
                  </p>
                  <p className="text-sm font-medium text-[#1e3a34]">
                    {formatDistanceToNow(new Date(file.updatedAt || file.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#7c8e88]" />
                <div>
                  <p className="text-[10px] text-[#7c8e88] font-bold uppercase leading-none mb-1">
                    Created
                  </p>
                  <p className="text-sm font-medium text-[#1e3a34]">
                    {new Date(file.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
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
