'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/custom-ui';

export default function SettingsTab() {
  const [baseUrl, setBaseUrl] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin.replace(/\/$/, '');
      setBaseUrl(origin);
      setUrl(`${origin}/api/mcp/snaplinks`);
    }
  }, []);

  // No automatic MCP registration from this UI. Show endpoint for admin registration instead.

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 flex flex-col items-center">
      <div className="w-full max-w-2xl text-center mb-4">
        <h2 className="text-2xl font-bold text-[#1e3a34]  mb-2 font-sans">Settings</h2>
        <p className="text-[#7c8e88]">Configure your SnapLinks preferences.</p>
      </div>

      <Card variant="flat" className="w-full max-w-2xl p-6 bg-white  border border-[#e5e3d8] ">
        <h3 className="text-lg font-bold text-[#1e3a34]  mb-4">MCP Server</h3>
        <p className="text-sm text-[#7c8e88]  mb-4">
          MCP endpoint for SnapLinks (copy and register manually in Admin → MCP Servers if desired).
        </p>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">MCP Endpoint</label>
          <div className="flex gap-2">
            <input readOnly value={url} className="w-full mt-1 p-2 border rounded bg-neutral-50" />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(url);
                alert('MCP endpoint copied');
              }}
              className="px-3 py-2 bg-[#1e3a34] text-white rounded"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-[#7c8e88] mt-2">
            If you don't want to register the server, you can skip this step.
          </p>
        </div>
      </Card>
    </div>
  );
}
