'use client';

// Single-user "install" state persisted in localStorage.

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'installedMiniApps';

export function useInstalledApps() {
  const [installed, setInstalled] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setInstalled(parsed);
    } catch {
      // ignore corrupt data
    }
  }, []);

  const persist = (next) => {
    setInstalled(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  const install = (id) => {
    if (installed.includes(id)) return;
    persist([...installed, id]);
  };

  const uninstall = (id) => {
    if (!installed.includes(id)) return;
    persist(installed.filter((x) => x !== id));
  };

  const isInstalled = (id) => installed.includes(id);

  return { installed, install, uninstall, isInstalled };
}
