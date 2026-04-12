'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Folder,
  File,
  Plus,
  Settings,
  ChevronRight,
  Trash2,
  Database,
  Loader2,
  Upload,
  PlusCircle,
  Search,
  MoreVertical,
  ExternalLink,
  Menu,
  HardDrive,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import VaultlyNavigation from './VaultlyNavigation';
import SessionProvider from '@/components/SessionProvider';

function VaultlyContentMain() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [drives, setDrives] = useState([]);
  const [activeDrive, setActiveDrive] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Root' }]);

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Drive Modal state
  const [showAddDrive, setShowAddDrive] = useState(false);
  const [newDriveName, setNewDriveName] = useState('');
  const [newDriveProvider, setNewDriveProvider] = useState('uploadthing');
  const [newDriveToken, setNewDriveToken] = useState('');

  // New Folder Modal state
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Mobile menu state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/login?callbackUrl=/apps/vaultly');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchDrives();
    }
  }, [session]);

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

  const handleDeleteDrive = async (id, e) => {
    e.stopPropagation();
    if (
      !confirm('Delete this drive connection? Files on provider will NOT be deleted automatically.')
    )
      return;
    await fetch(`/api/admin/drive/credentials/${id}`, { method: 'DELETE' });
    if (activeDrive === id) {
      setActiveDrive(null);
      setFolders([]);
      setFiles([]);
    }
    fetchDrives();
  };

  const handleFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('credentialId', activeDrive);

    setLoading(true);
    try {
      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const uploadData = await res.json();
        await fetch('/api/drive/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileKey: uploadData.fileKey,
            url: uploadData.url,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            folderId: currentFolder,
            credentialId: activeDrive,
          }),
        });
        fetchContents();
      } else {
        const errorData = await res.json();
        alert(`Upload failed: ${errorData.error}`);
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert(`Upload error: ${error.message}`);
      setLoading(false);
    }
    e.target.value = null;
  };

  const filteredItems = {
    folders: folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())),
    files: files.filter((f) => f.fileName.toLowerCase().includes(searchQuery.toLowerCase())),
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#1f644e] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-[#7c8e88] font-medium">Loading Vaultly...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  const activeDriveName = drives.find((d) => d._id === activeDrive)?.name || 'Select Drive';

  return (
    <div className="min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex">
      <VaultlyNavigation
        drives={drives}
        activeDrive={activeDrive}
        setActiveDrive={setActiveDrive}
        setShowAddDrive={setShowAddDrive}
        handleDeleteDrive={handleDeleteDrive}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64 min-h-screen overflow-x-hidden pb-20 lg:pb-0 pt-14 lg:pt-0">
        {/* Header */}
        <header className="lg:sticky lg:top-0 fixed top-0 left-0 right-0 z-50 bg-[#fcfbf5] border-b border-[#e5e3d8]">
          <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Logo */}
              <div className="flex items-center gap-2 lg:hidden">
                <div className="w-6 h-6 rounded-lg bg-[#1f644e] flex items-center justify-center shadow-sm text-white">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <h1 className="font-[family-name:var(--font-logo)] text-xl text-black">Vaultly</h1>
              </div>
              {/* Desktop Title */}
              <h1 className="hidden lg:block text-lg font-bold text-[#1e3a34]">
                {activeDriveName}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {loading && (
                <div className="flex items-center gap-1.5 text-xs text-[#7c8e88]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing...</span>
                </div>
              )}
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-full text-[#7c8e88] hover:text-[#1e3a34] hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 w-full overflow-x-hidden p-4 lg:p-6">
          <div className="w-full max-w-6xl mx-auto">
            {/* Breadcrumbs & Actions */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#7c8e88] mb-4">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <button
                      onClick={() => handleBreadcrumbClick(idx)}
                      className={`transition-colors cursor-pointer ${idx === breadcrumbs.length - 1 ? 'text-[#1e3a34]' : 'hover:text-[#1f644e]'}`}
                    >
                      {crumb.name}
                    </button>
                    {idx < breadcrumbs.length - 1 && (
                      <ChevronRight size={12} className="text-[#e5e3d8]" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8e88]" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-[#e5e3d8] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#7c8e88] focus:border-[#1f644e]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddFolder(true)}
                    disabled={!activeDrive}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 border border-[#1f644e] text-[#1f644e] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#1f644e] hover:text-white transition cursor-pointer disabled:opacity-50"
                  >
                    <PlusCircle size={16} /> New Folder
                  </button>
                  {activeDrive && (
                    <label className="flex-1 sm:flex-none cursor-pointer flex items-center justify-center gap-1.5 bg-[#1f644e] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#17503e] transition shadow-md shadow-[#1f644e]/10">
                      <Upload size={16} /> Upload
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Grid */}
            {!activeDrive ? (
              <div className="bg-white border border-[#e5e3d8] rounded-xl p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#f0f5f2] flex items-center justify-center mx-auto mb-4 text-[#7c8e88]">
                  <Database size={32} />
                </div>
                <p className="text-sm font-bold text-[#1e3a34] mb-1">No drive connected</p>
                <p className="text-xs text-[#7c8e88] mb-6">
                  Select a drive from the sidebar to view your files
                </p>
                <button
                  onClick={() => setShowAddDrive(true)}
                  className="bg-[#1f644e] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#17503e] transition cursor-pointer"
                >
                  Connect Drive
                </button>
              </div>
            ) : filteredItems.folders.length === 0 && filteredItems.files.length === 0 ? (
              <div className="bg-white border border-[#e5e3d8] rounded-xl p-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#f0f5f2] flex items-center justify-center mx-auto mb-4 text-[#7c8e88]">
                  <Folder size={32} />
                </div>
                <p className="text-sm font-bold text-[#1e3a34] mb-1">Folder is empty</p>
                <p className="text-xs text-[#7c8e88]">
                  {searchQuery
                    ? 'No files match your search criteria'
                    : 'Start by uploading a file or creating a subfolder'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Folders */}
                {filteredItems.folders.map((folder) => (
                  <div
                    key={folder._id}
                    onClick={() => handleFolderClick(folder)}
                    className="group bg-white border border-[#e5e3d8] rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer relative"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#f0f5f2] flex items-center justify-center shrink-0 text-[#1f644e] group-hover:scale-105 transition-transform">
                      <Folder size={24} fill="currentColor" className="opacity-20" />
                      <Folder size={24} className="absolute" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#1e3a34] truncate">{folder.name}</p>
                      <p className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mt-0.5">
                        Folder
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#c94c4c] hover:bg-[#fef2f2] transition-all cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {/* Files */}
                {filteredItems.files.map((file) => (
                  <div
                    key={file._id}
                    className="group bg-white border border-[#e5e3d8] rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow relative"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#f8f9f4] flex items-center justify-center shrink-0 overflow-hidden">
                        {file.mimeType?.startsWith('image/') ? (
                          <img src={file.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <File size={24} className="text-[#7c8e88]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-bold text-sm text-[#1e3a34] truncate"
                          title={file.fileName}
                        >
                          {file.fileName}
                        </p>
                        <p className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mt-0.5">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 border border-[#e5e3d8] text-[#1e3a34] py-1.5 rounded-lg text-[10px] font-bold hover:bg-[#f0f5f2] transition"
                      >
                        <ExternalLink size={12} /> VIEW
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file._id)}
                        className="p-1.5 rounded-lg text-[#c94c4c] hover:bg-[#fef2f2] transition cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {(showAddDrive || showAddFolder) && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#fcfbf5] w-full max-w-sm rounded-xl border border-[#e5e3d8] shadow-xl p-5 animate-in zoom-in-95 duration-200">
            {showAddDrive ? (
              <>
                <h3 className="text-center font-bold text-[#1f644e] mb-4 text-sm">
                  Add Storage Drive
                </h3>
                <form onSubmit={handleAddDrive} className="space-y-4">
                  <div className="border border-[#1f644e] rounded-lg px-3 py-2 bg-[#f0f5f2]">
                    <div className="text-[10px] text-[#1f644e] font-bold">Name</div>
                    <input
                      required
                      value={newDriveName}
                      onChange={(e) => setNewDriveName(e.target.value)}
                      placeholder="e.g. My Assets"
                      className="w-full bg-transparent outline-none font-bold text-sm"
                    />
                  </div>
                  <div className="border border-[#1f644e] rounded-lg px-3 py-2 bg-[#f0f5f2]">
                    <div className="text-[10px] text-[#1f644e] font-bold">Provider</div>
                    <select
                      value={newDriveProvider}
                      onChange={(e) => setNewDriveProvider(e.target.value)}
                      className="w-full bg-transparent outline-none font-bold text-sm appearance-none"
                    >
                      <option value="uploadthing">UploadThing</option>
                      <option value="s3" disabled>
                        AWS S3 (Soon)
                      </option>
                    </select>
                  </div>
                  <div className="border border-[#1f644e] rounded-lg px-3 py-2 bg-[#f0f5f2]">
                    <div className="text-[10px] text-[#1f644e] font-bold">API Token</div>
                    <input
                      required
                      type="password"
                      value={newDriveToken}
                      onChange={(e) => setNewDriveToken(e.target.value)}
                      placeholder="sk_live_..."
                      className="w-full bg-transparent outline-none font-bold text-sm"
                    />
                  </div>
                  <div className="flex justify-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDrive(false)}
                      className="border border-[#1f644e] text-[#1f644e] px-6 py-1.5 rounded-lg text-sm font-bold cursor-pointer hover:bg-[#f0f5f2] transition"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      className="bg-[#1f644e] text-white px-6 py-1.5 rounded-lg text-sm font-bold cursor-pointer hover:bg-[#17503e] transition shadow-md"
                    >
                      SAVE
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h3 className="text-center font-bold text-[#1f644e] mb-4 text-sm">New Folder</h3>
                <form onSubmit={handleAddFolder} className="space-y-4">
                  <div className="border border-[#1f644e] rounded-lg px-3 py-2 bg-[#f0f5f2]">
                    <div className="text-[10px] text-[#1f644e] font-bold">Folder Name</div>
                    <input
                      required
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="e.g. Documents"
                      className="w-full bg-transparent outline-none font-bold text-sm"
                    />
                  </div>
                  <div className="flex justify-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddFolder(false)}
                      className="border border-[#1f644e] text-[#1f644e] px-6 py-1.5 rounded-lg text-sm font-bold cursor-pointer hover:bg-[#f0f5f2] transition"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      className="bg-[#1f644e] text-white px-6 py-1.5 rounded-lg text-sm font-bold cursor-pointer hover:bg-[#17503e] transition shadow-md"
                    >
                      CREATE
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VaultlyContent() {
  return (
    <SessionProvider>
      <VaultlyContentMain />
    </SessionProvider>
  );
}
