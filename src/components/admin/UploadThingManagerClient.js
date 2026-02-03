'use client';

// src/components/admin/UploadThingManagerClient.js
import { useCallback, useEffect, useMemo, useState } from 'react';
import { UploadButton } from '@uploadthing/react';
import { Button } from '@/components/ui';

const PAGE_SIZE = 12;

/**
 * Format byte counts into human-readable strings.
 *
 * @param {number} bytes - The number of bytes to format.
 * @returns {string} Formatted string (e.g., "4.2 MB").
 */
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

/**
 * UploadThing storage manager client for admin usage.
 *
 * @param {Object} props - Component props.
 * @param {string} props.searchTerm - Search term for filtering files.
 * @returns {JSX.Element} The UploadThing storage manager interface.
 */
export default function UploadThingManagerClient({ searchTerm }) {
  const [files, setFiles] = useState([]);
  const [usage, setUsage] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const offset = (page - 1) * PAGE_SIZE;
      const response = await fetch(`/api/uploadthing/list?limit=${PAGE_SIZE}&offset=${offset}`);

      if (!response.ok) {
        throw new Error('Failed to load UploadThing assets.');
      }

      const data = await response.json();
      setFiles(data.files || []);
      setHasMore(Boolean(data.hasMore));
      setUsage(data.usage || null);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to load storage data.');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm) {
      return files;
    }

    const normalized = searchTerm.toLowerCase();
    return files.filter((file) => {
      return (
        file.name?.toLowerCase().includes(normalized) ||
        file.key?.toLowerCase().includes(normalized) ||
        file.status?.toLowerCase().includes(normalized)
      );
    });
  }, [files, searchTerm]);

  const handleDelete = async (fileKey) => {
    setActionMessage('');

    try {
      const response = await fetch('/api/uploadthing/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete file.');
      }

      setActionMessage('File deleted successfully.');
      await fetchFiles();
    } catch (error) {
      setErrorMessage(error.message || 'Unable to delete file.');
    }
  };

  const handleCopy = async (value, label) => {
    setActionMessage('');

    try {
      await navigator.clipboard.writeText(value);
      setActionMessage(`${label} copied to clipboard.`);
    } catch (error) {
      setErrorMessage('Failed to copy to clipboard.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Total Usage</p>
          <p className="text-2xl font-semibold text-neutral-900">
            {usage ? formatBytes(usage.totalBytes) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-500">App Usage</p>
          <p className="text-2xl font-semibold text-neutral-900">
            {usage ? formatBytes(usage.appTotalBytes) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Files Uploaded</p>
          <p className="text-2xl font-semibold text-neutral-900">{usage?.filesUploaded ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-500">Storage Limit</p>
          <p className="text-2xl font-semibold text-neutral-900">
            {usage ? formatBytes(usage.limitBytes) : '—'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Upload new files</h2>
            <p className="text-sm text-neutral-500">
              Upload images, videos, or PDFs directly to UploadThing.
            </p>
          </div>
          <UploadButton
            endpoint="mediaUploader"
            onClientUploadComplete={() => {
              setActionMessage('Upload complete. Refreshing files...');
              fetchFiles();
            }}
            onUploadError={(error) => {
              setErrorMessage(error.message || 'Upload failed.');
            }}
            appearance={{
              button:
                'bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-neutral-800',
              allowedContent: 'text-xs text-neutral-500',
            }}
          />
        </div>
        <div className="text-xs text-neutral-500">
          Tip: search filters the files listed on the current page.
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {actionMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Stored files</h3>
            <p className="text-sm text-neutral-500">
              {isLoading
                ? 'Loading files...'
                : `${filteredFiles.length} of ${files.length} file(s) shown`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => fetchFiles()}
              className="text-xs"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <th className="px-6 py-3 font-medium text-neutral-600">File</th>
                <th className="px-6 py-3 font-medium text-neutral-600">Status</th>
                <th className="px-6 py-3 font-medium text-neutral-600">Size</th>
                <th className="px-6 py-3 font-medium text-neutral-600">Uploaded</th>
                <th className="px-6 py-3 font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading && (
                <tr>
                  <td className="px-6 py-6 text-neutral-500" colSpan={5}>
                    Loading files...
                  </td>
                </tr>
              )}
              {!isLoading && filteredFiles.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-neutral-500" colSpan={5}>
                    No files found for this page.
                  </td>
                </tr>
              )}
              {!isLoading &&
                filteredFiles.map((file) => (
                  <tr key={file.key} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900">{file.name}</div>
                      <div className="text-xs text-neutral-500 break-all">{file.key}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                        {file.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">{formatBytes(file.size)}</td>
                    <td className="px-6 py-4 text-neutral-600">
                      {new Date(file.uploadedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {file.url && (
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() => handleCopy(file.url, 'File URL')}
                            className="text-xs"
                          >
                            <i className="fas fa-link mr-1"></i>
                            Copy URL
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => handleCopy(file.key, 'File key')}
                          className="text-xs"
                        >
                          <i className="fas fa-key mr-1"></i>
                          Copy key
                        </Button>
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => handleDelete(file.key)}
                          className="text-xs text-red-600"
                        >
                          <i className="fas fa-trash-alt mr-1"></i>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-neutral-200 px-6 py-4 sm:flex-row sm:justify-between">
          <span className="text-xs text-neutral-500">Page {page}</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="text-xs"
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setPage((prev) => prev + 1)}
              className="text-xs"
              disabled={!hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
