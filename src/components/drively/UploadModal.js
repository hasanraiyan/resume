'use client';

import { useState, useRef } from 'react';
import { useDrively } from '@/context/DrivelyContext';
import { X, Upload, FolderPlus, File, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function UploadModal({ onClose, currentFolderId }) {
  const { createNewFolder, refresh } = useDrively();
  const [mode, setMode] = useState('upload');
  const [folderName, setFolderName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileProgress, setFileProgress] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setSelectedFiles(droppedFiles);
      setFileProgress([]);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
    setFileProgress([]);
  };

  const uploadSingleFile = (file, fileIndex) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId) formData.append('folderId', currentFolderId);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setFileProgress((prev) =>
            prev.map((f, idx) => (idx === fileIndex ? { ...f, progress: percent } : f))
          );
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status === 200 && data.success) resolve(data);
          else reject(new Error(data.error || 'Upload failed'));
        } catch {
          reject(new Error('Invalid server response'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));

      xhr.open('POST', '/api/drively/upload');
      xhr.send(formData);
    });
  };

  const handleSubmit = async () => {
    if (isProcessing) return;

    if (mode === 'folder') {
      if (!folderName.trim()) return;
      setIsProcessing(true);
      const success = await createNewFolder(folderName.trim(), currentFolderId);
      setIsProcessing(false);
      if (success) onClose();
      return;
    }

    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setFileProgress(selectedFiles.map(() => ({ progress: 0, status: 'pending' })));

    let hasError = false;
    for (let i = 0; i < selectedFiles.length; i++) {
      setFileProgress((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f))
      );

      try {
        await uploadSingleFile(selectedFiles[i], i);
        setFileProgress((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: 100, status: 'done' } : f))
        );
      } catch (error) {
        setFileProgress((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'error' } : f))
        );
        toast.error(`Failed: ${selectedFiles[i].name}`);
        hasError = true;
      }
    }

    setIsProcessing(false);
    refresh();

    if (!hasError) {
      toast.success(`${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} uploaded`);
      setTimeout(onClose, 700);
    }
  };

  const isUploading = fileProgress.length > 0;
  const uploadedCount = fileProgress.filter((f) => f.status === 'done').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl border border-[#e5e3d8] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-[#e5e3d8] flex items-center justify-between bg-[#fcfbf5]">
          <div>
            <h2 className="font-bold text-[#1e3a34]">Add New</h2>
            {isUploading && mode === 'upload' && (
              <p className="text-xs text-[#7c8e88] mt-0.5">
                {uploadedCount} of {selectedFiles.length} uploaded
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 hover:bg-[#e5e3d8] rounded-full transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5 text-[#7c8e88]" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex bg-[#f0f5f2] p-1 rounded-xl mb-6">
            <button
              onClick={() => !isProcessing && setMode('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'upload' ? 'bg-white text-[#1f644e] shadow-sm' : 'text-[#7c8e88]'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
            <button
              onClick={() => !isProcessing && setMode('folder')}
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
              {!isUploading && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group ${
                    isDragging
                      ? 'border-[#1f644e] bg-[#f0f5f2]'
                      : 'border-[#e5e3d8] hover:border-[#1f644e] hover:bg-[#f0f5f2]'
                  }`}
                >
                  <div
                    className={`w-12 h-12 bg-[#fcfbf5] rounded-full flex items-center justify-center transition-colors ${
                      isDragging ? 'text-[#1f644e]' : 'text-[#7c8e88] group-hover:text-[#1f644e]'
                    }`}
                  >
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#1e3a34]">
                      {isDragging ? 'Drop files here' : 'Click or drag files here'}
                    </p>
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
              )}

              {selectedFiles.length > 0 && (
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {selectedFiles.map((file, idx) => {
                    const prog = fileProgress[idx];
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2.5 bg-[#fcfbf5] rounded-xl border border-[#e5e3d8]"
                      >
                        <File className="w-4 h-4 text-[#7c8e88] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium truncate block text-[#1e3a34]">
                            {file.name}
                          </span>
                          {prog && (
                            <div className="mt-1.5 h-1 bg-[#e5e3d8] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-200 ${
                                  prog.status === 'error' ? 'bg-red-400' : 'bg-[#1f644e]'
                                }`}
                                style={{ width: `${prog.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 w-8 flex justify-end">
                          {!prog && <Check className="w-4 h-4 text-[#c8d8d0]" />}
                          {prog?.status === 'pending' && (
                            <span className="text-[10px] text-[#b0bfba]">—</span>
                          )}
                          {prog?.status === 'uploading' && (
                            <span className="text-[10px] font-bold tabular-nums text-[#1f644e]">
                              {prog.progress}%
                            </span>
                          )}
                          {prog?.status === 'done' && <Check className="w-4 h-4 text-[#1f644e]" />}
                          {prog?.status === 'error' && (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
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
            disabled={isProcessing}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-[#e5e3d8] hover:bg-white disabled:opacity-40 transition-colors"
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
