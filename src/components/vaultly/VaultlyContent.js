'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  File,
  Database,
  Loader2,
  Upload,
  PlusCircle,
  Search,
  ExternalLink,
  HardDrive,
  Trash2,
  ChevronRight,
  Home,
  Plus,
  ChevronDown,
  Check,
} from 'lucide-react';
import SessionProvider from '@/components/SessionProvider';

// --- Skeleton Component using Framer Motion ---
const SkeletonCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="relative overflow-hidden bg-white border border-[#e5e3d8] rounded-xl p-5 flex items-center gap-4"
  >
    {/* Infinite Shimmer Sweep */}
    <motion.div
      className="absolute inset-0 z-10 pointer-events-none"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
        width: '200%',
      }}
      animate={{ x: ['-100%', '100%'] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
    />

    <div className="w-12 h-12 rounded-xl bg-[#f0f5f2] shrink-0" />
    <div className="flex-1 space-y-2.5">
      <div className="h-3.5 bg-[#f0f5f2] rounded-md w-3/4" />
      <div className="h-2 bg-[#f0f5f2] rounded-md w-1/3" />
    </div>
  </motion.div>
);

function VaultlyContentMain() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Core State
  const [drives, setDrives] = useState([]);
  const [activeDrive, setActiveDrive] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // UI & Loading States
  const [showBreadcrumbDropdown, setShowBreadcrumbDropdown] = useState(false);
  const [drivesLoading, setDrivesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Modals
  const [showAddDrive, setShowAddDrive] = useState(false);
  const [newDriveName, setNewDriveName] = useState('');
  const [newDriveProvider, setNewDriveProvider] = useState('uploadthing');
  const [newDriveToken, setNewDriveToken] = useState('');
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);

  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

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
    setDrivesLoading(true);
    try {
      const res = await fetch('/api/admin/drive/credentials');
      if (!res.ok) return;
      const data = await res.json();
      setDrives(data.credentials || []);
    } catch (e) {
      console.error(e);
    } finally {
      setDrivesLoading(false);
    }
  };

  const fetchContents = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/drive/folders', window.location.origin);
      if (currentFolder) url.searchParams.append('parentId', currentFolder);
      if (activeDrive) url.searchParams.append('credentialId', activeDrive);

      const res = await fetch(url.toString(), { cache: 'no-store' });
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

  // --- Handlers ---
  const handleGoHome = () => {
    setActiveDrive(null);
    setCurrentFolder(null);
    setBreadcrumbs([]);
    setSearchQuery('');
  };

  const handleDriveClick = (drive) => {
    setActiveDrive(drive._id);
    setCurrentFolder(null);
    setBreadcrumbs([{ id: null, name: drive.name, isDrive: true }]);
  };

  const handleFolderClick = (folder) => {
    if (currentFolder === folder._id) return;
    setCurrentFolder(folder._id);
    setBreadcrumbs((prevBreadcrumbs) => [
      ...prevBreadcrumbs,
      { id: folder._id, name: folder.name },
    ]);
  };

  const handleBreadcrumbClick = (index) => {
    const crumb = breadcrumbs[index];
    if (crumb.isDrive) {
      setCurrentFolder(null);
      setBreadcrumbs([breadcrumbs[0]]);
    } else {
      setCurrentFolder(crumb.id);
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
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
        await fetchDrives();
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
        await fetchContents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFile = async (id) => {
    if (!confirm('Delete file?')) return;
    await fetch(`/api/drive/files/${id}`, { method: 'DELETE' });
    fetchContents();
  };

  const handleDeleteFolder = async (id) => {
    if (!confirm('Delete folder and all its contents?')) return;
    await fetch(`/api/drive/folders/${id}`, { method: 'DELETE' });
    fetchContents();
  };

  const handleDeleteDrive = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this drive? All files and folders will be permanently removed.')) return;
    await fetch(`/api/admin/drive/credentials/${id}`, { method: 'DELETE' });
    fetchDrives();
  };

  const handleFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('credentialId', activeDrive);

    setIsUploading(true);
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
        await fetchContents();
      } else {
        const errorData = await res.json();
        alert(`Upload failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
      alert(`Upload error: ${error.message}`);
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
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
          <p className="mt-4 text-[#7c8e88] font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') return null;

  // --- Breadcrumb Truncation Logic ---
  const MAX_VISIBLE_BREADCRUMBS = 3;
  let visibleBreadcrumbs = breadcrumbs;
  let hiddenBreadcrumbs = [];

  if (breadcrumbs.length > MAX_VISIBLE_BREADCRUMBS) {
    visibleBreadcrumbs = [
      breadcrumbs[0],
      { isEllipsis: true, id: 'ellipsis' },
      ...breadcrumbs.slice(-2),
    ];
    hiddenBreadcrumbs = breadcrumbs.slice(1, -2);
  }

  const isActionDisabled = drivesLoading || loading || isUploading;

  return (
    <div className="min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex flex-col pb-20 lg:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#fcfbf5] border-b border-[#e5e3d8]">
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleGoHome}>
            <div className="w-8 h-8 rounded-lg bg-[#1f644e] flex items-center justify-center shadow-sm text-white">
              <Database className="w-4 h-4" />
            </div>
            <h1 className="font-[family-name:var(--font-logo)] text-xl font-bold text-black">
              Vaultly
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2">
              <AnimatePresence mode="wait">
                {activeDrive ? (
                  <motion.div
                    key="drive-actions"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2"
                  >
                    <button
                      disabled={isActionDisabled}
                      onClick={() => setShowAddFolder(true)}
                      className={`flex items-center gap-1.5 text-[#1f644e] px-3 py-2 rounded-lg text-sm font-bold transition ${isActionDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f0f5f2] cursor-pointer'}`}
                    >
                      <PlusCircle size={16} /> New Folder
                    </button>
                    <label
                      className={`flex items-center gap-1.5 bg-[#1f644e] text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm ${isActionDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#17503e] cursor-pointer'}`}
                    >
                      {isUploading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      {isUploading ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        className="hidden"
                        disabled={isActionDisabled}
                        onChange={handleFileUpload}
                      />
                    </label>
                  </motion.div>
                ) : (
                  <motion.button
                    key="connect-action"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    disabled={drivesLoading}
                    onClick={() => setShowAddDrive(true)}
                    className={`flex items-center gap-1.5 bg-[#1f644e] text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm ${drivesLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#17503e] cursor-pointer'}`}
                  >
                    <Plus size={16} /> Connect Drive
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-6">
        {/* Breadcrumbs & Search Area */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            className="flex items-center gap-1.5 text-sm font-bold text-[#7c8e88] whitespace-nowrap overflow-x-auto pb-2 sm:pb-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              onClick={handleGoHome}
              className={`transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${!activeDrive ? 'text-[#1e3a34]' : 'hover:text-[#1f644e]'}`}
            >
              <HardDrive size={14} /> <span className="hidden sm:inline">Drives</span>
            </button>

            {breadcrumbs.length > 0 && (
              <ChevronRight size={14} className="text-[#e5e3d8] shrink-0" />
            )}

            {visibleBreadcrumbs.map((crumb, idx) => {
              if (crumb.isEllipsis) {
                return (
                  <React.Fragment key="ellipsis">
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setShowBreadcrumbDropdown(!showBreadcrumbDropdown)}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${showBreadcrumbDropdown ? 'bg-[#f0f5f2] text-[#1f644e]' : 'hover:bg-[#f0f5f2] text-[#7c8e88] hover:text-[#1f644e]'}`}
                      >
                        ...
                      </button>

                      <AnimatePresence>
                        {showBreadcrumbDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setShowBreadcrumbDropdown(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full mt-1 left-0 bg-white border border-[#e5e3d8] rounded-lg shadow-xl py-1 min-w-[160px] z-50"
                            >
                              {hiddenBreadcrumbs.map((hiddenCrumb) => {
                                const originalIndex = breadcrumbs.indexOf(hiddenCrumb);
                                return (
                                  <button
                                    key={hiddenCrumb.id}
                                    onClick={() => {
                                      handleBreadcrumbClick(originalIndex);
                                      setShowBreadcrumbDropdown(false);
                                    }}
                                    className="block w-full text-left px-4 py-2.5 text-xs sm:text-sm text-[#1e3a34] hover:bg-[#f0f5f2] hover:text-[#1f644e] truncate cursor-pointer transition-colors"
                                  >
                                    <Folder
                                      size={12}
                                      className="inline mr-2 text-[#7c8e88] opacity-50"
                                    />
                                    {hiddenCrumb.name}
                                  </button>
                                );
                              })}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    <ChevronRight size={14} className="text-[#e5e3d8] shrink-0" />
                  </React.Fragment>
                );
              }

              const originalIndex = breadcrumbs.indexOf(crumb);

              return (
                <React.Fragment key={crumb.id || `crumb-${idx}`}>
                  <button
                    onClick={() => handleBreadcrumbClick(originalIndex)}
                    className={`transition-colors cursor-pointer truncate max-w-[120px] sm:max-w-[180px] shrink-0 ${originalIndex === breadcrumbs.length - 1 ? 'text-[#1e3a34]' : 'hover:text-[#1f644e]'}`}
                    title={crumb.name}
                  >
                    {crumb.name}
                  </button>
                  {originalIndex < breadcrumbs.length - 1 && (
                    <ChevronRight size={14} className="text-[#e5e3d8] shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <AnimatePresence>
            {activeDrive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full sm:max-w-xs shrink-0"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8e88]" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  disabled={isActionDisabled}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-xl border border-[#e5e3d8] bg-white py-2 pl-9 pr-4 text-sm outline-none transition focus:border-[#1f644e] ${isActionDisabled ? 'opacity-50 cursor-not-allowed' : 'placeholder:text-[#7c8e88]'}`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View Layouts */}
        {!activeDrive ? (
          /* ROOT VIEW */
          drivesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : drives.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#e5e3d8] rounded-xl p-16 text-center mt-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#f0f5f2] flex items-center justify-center mx-auto mb-4 text-[#7c8e88]">
                <Database size={32} />
              </div>
              <p className="text-sm font-bold text-[#1e3a34] mb-1">No drives connected</p>
              <p className="text-xs text-[#7c8e88] mb-6">
                Connect a storage provider to get started.
              </p>
              <button
                onClick={() => setShowAddDrive(true)}
                className="bg-[#1f644e] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#17503e] transition cursor-pointer inline-flex items-center gap-2"
              >
                <Plus size={16} /> Connect Drive
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {drives.map((drive) => (
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  key={drive._id}
                  onClick={() => handleDriveClick(drive)}
                  className="group bg-white border border-[#e5e3d8] rounded-xl p-5 flex items-center gap-4 hover:border-[#1f644e] hover:shadow-md transition-all cursor-pointer relative"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#f0f5f2] flex items-center justify-center shrink-0 text-[#1f644e] group-hover:scale-105 transition-transform">
                    <HardDrive size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base text-[#1e3a34] truncate">{drive.name}</p>
                    <p className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-wider mt-0.5">
                      {drive.provider}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteDrive(drive._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-[#c94c4c] hover:bg-[#fef2f2] transition-all cursor-pointer"
                    title="Disconnect Drive"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )
        ) : /* DRIVE VIEW */
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={`skel-${i}`} />
            ))}
          </div>
        ) : filteredItems.folders.length === 0 && filteredItems.files.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#e5e3d8] rounded-xl p-16 text-center mt-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#f0f5f2] flex items-center justify-center mx-auto mb-4 text-[#7c8e88]">
              <Folder size={32} />
            </div>
            <p className="text-sm font-bold text-[#1e3a34] mb-1">Folder is empty</p>
            <p className="text-xs text-[#7c8e88]">
              {searchQuery
                ? 'No files match your search criteria'
                : 'Start by uploading a file or creating a subfolder'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredItems.folders.map((folder) => (
              <motion.div
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  visible: { opacity: 1, scale: 1 },
                }}
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
              </motion.div>
            ))}

            {filteredItems.files.map((file) => (
              <motion.div
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  visible: { opacity: 1, scale: 1 },
                }}
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
                    <p className="font-bold text-sm text-[#1e3a34] truncate" title={file.fileName}>
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
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e3d8] z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around p-2">
          <button
            onClick={handleGoHome}
            className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] transition-colors cursor-pointer ${!activeDrive ? 'text-[#1f644e]' : 'text-[#7c8e88] hover:bg-[#f0f5f2]'}`}
          >
            <Home size={22} strokeWidth={!activeDrive ? 2.5 : 2} />
            <span className="text-[10px] font-bold mt-1">Home</span>
          </button>

          {!activeDrive ? (
            <button
              disabled={drivesLoading}
              onClick={() => setShowAddDrive(true)}
              className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] transition-colors ${drivesLoading ? 'opacity-50 text-[#e5e3d8] cursor-not-allowed' : 'text-[#7c8e88] hover:bg-[#f0f5f2] cursor-pointer'}`}
            >
              <HardDrive size={22} />
              <span className="text-[10px] font-bold mt-1">Add Drive</span>
            </button>
          ) : (
            <>
              <button
                disabled={isActionDisabled}
                onClick={() => setShowAddFolder(true)}
                className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] transition-colors ${isActionDisabled ? 'opacity-50 text-[#e5e3d8] cursor-not-allowed' : 'text-[#7c8e88] hover:bg-[#f0f5f2] cursor-pointer'}`}
              >
                <Folder size={22} />
                <span className="text-[10px] font-bold mt-1">New Folder</span>
              </button>

              <label
                className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] relative group ${isActionDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <div
                  className={`absolute -top-4 text-white p-3 rounded-full shadow-lg transition-colors ${isActionDisabled ? 'bg-[#7c8e88]' : 'bg-[#1f644e] group-hover:bg-[#17503e]'}`}
                >
                  {isUploading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Upload size={20} />
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold mt-6 ${isActionDisabled ? 'text-[#7c8e88]' : 'text-[#1f644e]'}`}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  disabled={isActionDisabled}
                  onChange={handleFileUpload}
                />
              </label>
            </>
          )}
        </div>
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {(showAddDrive || showAddFolder) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => {
                setShowAddDrive(false);
                setShowAddFolder(false);
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-[#fcfbf5] w-full max-w-sm rounded-xl border border-[#e5e3d8] shadow-2xl p-5"
            >
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

                    {/* CUSTOM DROPDOWN FOR PROVIDER */}
                    <div className="relative z-50">
                      <div
                        onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
                        className="border border-[#1f644e] rounded-lg px-3 py-2 bg-[#f0f5f2] cursor-pointer"
                      >
                        <div className="text-[10px] text-[#1f644e] font-bold">Provider</div>
                        <div className="w-full bg-transparent outline-none font-bold text-sm flex items-center justify-between mt-0.5">
                          <span className="text-[#1e3a34]">
                            {newDriveProvider === 'uploadthing'
                              ? 'UploadThing'
                              : newDriveProvider === 'cloudinary'
                                ? 'Cloudinary'
                                : 'AWS S3'}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`text-[#1f644e] transition-transform duration-200 ${isProviderDropdownOpen ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </div>

                      <AnimatePresence>
                        {isProviderDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsProviderDropdownOpen(false);
                              }}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-[#e5e3d8] rounded-xl shadow-xl py-1 overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setNewDriveProvider('uploadthing');
                                  setIsProviderDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm font-bold text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors flex items-center justify-between cursor-pointer"
                              >
                                UploadThing
                                {newDriveProvider === 'uploadthing' && (
                                  <Check size={16} className="text-[#1f644e]" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewDriveProvider('cloudinary');
                                  setIsProviderDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm font-bold text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors flex items-center justify-between cursor-pointer"
                              >
                                Cloudinary
                                {newDriveProvider === 'cloudinary' && (
                                  <Check size={16} className="text-[#1f644e]" />
                                )}
                              </button>
                              <button
                                type="button"
                                disabled
                                className="w-full text-left px-4 py-3 text-sm font-bold text-[#7c8e88] flex items-center justify-between opacity-60 cursor-not-allowed bg-[#fcfbf5]"
                              >
                                AWS S3
                                <span className="text-[9px] uppercase tracking-wider bg-[#e5e3d8] text-[#1e3a34] px-2 py-0.5 rounded-full">
                                  Soon
                                </span>
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="border border-[#1f644e] rounded-lg px-3 py-2 bg-[#f0f5f2]">
                      <div className="text-[10px] text-[#1f644e] font-bold">
                        {newDriveProvider === 'cloudinary'
                          ? 'Connection String (CLOUDINARY_URL)'
                          : 'API Token'}
                      </div>
                      <input
                        required
                        type="password"
                        value={newDriveToken}
                        onChange={(e) => setNewDriveToken(e.target.value)}
                        placeholder={
                          newDriveProvider === 'cloudinary' ? 'cloudinary://...' : 'sk_live_...'
                        }
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
