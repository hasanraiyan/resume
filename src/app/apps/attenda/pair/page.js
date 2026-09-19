'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Smartphone, CheckCircle2, QrCode, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function PairPageContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  return (
    <div className="min-h-screen bg-[#fcfbf5] flex flex-col items-center justify-center p-4">
      <div className="bg-white border border-[#e5e3d8] rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1f644e]/10 text-[#1f644e] flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-[#1e3a34] mb-2">Attenda Device Pairing</h1>
        <p className="text-sm text-[#7c8e88] mb-6">
          Pair your Android device to securely track college attendance on the go.
        </p>

        {code ? (
          <div className="bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-4 h-4 text-[#1f644e]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                Pairing Code Detected
              </span>
            </div>
            <code className="text-xs font-mono text-[#1e3a34] break-all bg-white px-2.5 py-1.5 rounded-lg border border-[#e5e3d8] block">
              {code}
            </code>
            <p className="text-[11px] text-[#7c8e88] mt-2">
              Open the <strong>Attenda Android App</strong> and scan the QR code from the web
              dashboard to complete pairing automatically.
            </p>
          </div>
        ) : (
          <div className="bg-[#fcfbf5] border border-[#e5e3d8] rounded-xl p-4 mb-6 text-sm text-[#7c8e88]">
            No pairing code found in the URL. Please scan the QR code directly using the Attenda
            Android app.
          </div>
        )}

        <div className="space-y-2">
          <Link
            href="/apps/attenda"
            className="w-full bg-[#1f644e] text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors flex items-center justify-center gap-2"
          >
            <span>Open Attenda Web Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PairPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fcfbf5] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#1f644e]/30 border-t-[#1f644e] rounded-full animate-spin" />
        </div>
      }
    >
      <PairPageContent />
    </Suspense>
  );
}
