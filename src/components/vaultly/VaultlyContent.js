'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Folder, File, Plus, Settings, ChevronRight, HardDrive, Trash2, LayoutDashboard, Database, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VaultlyContent() {
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
      if (!confirm('Delete this drive connection? Files on provider will NOT be deleted automatically.')) return;
      await fetch(`/api/admin/drive/credentials/${id}`, { method: 'DELETE' });
      if (activeDrive === id) {
          setActiveDrive(null);
          setFolders([]);
          setFiles([]);
      }
      fetchDrives();
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf5] dark:bg-[#1e1e1e]">
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

  return (
    <div className="flex h-screen overflow-hidden text-[#2d3748] dark:text-[#e2e8f0] bg-[#fcfbf5] dark:bg-[#1e1e1e]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-[#2d3748] shadow-xl md:shadow-none border-r border-[#e2e8f0] dark:border-[#4a5568] flex flex-col transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="p-4 border-b border-[#e2e8f0] dark:border-[#4a5568] flex justify-between items-center bg-[#1f644e]">
          <h2 className="font-bold text-xl flex items-center gap-2 text-white font-logo">
            <Database size={24} /> Vaultly
          </h2>
          <button onClick={() => setShowAddDrive(true)} className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors" title="Add Drive">
            <Plus size={18} />
          </button>
        </div>

        <div className="p-3">
             <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm text-[#718096] hover:text-[#2d3748] dark:text-[#a0aec0] dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <ArrowLeft size={16} /> Back to Admin
             </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs font-semibold text-[#a0aec0] uppercase tracking-wider mb-2 px-3">Your Drives</div>
          {drives.length === 0 ? (
             <div className="px-3 py-4 text-sm text-[#718096] text-center">No drives configured.</div>
          ) : drives.map(drive => (
            <div
              key={drive._id}
              onClick={() => {
                setActiveDrive(drive._id);
                setCurrentFolder(null);
                setBreadcrumbs([{ id: null, name: 'Root' }]);
                setIsSidebarOpen(false); // Close sidebar on mobile after selection
              }}
              className={`w-full group flex justify-between items-center px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${activeDrive === drive._id ? 'bg-[#e6f0ed] text-[#1f644e] dark:bg-[#1f644e] dark:text-white font-medium' : 'text-[#4a5568] dark:text-[#cbd5e0] hover:bg-[#f7fafc] dark:hover:bg-[#4a5568]'}`}
            >
              <div className="flex items-center gap-3 truncate">
                <HardDrive size={18} className={activeDrive === drive._id ? 'text-[#1f644e] dark:text-white' : 'text-[#a0aec0]'} />
                <span className="truncate text-sm">{drive.name}</span>
              </div>
              <button
                onClick={(e) => handleDeleteDrive(drive._id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all"
                title="Remove Drive"
              >
                  <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-64 relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#2d3748] border-b border-[#e2e8f0] dark:border-[#4a5568]">
            <div className="flex items-center gap-2">
                <Database size={20} className="text-[#1f644e]" />
                <span className="font-bold font-logo text-[#1f644e] dark:text-white">Vaultly</span>
            </div>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                <Settings size={20} />
            </button>
        </div>

        {/* Top Bar */}
        <header className="bg-white dark:bg-[#2d3748] border-b border-[#e2e8f0] dark:border-[#4a5568] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center flex-wrap gap-2 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={`hover:underline transition-colors ${idx === breadcrumbs.length - 1 ? 'font-semibold text-[#2d3748] dark:text-white' : 'text-[#718096] hover:text-[#4a5568] dark:text-[#a0aec0] dark:hover:text-[#cbd5e0]'}`}
                >
                  {crumb.name}
                </button>
                {idx < breadcrumbs.length - 1 && <ChevronRight size={14} className="text-[#cbd5e0] dark:text-[#718096]" />}
              </React.Fragment>
            ))}
          </div>

          {activeDrive && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddFolder(true)}
                className="flex items-center gap-2 bg-white dark:bg-[#4a5568] border border-[#e2e8f0] dark:border-[#718096] text-[#4a5568] dark:text-[#e2e8f0] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#f7fafc] dark:hover:bg-[#718096] transition-colors shadow-sm"
              >
                <Folder size={16} /> <span className="hidden sm:inline">New Folder</span>
              </button>

              <div className="relative">
                <label className="cursor-pointer flex items-center gap-2 bg-[#1f644e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#164a3a] transition-colors shadow-sm">
                  <Plus size={16} /> <span className="hidden sm:inline">Upload File</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
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
                              credentialId: activeDrive
                            })
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
                    }}
                  />
                </label>
              </div>
            </div>
          )}
        </header>

        {/* Explorer Workspace */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!activeDrive ? (
            <div className="flex flex-col items-center justify-center h-full text-[#718096] dark:text-[#a0aec0]">
                <HardDrive size={64} className="mb-4 text-[#cbd5e0] dark:text-[#4a5568]" />
                <h3 className="text-xl font-semibold text-[#4a5568] dark:text-[#e2e8f0] mb-2">No Drive Selected</h3>
                <p>Select a drive from the sidebar or add a new one to begin.</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#1f644e] border-t-transparent mb-4"></div>
                <p className="text-[#718096] dark:text-[#a0aec0]">Loading contents...</p>
            </div>
          ) : folders.length === 0 && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#718096] dark:text-[#a0aec0]">
                <Folder size={64} className="mb-4 text-[#cbd5e0] dark:text-[#4a5568]" />
                <p className="text-lg">This folder is empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6 pb-20">
              {folders.map(folder => (
                <div
                  key={folder._id}
                  className="bg-white dark:bg-[#2d3748] p-5 rounded-xl shadow-sm hover:shadow-md border border-[#e2e8f0] dark:border-[#4a5568] flex flex-col items-center gap-3 cursor-pointer transition-all relative group hover:-translate-y-1"
                  onClick={() => handleFolderClick(folder)}
                >
                  <div className="bg-[#e6f0ed] dark:bg-[#4a5568] p-3 rounded-full">
                    <Folder size={32} className="text-[#1f644e] dark:text-[#a0aec0] fill-current opacity-80" />
                  </div>
                  <span className="text-sm font-semibold text-center truncate w-full text-[#2d3748] dark:text-[#e2e8f0]">{folder.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder._id); }}
                    className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {files.map(file => (
                <div
                  key={file._id}
                  className="bg-white dark:bg-[#2d3748] p-5 rounded-xl shadow-sm hover:shadow-md border border-[#e2e8f0] dark:border-[#4a5568] flex flex-col items-center gap-3 relative group transition-all hover:-translate-y-1"
                >
                  <div className="bg-[#f7fafc] dark:bg-[#1a202c] p-3 rounded-lg w-full flex justify-center border border-[#e2e8f0] dark:border-transparent">
                     {file.mimeType?.startsWith('image/') ? (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img src={file.url} alt={file.fileName} className="w-12 h-12 object-cover rounded shadow-sm" />
                     ) : (
                         <File size={32} className="text-[#a0aec0] my-2" />
                     )}
                  </div>
                  <span className="text-sm font-medium text-center truncate w-full text-[#4a5568] dark:text-[#cbd5e0]" title={file.fileName}>{file.fileName}</span>
                  <div className="flex gap-2 w-full justify-center">
                    <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-[#e6f0ed] text-[#1f644e] dark:bg-[#4a5568] dark:text-white px-3 py-1 rounded-full font-medium hover:bg-[#cce0d8] dark:hover:bg-[#718096] transition-colors"
                    >
                        View
                    </a>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file._id)}
                    className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 p-1.5 bg-white dark:bg-[#2d3748] hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
      )}

      {/* Add Drive Modal */}
      {showAddDrive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddDrive} className="bg-white dark:bg-[#2d3748] p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-[#2d3748] dark:text-white flex items-center gap-2">
                <HardDrive size={24} className="text-[#1f644e]" />
                Add Storage Drive
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#4a5568] dark:text-[#cbd5e0]">Drive Name</label>
                <input required value={newDriveName} onChange={e => setNewDriveName(e.target.value)} placeholder="e.g. My Images" className="w-full border border-[#e2e8f0] dark:border-[#4a5568] p-3 rounded-lg dark:bg-[#1a202c] dark:text-white focus:ring-2 focus:ring-[#1f644e] focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#4a5568] dark:text-[#cbd5e0]">Provider</label>
                <select value={newDriveProvider} onChange={e => setNewDriveProvider(e.target.value)} className="w-full border border-[#e2e8f0] dark:border-[#4a5568] p-3 rounded-lg dark:bg-[#1a202c] dark:text-white focus:ring-2 focus:ring-[#1f644e] focus:border-transparent outline-none transition-all appearance-none bg-white">
                  <option value="uploadthing">UploadThing</option>
                  <option value="s3" disabled>AWS S3 (Coming Soon)</option>
                  <option value="cloudinary" disabled>Cloudinary (Coming Soon)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#4a5568] dark:text-[#cbd5e0]">Token / API Key</label>
                <input required value={newDriveToken} onChange={e => setNewDriveToken(e.target.value)} type="password" placeholder="sk_live_..." className="w-full border border-[#e2e8f0] dark:border-[#4a5568] p-3 rounded-lg dark:bg-[#1a202c] dark:text-white focus:ring-2 focus:ring-[#1f644e] focus:border-transparent outline-none transition-all" />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddDrive(false)} className="px-5 py-2.5 text-sm font-medium text-[#718096] hover:text-[#4a5568] dark:hover:text-[#cbd5e0] transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-[#1f644e] hover:bg-[#164a3a] text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5">Save Drive</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Folder Modal */}
      {showAddFolder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddFolder} className="bg-white dark:bg-[#2d3748] p-8 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-[#2d3748] dark:text-white flex items-center gap-2">
                <Folder size={24} className="text-[#1f644e]" />
                New Folder
            </h3>
            <div>
              <label className="block text-sm font-semibold mb-2 text-[#4a5568] dark:text-[#cbd5e0]">Folder Name</label>
              <input required value={newFolderName} onChange={e => setNewFolderName(e.target.value)} autoFocus placeholder="e.g. Documents" className="w-full border border-[#e2e8f0] dark:border-[#4a5568] p-3 rounded-lg dark:bg-[#1a202c] dark:text-white focus:ring-2 focus:ring-[#1f644e] focus:border-transparent outline-none transition-all" />
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddFolder(false)} className="px-5 py-2.5 text-sm font-medium text-[#718096] hover:text-[#4a5568] dark:hover:text-[#cbd5e0] transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-[#1f644e] hover:bg-[#164a3a] text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
