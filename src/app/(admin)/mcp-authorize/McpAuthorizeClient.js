'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';

export default function McpAuthorizeClient({ clientName, scope }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAction = async (action) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/mcp/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error_description || data.error || 'Authorization failed');
        setIsLoading(false);
        return;
      }

      window.location.href = data.redirectTo;
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const appName = scope === 'snaplinks' ? 'Snaplinks' : 'Pocketly';

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="p-8 space-y-6">
          <div className="flex justify-center items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-white border border-neutral-200 rounded-xl flex items-center justify-center shadow-sm">
              <svg
                className="w-6 h-6 text-black"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 16v-4m0-4h.01"
                />
              </svg>
            </div>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-neutral-300 rounded-full"></div>
              <div className="w-1 h-1 bg-neutral-300 rounded-full"></div>
              <div className="w-1 h-1 bg-neutral-300 rounded-full"></div>
            </div>
            <div className="w-12 h-12 bg-[#1f644e] rounded-xl flex items-center justify-center shadow-sm">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-black font-['Playfair_Display']">
              Connect {appName}
            </h2>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <span className="text-red-800 font-medium text-sm">{error}</span>
            </div>
          )}

          <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-black mb-1">
                Permissions always respected
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {clientName} is strictly limited to permissions you've explicitly set. Disable
                access anytime to revoke permissions.
              </p>
            </div>

            <hr className="border-neutral-100" />

            <div>
              <h3 className="text-sm font-semibold text-black mb-1">You're in control</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {clientName} always respects your training data preferences. Data from {appName} may
                be used to provide you relevant and useful information.
              </p>
            </div>

            <hr className="border-neutral-100" />

            <div>
              <h3 className="text-sm font-semibold text-black mb-1">
                Connectors may introduce risk
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Connectors are designed to respect your privacy, but sites may attempt to steal your
                data.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              onClick={() => handleAction('authorize')}
              variant="primary"
              disabled={isLoading}
              className="w-full py-3 px-4 font-semibold text-white bg-black hover:bg-neutral-800 rounded-lg flex items-center justify-center transition-colors"
            >
              {isLoading ? 'Processing...' : `Continue to ${appName} ↗`}
            </Button>
            <Button
              onClick={() => handleAction('decline')}
              variant="secondary"
              disabled={isLoading}
              className="w-full py-3 px-4 font-semibold text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors"
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
