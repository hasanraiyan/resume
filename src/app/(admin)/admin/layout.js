'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import SessionProvider from '@/components/SessionProvider';
import CustomCursor from '@/components/CustomCursor';
import { Button } from '@/components/ui';

function AdminLayoutContent({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) router.push('/login'); // Not logged in
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-black border-t-transparent mx-auto"></div>
          <p className="mt-4 text-neutral-600 font-['Space_Grotesk']">Loading admin...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <>
      <CustomCursor />
      <div className="min-h-screen bg-neutral-50 font-['Space_Grotesk']">
        {/* Admin Header */}
        <header className="bg-white border-b-2 border-black">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Logo/Brand */}
              <div className="flex items-center space-x-8">
                <Link href="/admin/dashboard" className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <h1 className="text-2xl font-bold text-black font-['Playfair_Display']">Admin</h1>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex space-x-1">
                  <Link
                    href="/admin/dashboard"
                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 rounded transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/sections"
                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 rounded transition-colors"
                  >
                    Manage Sections
                  </Link>
                  <Link
                    href="/admin/projects"
                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 rounded transition-colors"
                  >
                    Projects
                  </Link>
                  <Link
                    href="/admin/contacts"
                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 rounded transition-colors"
                  >
                    Messages
                  </Link>
                  <Link
                    href="/admin/chatbot"
                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 rounded transition-colors"
                  >
                    Chatbot Settings
                  </Link>
                  <Link
                    href="/admin/chatbot/logs"
                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 rounded transition-colors"
                  >
                    Chat Logs
                  </Link>
                </nav>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                <Button
                  href="/"
                  variant="ghost"
                  size="small"
                  className="hidden sm:inline-flex text-xs"
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  View Site
                </Button>

                <div className="flex items-center space-x-3">
                  <span className="text-sm text-neutral-600 hidden sm:block">
                    {session?.user?.name || 'Admin'}
                  </span>
                  <Button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    variant="ghost"
                    size="small"
                    className="text-neutral-600 hover:text-black"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">{children}</main>
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
