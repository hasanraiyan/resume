'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SessionProvider from '@/components/SessionProvider';
import CustomCursor from '@/components/CustomCursor';
import { Button } from '@/components/ui';

function AdminLayoutContent({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/login');
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-900 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading admin...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: 'fas fa-tachometer-alt' },
    { name: 'Manage Sections', href: '/admin/sections', icon: 'fas fa-cog' },
    { name: 'Media Library', href: '/admin/media', icon: 'fas fa-images' },
    { name: 'Projects', href: '/admin/projects', icon: 'fas fa-folder' },
    { name: 'Services', href: '/admin/services', icon: 'fas fa-tools' },
    { name: 'Articles', href: '/admin/articles', icon: 'fas fa-newspaper' },
    { name: 'Subscribers', href: '/admin/subscribers', icon: 'fas fa-users' },
    { name: 'Messages', href: '/admin/contacts', icon: 'fas fa-envelope' },
    { name: 'Analytics', href: '/admin/analytics', icon: 'fas fa-chart-line' },
    { name: 'Chatbot Settings', href: '/admin/chatbot', icon: 'fas fa-robot' },
    { name: 'Chat Logs', href: '/admin/chatbot/logs', icon: 'fas fa-comments' },
  ];

  return (
    <>
      <CustomCursor />
      <div className="min-h-screen bg-gray-50 font-sans flex">
        {/* Sidebar */}
        <div
          className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-64 lg:w-64 bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        >
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <Link href="/admin/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin</h1>
            </Link>
            <Button
              variant="ghost"
              size="small"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times text-lg"></i>
            </Button>
          </div>
          <nav className="mt-6 px-3 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 touch-manipulation"
                onClick={() => setSidebarOpen(false)}
              >
                <i className={`${item.icon} mr-3 text-gray-400`}></i>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0  z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-64">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
            <div className="px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden"
                  >
                    <i className="fas fa-bars"></i>
                  </Button>
                  <span className="ml-4 text-lg font-semibold text-gray-900 hidden sm:block">
                    Admin Panel
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    href="/"
                    variant="outline"
                    size="small"
                    className="hidden sm:inline-flex text-xs"
                  >
                    <i className="fas fa-external-link-alt mr-2"></i>
                    View Site
                  </Button>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 hidden sm:block">
                      {session?.user?.name || 'Admin'}
                    </span>
                    <Button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      variant="ghost"
                      size="small"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <i className="fas fa-sign-out-alt"></i>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 lg:p-8 bg-gray-50">{children}</main>
        </div>
      </div>
    </>
  );
}

export default function AdminLayout({ children }) {
  return (
    <SessionProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SessionProvider>
  );
}
