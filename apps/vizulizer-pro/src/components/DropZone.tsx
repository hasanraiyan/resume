import React, { useCallback } from 'react';
import { UploadCloud, Music } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect }) => {
  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-8">
      <div
        className="w-full max-w-2xl border-2 border-dashed border-gray-700 hover:border-purple-500 rounded-2xl bg-white/5 flex flex-col items-center justify-center p-16 transition-colors cursor-pointer group"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <UploadCloud size={40} className="text-purple-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Drop your media here</h2>
        <p className="text-gray-400 mb-8 text-center max-w-md">
          Upload an audio or video file to start visualizing. We support all standard formats (MP3, WAV, MP4, etc).
        </p>

        <div className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-full hover:bg-white/20 transition-colors">
          <Music size={18} />
          <span className="font-medium">Browse Files</span>
        </div>
        <input
          id="file-upload"
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={onFileInputChange}
        />
      </div>

      <div className="mt-12 text-center text-sm text-gray-500 max-w-lg">
        <p><strong>Privacy Promise:</strong> Processing happens entirely in your browser. Your media never leaves this device.</p>
      </div>
    </div>
  );
};
