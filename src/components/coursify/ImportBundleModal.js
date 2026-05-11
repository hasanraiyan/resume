'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileJson, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportBundleModal({ courseId, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid JSON bundle file.');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('uploading');

    try {
      const content = await file.text();
      const bundle = JSON.parse(content);

      // If courseId is provided via props, ensure it's in the bundle or vice versa
      if (courseId) {
        bundle.courseId = courseId;
      }

      const res = await fetch('/api/coursify/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bundle),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('success');
        toast.success('Course imported successfully');
        setTimeout(() => {
          onSuccess?.(data.courseId);
          onClose();
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to import course');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-[#1f644e] rounded-lg flex items-center justify-center">
                <Upload className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-[#1e3a34] text-lg">
                {courseId ? 'Import Course Bundle' : 'Import New Course'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#f0f5f2] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-[#7c8e88]" />
            </button>
          </div>

          <div className="space-y-4">
            {status === 'idle' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#e5e3d8] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-[#1f644e] hover:bg-[#f0f5f2]/30 transition-all cursor-pointer group"
              >
                <div className="h-12 w-12 bg-[#f0f5f2] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileJson className="w-6 h-6 text-[#1f644e]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-[#1e3a34]">
                    {file ? file.name : 'Select course-bundle.json'}
                  </p>
                  <p className="text-xs text-[#7c8e88] mt-1">Click to browse or drag and drop</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {status === 'uploading' && (
              <div className="py-12 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-[#1f644e] animate-spin" />
                <p className="text-sm font-bold text-[#1e3a34]">Importing course content...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="py-12 flex flex-col items-center justify-center gap-4">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-[#1e3a34]">Import Complete!</p>
              </div>
            )}

            {status === 'error' && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <div className="text-xs text-red-700 font-medium leading-relaxed">{error}</div>
              </div>
            )}

            {status === 'error' && (
              <button
                onClick={() => setStatus('idle')}
                className="w-full py-2.5 rounded-xl border border-[#e5e3d8] text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] transition-colors"
              >
                Try Again
              </button>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#e5e3d8] text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] transition-colors"
              >
                Cancel
              </button>
              {status === 'idle' && (
                <button
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="flex-1 py-2.5 rounded-xl bg-[#1f644e] text-white text-sm font-bold hover:bg-[#17503e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import Bundle
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
