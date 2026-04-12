'use client';

import Link from 'next/link';
import { Database, HardDrive, Plus, Trash2, ArrowLeft, Menu } from 'lucide-react';

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
            <div className="w-7 h-7 rounded-xl bg-[#1f644e] flex items-center justify-center shadow-sm text-white">
              <Database className="w-4 h-4" />
            </div>
            <h1 className="font-[family-name:var(--font-logo)] text-2xl text-black">Vaultly</h1>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-4 mb-2 flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest">
              Your Drives
            </h3>
            <button
              onClick={() => setShowAddDrive(true)}
              className="text-[#7c8e88] hover:text-[#1e3a34] transition cursor-pointer"
              title="Add Drive"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {drives.length === 0 ? (
              <p className="px-4 py-2 text-xs text-[#7c8e88] italic">No drives configured</p>
            ) : (
              drives.map((drive) => (
                <div
                  key={drive._id}
                  onClick={() => setActiveDrive(drive._id)}
                  className={`group cursor-pointer flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                    activeDrive === drive._id
                      ? 'bg-[#1f644e] text-white'
                      : 'text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1e3a34]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <HardDrive
                      className="w-5 h-5"
                      strokeWidth={activeDrive === drive._id ? 2 : 1.5}
                    />
                    <span className="truncate">{drive.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDrive(drive._id, e);
                    }}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all ${
                      activeDrive === drive._id
                        ? 'hover:bg-white/20 text-white'
                        : 'hover:bg-red-50 text-[#c94c4c]'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-[#e5e3d8]">
          <p className="text-[10px] text-[#7c8e88] text-center">Powered by Vaultly</p>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          <aside className="relative w-72 max-w-[80vw] bg-[#fcfbf5] h-full shadow-2xl flex flex-col">
            <div className="p-6 border-b border-[#e5e3d8]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#1f644e] flex items-center justify-center shadow-sm text-white">
                  <Database className="w-4 h-4" />
                </div>
                <h1 className="font-[family-name:var(--font-logo)] text-2xl text-black">Vaultly</h1>
              </div>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              <div className="px-4 mb-2 flex items-center justify-between">
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-bold transition-all ${
                    activeDrive === drive._id
                      ? 'bg-[#1f644e] text-white shadow-lg'
                      : 'text-[#7c8e88]'
                  }`}
                >
                  <HardDrive className="w-5 h-5" />
                  <span className="truncate">{drive.name}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  setShowAddDrive(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-bold text-[#1f644e] hover:bg-[#f0f5f2] transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Add New Drive</span>
              </button>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
