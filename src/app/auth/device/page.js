'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DeviceAuthPage() {
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, authorized, denied, error
  const router = useRouter();

  const handleAction = async (action) => {
    if (!userCode || userCode.length < 4) {
      toast.error('Please enter a valid code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/device/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCode, action }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
        if (data.status === 'authorized') {
          toast.success('Device authorized successfully!');
        } else {
          toast.info('Access denied for the device.');
        }
      } else {
        toast.error(data.error || 'Failed to process request');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'authorized') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfbf5] p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <h1 className="text-3xl font-bold text-[#1f644e] mb-4 font-pacifico">Success!</h1>
          <p className="text-gray-600 mb-6">
            Your device has been authorized. You can now close this window and return to your terminal.
          </p>
          <button
            onClick={() => router.push('/coursify')}
            className="px-6 py-2 bg-[#1f644e] text-white rounded-lg hover:bg-[#164a3a] transition-colors"
          >
            Go to Coursify
          </button>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfbf5] p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <h1 className="text-3xl font-bold text-red-600 mb-4 font-pacifico">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            The authorization request was denied.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfbf5] p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <h1 className="text-3xl font-bold text-[#1f644e] mb-2 font-pacifico text-center">Device Login</h1>
        <p className="text-gray-500 text-center mb-8">
          Enter the code displayed on your device to authorize access to your Coursify account.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Authorization Code</label>
            <input
              type="text"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value.toUpperCase())}
              placeholder="ABCD-1234"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-[#1f644e] focus:border-transparent outline-none transition-all"
              maxLength={12}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAction('deny')}
              disabled={loading}
              className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Deny
            </button>
            <button
              onClick={() => handleAction('authorize')}
              disabled={loading || !userCode}
              className="px-6 py-3 bg-[#1f644e] text-white rounded-xl hover:bg-[#164a3a] transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? 'Processing...' : 'Authorize'}
            </button>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-400 text-center">
          Make sure the code matches the one shown in your terminal.
        </p>
      </div>
    </div>
  );
}
