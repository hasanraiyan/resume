'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UploadButton } from '@uploadthing/react';
import { Folder, File, Plus, Settings, ChevronRight, HardDrive, Trash2 } from 'lucide-react';

export default function VaultlyApp() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [drives, setDrives] = useState([]);
  const [activeDrive, setActiveDrive] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Root' }]);

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Drive Modal state
  const [showAddDrive, setShowAddDrive] = useState(false);
  const [newDriveName, setNewDriveName] = useState('');
  const [newDriveProvider, setNewDriveProvider] = useState('uploadthing');
  const [newDriveToken, setNewDriveToken] = useState('');

  // New Folder Modal state
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchDrives();
  }, []);

  useEffect(() => {
    if (activeDrive) {
      fetchContents();
    }
  }, [activeDrive, currentFolder]);

  const fetchDrives = async () => {
    try {
      const res = await fetch('/api/admin/drive/credentials');
      if (!res.ok) return;
      const data = await res.json();
      setDrives(data.credentials || []);
      if (data.credentials?.length > 0 && !activeDrive) {
        setActiveDrive(data.credentials[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchContents = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/drive/folders', window.location.origin);
      if (currentFolder) url.searchParams.append('parentId', currentFolder);
      if (activeDrive) url.searchParams.append('credentialId', activeDrive);

      const res = await fetch(url.toString());
      if (!res.ok) return;
      const data = await res.json();
      setFolders(data.folders || []);
      setFiles(data.files || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrive = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/drive/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDriveName,
          provider: newDriveProvider,
          credentials: { token: newDriveToken },
        }),
      });
      if (res.ok) {
        setShowAddDrive(false);
        setNewDriveName('');
        setNewDriveToken('');
        fetchDrives();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFolder = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolder,
          credentialId: activeDrive,
        }),
      });
      if (res.ok) {
        setShowAddFolder(false);
        setNewFolderName('');
        fetchContents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFolderClick = (folder) => {
    setCurrentFolder(folder._id);
    setBreadcrumbs([...breadcrumbs, { id: folder._id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index) => {
    const crumb = breadcrumbs[index];
    setCurrentFolder(crumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const handleDeleteFile = async (id) => {
    if (!confirm('Delete file?')) return;
    await fetch(`/api/drive/files/${id}`, { method: 'DELETE' });
    fetchContents();
  };

  const handleDeleteFolder = async (id) => {
    if (!confirm('Delete folder? Ensure it is empty.')) return;
    await fetch(`/api/drive/folders/${id}`, { method: 'DELETE' });
    fetchContents();
  };

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <div className="flex h-screen overflow-hidden text-gray-800 dark:text-gray-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <HardDrive size={20} /> Vaultly
          </h2>
          <button onClick={() => setShowAddDrive(true)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {drives.map(drive => (
            <button
              key={drive._id}
              onClick={() => {
                setActiveDrive(drive._id);
                setCurrentFolder(null);
                setBreadcrumbs([{ id: null, name: 'Root' }]);
              }}
              className={`w-full flex items-center gap-2 p-2 rounded text-left ${activeDrive === drive._id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <Settings size={16} />
              <span className="truncate">{drive.name}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={`hover:underline ${idx === breadcrumbs.length - 1 ? 'font-bold' : 'text-gray-500'}`}
                >
                  {crumb.name}
                </button>
                {idx < breadcrumbs.length - 1 && <ChevronRight size={14} className="text-gray-400" />}
              </React.Fragment>
            ))}
          </div>

          {activeDrive && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddFolder(true)}
                className="flex items-center gap-1 bg-white border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded text-sm hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <Folder size={16} /> New Folder
              </button>

              {/* Direct Upload using standard UploadThing component for hybrid flow */}
              <div className="overflow-hidden relative flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">
                <UploadButton
                  endpoint="mediaUploader"
                  onClientUploadComplete={async (res) => {
                    if (res && res.length > 0) {
                      const file = res[0];
                      // Save metadata after hybrid direct upload
                      await fetch('/api/drive/files', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          fileName: file.name,
                          fileKey: file.key || file.serverData?.fileKey,
                          url: file.url,
                          mimeType: file.type || 'application/octet-stream',
                          size: file.size,
                          folderId: currentFolder,
                          credentialId: activeDrive
                        })
                      });
                      fetchContents();
                    }
                  }}
                  onUploadError={(error) => {
                    alert(`ERROR! ${error.message}`);
                  }}
                  className="ut-button:bg-transparent ut-button:w-full ut-button:h-full ut-button:absolute ut-button:inset-0 ut-allowed-content:hidden"
                  content={{
                    button({ ready }) {
                      return ready ? <div className="flex items-center gap-1"><Plus size={16} /> Upload File</div> : 'Loading...';
                    }
                  }}
                />
              </div>
            </div>
          )}
        </header>

        {/* Explorer Workspace */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!activeDrive ? (
            <div className="text-center text-gray-500 mt-20">Select or Add a Drive to begin.</div>
          ) : loading ? (
            <div className="text-center text-gray-500 mt-20">Loading...</div>
          ) : folders.length === 0 && files.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">This folder is empty.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map(folder => (
                <div
                  key={folder._id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2 cursor-pointer hover:shadow-md transition-shadow relative group"
                  onClick={() => handleFolderClick(folder)}
                >
                  <Folder size={40} className="text-blue-500" />
                  <span className="text-sm font-medium text-center truncate w-full">{folder.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder._id); }}
                    className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {files.map(file => (
                <div
                  key={file._id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2 relative group hover:shadow-md transition-shadow"
                >
                  <File size={40} className="text-gray-400" />
                  <span className="text-sm text-center truncate w-full" title={file.fileName}>{file.fileName}</span>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDeleteFile(file._id)}
                    className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 p-1 bg-white dark:bg-gray-800 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Drive Modal */}
      {showAddDrive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleAddDrive} className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add Storage Drive</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Drive Name</label>
                <input required value={newDriveName} onChange={e => setNewDriveName(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Provider</label>
                <select value={newDriveProvider} onChange={e => setNewDriveProvider(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600">
                  <option value="uploadthing">UploadThing</option>
                  <option value="s3" disabled>S3 (Coming Soon)</option>
                  <option value="cloudinary" disabled>Cloudinary (Coming Soon)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Token / API Key</label>
                <input required value={newDriveToken} onChange={e => setNewDriveToken(e.target.value)} type="password" placeholder="sk_live_..." className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddDrive(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Folder Modal */}
      {showAddFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleAddFolder} className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">New Folder</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Folder Name</label>
              <input required value={newFolderName} onChange={e => setNewFolderName(e.target.value)} autoFocus className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddFolder(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
