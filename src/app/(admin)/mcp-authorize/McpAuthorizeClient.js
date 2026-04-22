'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';

export default function McpAuthorizeClient({ pending }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const scopes = (pending.scope || '').split(' ').filter(Boolean);
  const isSnaplinks = scopes.includes('snaplinks');
  const isPocketly = scopes.includes('pocketly');

  const apps = [];
  if (isPocketly) {
    apps.push({
      name: 'Pocketly',
      description: 'Track your personal finances, manage accounts, and analyze spending.',
      icon: '/images/apps/pocketly.png',
    });
  }
  if (isSnaplinks) {
    apps.push({
      name: 'SnapLinks',
      description: 'Manage your short links and view click analytics.',
      icon: '/images/apps/Snaplinks.png',
    });
  }

  const hasValidScopes = apps.length > 0;

  const handleAuthorize = async () => {
    if (!hasValidScopes) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/mcp/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error_description || data.error || 'Authorization failed');
        setIsLoading(false);
        return;
      }

      window.location.href = data.redirectTo;
    } catch (err) {
      console.error('Auth error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    const callbackUrl = new URL(pending.redirectUri);
    callbackUrl.searchParams.set('error', 'access_denied');
    callbackUrl.searchParams.set(
      'error_description',
      'The user declined the authorization request or no scopes were provided.'
    );
    if (pending.state) callbackUrl.searchParams.set('state', pending.state);

    window.location.href = callbackUrl.toString();
  };

  return (
    <div className="max-w-md w-full space-y-8">
      {/* Header */}
      <div className="text-center">
        {hasValidScopes ? (
          <div className="flex justify-center -space-x-4 mb-8">
            {apps.map((app) => (
              <div
                key={app.name}
                className="w-20 h-20 bg-white rounded-xl shadow-md border border-neutral-100 flex items-center justify-center overflow-hidden z-10 first:z-20 relative"
              >
                <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto w-20 h-20 bg-red-50 rounded-xl flex items-center justify-center mb-8 border-2 border-dashed border-red-200">
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        )}

        <h2 className="text-3xl font-bold text-black font-['Playfair_Display'] mb-2 px-4">
          {hasValidScopes
            ? `Authorize ${apps.map((a) => a.name).join(' & ')} Access`
            : 'Invalid Request'}
        </h2>
        <p className="text-neutral-600 text-sm sm:text-base px-6">
          {hasValidScopes
            ? 'An AI client is requesting access to your data.'
            : 'The requesting application did not specify any valid permissions.'}
        </p>
      </div>

      <Card className="p-8 space-y-6">
        {hasValidScopes ? (
          <>
            <div className="space-y-4">
              {apps.map((app) => (
                <div
                  key={app.name}
                  className="bg-neutral-50 rounded-lg p-4 border border-neutral-100"
                >
                  <h3 className="font-semibold text-black mb-1">{app.name}</h3>
                  <p className="text-sm text-neutral-600">{app.description}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">
                Requested Permissions:
              </p>
              <ul className="text-sm text-neutral-700 space-y-2">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Read your {apps.map((a) => a.name.toLowerCase()).join(' and ')} records
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Create and update {apps.map((a) => a.name.toLowerCase()).join(' and ')} data
                </li>
              </ul>
            </div>
          </>
        ) : (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-center">
            <p className="text-sm text-red-800 font-medium">
              No scopes selected. Access cannot be granted without explicit permissions.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={handleAuthorize}
            disabled={isLoading || !hasValidScopes}
            variant="primary"
            className="w-full py-3 font-semibold"
          >
            {isLoading ? 'Authorizing...' : 'Authorize Access'}
          </Button>
          <Button
            onClick={handleDecline}
            disabled={isLoading}
            variant="outline"
            className="w-full py-3 font-semibold"
          >
            {hasValidScopes ? 'Decline' : 'Go Back'}
          </Button>
        </div>
      </Card>

      <p className="text-center text-xs text-neutral-400 px-4 leading-relaxed">
        Only authorize clients you trust. You can revoke access at any time from your admin
        dashboard.
      </p>
    </div>
  );
}
