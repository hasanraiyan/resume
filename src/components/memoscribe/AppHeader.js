'use client';

import React from 'react';

export default function AppHeader() {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#fcfbf5] border-b border-[#e5e3d8] h-14 flex items-center px-4">
      <h1 className="font-[family-name:var(--font-logo)] text-xl text-[#1f644e]">Memo Scribe</h1>
    </header>
  );
}
