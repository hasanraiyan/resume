import { useState, useEffect } from 'react';

/**
 * Hook to manage Reader UI states like sidebar, toc, and module expansion.
 * @param {Array} modules - List of modules to initialize expansion state.
 * @param {string} activeUnitId - Current active unit to auto-expand modules.
 * @param {Array} units - List of units to find parent module.
 */
export function useReaderUI(modules = [], activeUnitId = null, units = []) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState(new Set());

  // Initialize expanded modules when modules are loaded
  useEffect(() => {
    if (modules.length > 0 && expandedModules.size === 0) {
      setExpandedModules(new Set(modules.map((m) => m._id || m.id)));
    }
  }, [modules]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expand module when unit changes
  useEffect(() => {
    if (activeUnitId && units.length > 0) {
      const unit = units.find((u) => (u._id || u.id) === activeUnitId);
      if (unit?.moduleId) {
        setExpandedModules((prev) => {
          if (prev.has(unit.moduleId)) return prev;
          const next = new Set(prev);
          next.add(unit.moduleId);
          return next;
        });
      }
    }
  }, [activeUnitId, units]);

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleToc = () => setTocOpen((v) => !v);

  return {
    sidebarOpen,
    tocOpen,
    expandedModules,
    toggleModule,
    toggleSidebar,
    closeSidebar,
    toggleToc,
    setSidebarOpen,
    setTocOpen,
  };
}
