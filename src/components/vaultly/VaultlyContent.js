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
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64 min-h-screen overflow-x-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#fcfbf5] border-b border-[#e5e3d8] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 rounded-lg text-[#7c8e88]"
            >
              <Menu size={24} />
            </button>
            <h1 className="font-[family-name:var(--font-logo)] text-xl text-black">Vaultly</h1>
          </div>
          <div className="text-xs font-bold text-[#1f644e] bg-[#f0f5f2] px-2 py-1 rounded-md">
            {activeDriveName}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:sticky lg:top-0 z-40 bg-[#fcfbf5]/80 backdrop-blur-md border-b border-[#e5e3d8] px-6 py-3 lg:flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex flex-col">
              <h1 className="text-sm font-black text-[#1e3a34] uppercase tracking-wider mb-0.5">
                {activeDriveName}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px]">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <button
                      onClick={() => handleBreadcrumbClick(idx)}
                      className={`font-bold transition-colors ${idx === breadcrumbs.length - 1 ? 'text-[#1e3a34]' : 'text-[#7c8e88] hover:text-[#1f644e]'}`}
                    >
                      {crumb.name}
                    </button>
                    {idx < breadcrumbs.length - 1 && (
                      <ChevronRight size={10} className="text-[#e5e3d8]" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="h-8 w-px bg-[#e5e3d8] mx-2" />

            {/* Desktop Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7c8e88]" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-[#e5e3d8] bg-white/50 text-xs font-bold outline-none focus:border-[#1f644e] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loading && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7c8e88] mr-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>SYNCING</span>
              </div>
            )}

            <button
              onClick={() => setShowAddFolder(true)}
              disabled={!activeDrive}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#f0f5f2] border border-[#e5e3d8] transition-all disabled:opacity-50"
            >
              <PlusCircle size={14} strokeWidth={2.5} />
              New Folder
            </button>

            {activeDrive && (
              <label className="cursor-pointer flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#1f644e] text-white text-xs font-bold shadow-md shadow-[#1f644e]/10 hover:bg-[#164a3a] transition-all">
                <Upload size={14} strokeWidth={2.5} />
                Upload
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 w-full pt-16 lg:pt-0 pb-20 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Mobile Search & Actions Bar */}
            <div className="lg:hidden flex flex-col gap-3 mb-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8e88]" />
                <input
                  type="text"
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e5e3d8] bg-white text-sm font-medium outline-none focus:border-[#1f644e] transition-all"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddFolder(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#e5e3d8] bg-white text-sm font-bold text-[#1e3a34]"
                >
                  <PlusCircle size={16} /> Folder
                </button>
                {activeDrive && (
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1f644e] text-white text-sm font-bold">
                    <Upload size={16} strokeWidth={2.5} /> Upload
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                )}
              </div>
            </div>

            {/* Explorer */}
            {!activeDrive ? (
              <div className="py-20 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-[#f0f5f2] flex items-center justify-center mb-4 text-[#1f644e]">
                  <Database size={32} />
                </div>
                <h2 className="text-lg font-bold text-[#1e3a34]">No Drive Connected</h2>
                <p className="text-sm text-[#7c8e88] max-w-xs mx-auto mt-1">
                  Select an existing drive from the sidebar or add a new storage provider to get
                  started.
                </p>
              </div>
            ) : loading && folders.length === 0 && files.length === 0 ? (
              <div className="py-20 flex justify-center">
                <Loader2 size={32} className="text-[#1f644e] animate-spin" />
              </div>
            ) : filteredItems.folders.length === 0 && filteredItems.files.length === 0 ? (
              <div className="py-20 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-[#f0f5f2] flex items-center justify-center mb-4 text-[#7c8e88]">
                  <Folder size={32} />
                </div>
                <h2 className="text-lg font-bold text-[#1e3a34]">Folder is Empty</h2>
                <p className="text-sm text-[#7c8e88] mt-1">
                  {searchQuery
                    ? 'No files match your search.'
                    : 'Upload your first file or create a folder.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {/* Folders */}
                {filteredItems.folders.map((folder) => (
                  <div
                    key={folder._id}
                    onClick={() => handleFolderClick(folder)}
                    className="group relative bg-white border border-[#e5e3d8] rounded-2xl p-4 flex flex-col items-center gap-3 cursor-pointer hover:border-[#1f644e] hover:shadow-xl hover:shadow-[#1f644e]/5 transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-[#f0f5f2] flex items-center justify-center text-[#1f644e] group-hover:scale-110 transition-transform">
                      <Folder size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-xs font-bold text-[#1e3a34] text-center truncate w-full px-1">
                      {folder.name}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder._id);
                      }}
                      className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 text-[#c94c4c] hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                {/* Files */}
                {filteredItems.files.map((file) => (
                  <div
                    key={file._id}
                    className="group relative bg-white border border-[#e5e3d8] rounded-2xl p-4 flex flex-col items-center gap-3 hover:border-[#1f644e] hover:shadow-xl hover:shadow-[#1f644e]/5 transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-[#f8f9f4] flex items-center justify-center text-[#7c8e88] group-hover:scale-110 transition-transform overflow-hidden">
                      {file.mimeType?.startsWith('image/') ? (
                        <img
                          src={file.url}
                          alt={file.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <File size={24} />
                      )}
                    </div>
                    <span
                      className="text-xs font-bold text-[#1e3a34] text-center truncate w-full px-1"
                      title={file.fileName}
                    >
                      {file.fileName}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-[#1f644e] hover:bg-[#f0f5f2] transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file._id)}
                        className="p-1.5 rounded-lg text-[#c94c4c] hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
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
      {showAddDrive && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowAddDrive(false)}
          />
          <form
            onSubmit={handleAddDrive}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-[#e5e3d8]"
          >
            <h3 className="text-xl font-bold text-[#1e3a34] mb-6 flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#f0f5f2] flex items-center justify-center text-[#1f644e]">
                <HardDrive size={20} />
              </div>
              Add Storage Drive
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1.5 ml-1">
                  Drive Name
                </label>
                <input
                  required
                  value={newDriveName}
                  onChange={(e) => setNewDriveName(e.target.value)}
                  placeholder="e.g. My Assets"
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm font-medium outline-none focus:border-[#1f644e] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1.5 ml-1">
                  Provider
                </label>
                <select
                  value={newDriveProvider}
                  onChange={(e) => setNewDriveProvider(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm font-bold outline-none focus:border-[#1f644e] transition-all appearance-none"
                >
                  <option value="uploadthing">UploadThing</option>
                  <option value="s3" disabled>
                    AWS S3 (Coming Soon)
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1.5 ml-1">
                  API Token
                </label>
                <input
                  required
                  type="password"
                  value={newDriveToken}
                  onChange={(e) => setNewDriveToken(e.target.value)}
                  placeholder="sk_live_..."
                  className="w-full px-4 py-3 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm font-medium outline-none focus:border-[#1f644e] transition-all"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddDrive(false)}
                className="px-6 py-2.5 text-xs font-bold text-[#7c8e88] hover:text-[#1e3a34] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 bg-[#1f644e] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#1f644e]/20 hover:bg-[#164a3a] transition-all"
              >
                Save Drive
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddFolder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowAddFolder(false)}
          />
          <form
            onSubmit={handleAddFolder}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 border border-[#e5e3d8]"
          >
            <h3 className="text-xl font-bold text-[#1e3a34] mb-6 flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#f0f5f2] flex items-center justify-center text-[#1f644e]">
                <Folder size={20} />
              </div>
              New Folder
            </h3>

            <div>
              <label className="block text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mb-1.5 ml-1">
                Folder Name
              </label>
              <input
                required
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Invoices"
                className="w-full px-4 py-3 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm font-medium outline-none focus:border-[#1f644e] transition-all"
              />
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddFolder(false)}
                className="px-6 py-2.5 text-xs font-bold text-[#7c8e88] hover:text-[#1e3a34] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 bg-[#1f644e] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#1f644e]/20 hover:bg-[#164a3a] transition-all"
              >
                Create
              </button>
            </div>
          </form>
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
