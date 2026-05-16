'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SmallClawPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/apps/smallclaw/agents');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#1f644e] border-t-transparent"></div>
    </div>
  );
}
