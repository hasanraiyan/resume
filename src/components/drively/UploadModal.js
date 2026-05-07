'use client';

import { useState, useRef } from 'react';
import { useDrively } from '@/context/DrivelyContext';
import { X, Upload, FolderPlus, File, Check, Loader2 } from 'lucide-react';

export default function UploadModal({ onClose, currentFolderId }) {
  const { uploadFiles, createNewFolder } = useDrively();
  const [mode, setMode] = useState('upload'); // 'upload' or 'folder'
  const [folderName, setFolderName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmit = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (mode === 'upload') {
        if (selectedFiles.length === 0) return;
        const success = await uploadFiles(selectedFiles, currentFolderId);
        if (success) onClose();
      } else {
        if (!folderName.trim()) return;
        const success = await createNewFolder(folderName.trim(), currentFolderId);
        if (success) onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl border border-[#e5e3d8] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-[#e5e3d8] flex items-center justify-between bg-[#fcfbf5]">
          <h2 className="font-bold text-[#1e3a34]">Add New</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#e5e3d8] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#7c8e88]" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex bg-[#f0f5f2] p-1 rounded-xl mb-6">
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'upload' ? 'bg-white text-[#1f644e] shadow-sm' : 'text-[#7c8e88]'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
            <button
              onClick={() => setMode('folder')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'folder' ? 'bg-white text-[#1f644e] shadow-sm' : 'text-[#7c8e88]'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
          </div>

          {mode === 'upload' ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#e5e3d8] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#1f644e] hover:bg-[#f0f5f2] transition-all group"
              >
                <div className="w-12 h-12 bg-[#fcfbf5] rounded-full flex items-center justify-center text-[#7c8e88] group-hover:text-[#1f644e] transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[#1e3a34]">Click to upload</p>
                  <p className="text-xs text-[#7c8e88] mt-1">Maximum file size 50MB</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 bg-[#fcfbf5] rounded-lg border border-[#e5e3d8]"
                    >
                      <File className="w-4 h-4 text-[#7c8e88]" />
                      <span className="text-xs font-medium truncate flex-1">{file.name}</span>
                      <Check className="w-4 h-4 text-[#1f644e]" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                Folder Name
              </label>
              <input
                type="text"
                autoFocus
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name..."
                className="w-full px-4 py-3 rounded-xl border border-[#e5e3d8] outline-none focus:border-[#1f644e] text-sm"
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-[#fcfbf5] border-t border-[#e5e3d8] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-[#e5e3d8] hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isProcessing || (mode === 'upload' ? selectedFiles.length === 0 : !folderName.trim())
            }
            className="flex-1 py-2.5 bg-[#1f644e] text-white rounded-xl text-sm font-bold hover:bg-[#17503e] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'upload' ? (
              'Upload'
            ) : (
              'Create'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
