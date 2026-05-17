'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  ChevronDown,
  FileUp,
  Settings,
  Cpu,
  Trash2,
  TrendingUp,
  FileText,
  Users,
} from 'lucide-react';
import { useCoursify } from '@/context/CoursifyContext';
import { cn } from '@/utils/classNames';
import { useRef, useEffect } from 'react';

export function CoursifyNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { refresh, globalSearch, setGlobalSearch, setShowCreateModal, setShowImportModal } =
    useCoursify();

  const inputRef = useRef(null);

  const navLinks = [
    { id: 'courses', label: 'Course Library', href: '/apps/coursify', icon: GraduationCap },
    { id: 'analytics', label: 'Intelligence', href: '/apps/coursify/analytics', icon: TrendingUp },
    { id: 'history', label: 'All Artifacts', href: '/apps/coursify/artifacts', icon: FileText },
    { id: 'leads', label: 'Waitlist', href: '/apps/coursify/waitlist', icon: Users },
  ];

  const activeLink = navLinks.find((link) => link.href === pathname) || navLinks[0];

  const handleSearch = (e) => {
    e.preventDefault();
    // Global search is handled via context, individual pages can consume it
  };

  return (
    <header className="sticky top-0 z-40 bg-[#fcfbf5]/80 backdrop-blur-md border-b border-[#e5e3d8] px-4 lg:px-8 py-2 flex items-center justify-between gap-8">
      <div className="flex items-center gap-8 shrink-0">
        <Link
          href="/apps/coursify"
          className="flex items-center gap-2 pr-4 border-r border-[#e5e3d8]"
        >
          <div className="h-8 w-8 bg-[#1f644e] rounded-lg flex items-center justify-center shadow-sm">
            <GraduationCap className="text-white w-4.5 h-4.5" />
          </div>
          <span className="font-[family-name:var(--font-logo)] text-xl hidden lg:block text-[#1e3a34]">
            Coursify
          </span>
        </Link>

        {/* Desktop App Style Menu Bar */}
        <nav className="hidden md:flex items-center gap-1">
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1f644e] transition-colors cursor-default group-hover:bg-[#f0f5f2] group-hover:text-[#1f644e]">
              <Settings className="w-3 h-3" />
              Manage
              <ChevronDown className="w-3 h-3 opacity-50 group-hover:rotate-180 transition-transform duration-200" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#e5e3d8] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Course
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] rounded-lg transition-colors"
              >
                <FileUp className="w-3.5 h-3.5" />
                Import Bundle
              </button>
            </div>
          </div>

          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1f644e] transition-colors cursor-default group-hover:bg-[#f0f5f2] group-hover:text-[#1f644e]">
              <Cpu className="w-3 h-3" />
              System
              <ChevronDown className="w-3 h-3 opacity-50 group-hover:rotate-180 transition-transform duration-200" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#e5e3d8] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-colors',
                    pathname === link.href
                      ? 'bg-[#f0f5f2] text-[#1f644e]'
                      : 'text-[#1e3a34] hover:bg-[#f0f5f2]'
                  )}
                >
                  <link.icon className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-[#e5e3d8] my-1 mx-2" />
              <button
                onClick={refresh}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Engine
              </button>
              <button
                onClick={() => router.push('/apps/coursify/trash')}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#1e3a34] hover:bg-red-50 hover:text-[#c94c4c] rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                View Trash
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Search & Profile area */}
      <div className="flex items-center gap-3">
        <div className="max-w-xs hidden lg:block">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8e88]" />
            <input
              ref={inputRef}
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder={
                pathname === '/apps/coursify/analytics'
                  ? 'Filter analytics...'
                  : 'Search courses...'
              }
              className="w-48 bg-white border border-[#e5e3d8] rounded-xl py-1.5 pl-10 pr-4 text-xs outline-none focus:border-[#1f644e] focus:w-64 transition-all text-[#1e3a34]"
            />
          </form>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1f644e] text-white rounded-xl text-xs font-bold hover:bg-[#17503e] active:scale-95 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create</span>
        </button>
      </div>
    </header>
  );
}
