'use client';

import Link from 'next/link';
import { Database, HardDrive, Plus, Trash2, ArrowLeft } from 'lucide-react';

export default function VaultlyNavigation({
  drives,
  activeDrive,
  setActiveDrive,
  setShowAddDrive,
  handleDeleteDrive,
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#e5e3d8] fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-[#e5e3d8]">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-[#1f644e] flex items-center justify-center shadow-sm">
              <Database size={18} className="text-white" />
            </div>
            <h1 className="font-[family-name:var(--font-logo)] text-2xl text-black">Vaultly</h1>
          </div>
        </div>

        <div className="flex-1 px-3 space-y-6 overflow-y-auto pb-4 mt-4">
          <div>
            <div className="flex items-center justify-between px-4 mb-2">
              <h3 className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest">
                Your Drives
              </h3>
              <button
                onClick={() => setShowAddDrive(true)}
                className="p-1 hover:bg-[#f0f5f2] rounded-md text-[#1f644e] transition-colors"
                title="Add Drive"
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>

            <nav className="space-y-1">
              {drives.length === 0 ? (
                <p className="px-4 py-3 text-xs text-[#7c8e88] italic">No drives configured.</p>
              ) : (
                drives.map((drive) => (
                  <div
                    key={drive._id}
                    onClick={() => setActiveDrive(drive._id)}
                    className={`group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all ${
                      activeDrive === drive._id
                        ? 'bg-[#1f644e] text-white'
                        : 'text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1e3a34]'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <HardDrive size={18} strokeWidth={activeDrive === drive._id ? 2 : 1.5} />
                      <span className="truncate text-sm font-bold">{drive.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDrive(drive._id, e);
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all ${
                        activeDrive === drive._id
                          ? 'hover:bg-white/20 text-white'
                          : 'hover:bg-red-50 text-red-500'
                      }`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-[#e5e3d8]">
          <p className="text-[10px] text-[#7c8e88] text-center font-medium">Multi-Cloud Storage</p>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay and Content) */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Content */}
          <aside className="relative w-72 max-w-[80vw] bg-[#fcfbf5] h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b border-[#e5e3d8]">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-[#1f644e] flex items-center justify-center shadow-sm">
                  <Database size={18} className="text-white" />
                </div>
                <h1 className="font-[family-name:var(--font-logo)] text-2xl text-black">Vaultly</h1>
              </div>
            </div>

            <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
              <nav className="space-y-1">
                <div className="flex items-center justify-between px-4 mb-2">
                  <h3 className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest">
                    Your Drives
                  </h3>
                </div>
                {drives.map((drive) => (
                  <button
                    key={drive._id}
                    onClick={() => {
                      setActiveDrive(drive._id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      activeDrive === drive._id
                        ? 'bg-[#1f644e] text-white shadow-lg shadow-[#1f644e]/20'
                        : 'text-[#7c8e88] hover:bg-[#f0f5f2]'
                    }`}
                  >
                    <HardDrive size={18} />
                    <span className="text-sm font-bold">{drive.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowAddDrive(true);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[#1f644e] hover:bg-[#f0f5f2] transition-all"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span className="text-sm font-bold">Add New Drive</span>
                </button>
              </nav>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
