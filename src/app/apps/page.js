'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, Badge, Button } from '@/components/ui';
import { MINI_APPS } from '@/config/apps';
import { useInstalledApps } from '@/hooks/useInstalledApps';

export const metadata = {
  title: 'Apps | Raiyan Hasan',
  description: 'Explore mini productivity apps: SnapLinks, Pocketly, and Taskly.',
};

export default function AppsIndexPage() {
  const { installed, install, uninstall, isInstalled } = useInstalledApps();

  return (
    <main className="min-h-screen bg-[#FAFAF9] selection:bg-neutral-800 selection:text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-neutral-900 tracking-tight mb-4">
            Apps
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl font-sans">
            A focused suite of mini apps I built for everyday work: links, tasks, and money. Install
            what you need and launch it instantly, right in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MINI_APPS.map((app) => {
            const installedFlag = isInstalled(app.id);
            return (
              <Card
                key={app.id}
                className="h-full p-6 md:p-7 flex flex-col border-2 border-neutral-200 bg-white hover:border-neutral-900 transition-all duration-300 group hover:shadow-[8px_8px_0px_0px_rgba(23,23,23,1)]"
              >
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl overflow-hidden bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <img
                        src={app.iconSrc}
                        alt={`${app.name} icon`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-serif font-bold text-neutral-900 leading-tight">
                        {app.name}
                      </h2>
                      <p className="text-[11px] text-neutral-500">Mini app</p>
                    </div>
                  </div>
                  <Badge variant="soft" className="text-[10px] uppercase tracking-widest">
                    {app.category}
                  </Badge>
                </div>

                <p className="text-sm text-neutral-600 font-sans mb-6 flex-1">{app.tagline}</p>

                <div className="flex items-center justify-between gap-3 mt-2">
                  <Link
                    href={app.href}
                    className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-neutral-900 group-hover:translate-x-1 transition-transform"
                  >
                    {installedFlag ? 'Open App' : 'Launch'}
                    <svg
                      className="w-3.5 h-3.5 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>

                  <Button
                    type="button"
                    variant={installedFlag ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => (installedFlag ? uninstall(app.id) : install(app.id))}
                  >
                    {installedFlag ? 'Uninstall' : 'Install'}
                  </Button>
                </div>

                {installed.includes(app.id) && (
                  <p className="mt-2 text-[11px] text-neutral-500 font-sans">
                    Installed locally for this browser.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <Footer />
    </main>
  );
}
