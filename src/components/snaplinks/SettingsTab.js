'use client';

import { Card } from '@/components/ui';

export default function SettingsTab() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 flex flex-col items-center">
      <div className="w-full max-w-2xl text-center mb-4">
        <h2 className="text-2xl font-bold text-[#1e3a34] dark:text-[#e0e0e0] mb-2 font-[family-name:var(--font-sans)]">
          Settings
        </h2>
        <p className="text-[#7c8e88] dark:text-[#a0a0a0]">Configure your SnapLinks preferences.</p>
      </div>

      <Card
        variant="flat"
        className="w-full max-w-2xl p-6 bg-white dark:bg-[#1e1e1e] border border-[#e5e3d8] dark:border-[#333333]"
      >
        <h3 className="text-lg font-bold text-[#1e3a34] dark:text-white mb-4">
          Domain Configuration
        </h3>
        <p className="text-sm text-[#7c8e88] dark:text-[#a0a0a0] mb-6">
          SnapLinks currently uses your default application domain and routes all short links
          through the <code>/r/[slug]</code> path. Custom domain support is coming soon.
        </p>

        <div className="bg-[#fcfbf5] dark:bg-[#121212] p-4 rounded-lg border border-[#e5e3d8] dark:border-[#333333]">
          <label className="block text-sm font-bold text-[#1e3a34] dark:text-white mb-2">
            Base Redirect URL
          </label>
          <input
            type="text"
            disabled
            value={
              typeof window !== 'undefined'
                ? `${window.location.origin}/r/`
                : 'https://yoursite.com/r/'
            }
            className="w-full bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg px-4 py-2 text-neutral-500 cursor-not-allowed"
          />
          <p className="text-xs text-[#7c8e88] dark:text-[#a0a0a0] mt-2">
            This is the base URL automatically applied to all your generated short links.
          </p>
        </div>
      </Card>
    </div>
  );
}
