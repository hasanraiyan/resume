import { useState } from 'react';

export function useReaderUI(initialModules = []) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState(
    new Set(initialModules.map((m) => m._id))
  );

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const toggleToc = () => setTocOpen((v) => !v);

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const expandModule = (moduleId) => {
    setExpandedModules((prev) => {
      if (prev.has(moduleId)) return prev;
      const next = new Set(prev);
      next.add(moduleId);
      return next;
    });
  };

  return {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    tocOpen,
    setTocOpen,
    toggleToc,
    expandedModules,
    setExpandedModules,
    toggleModule,
    expandModule,
  };
}
