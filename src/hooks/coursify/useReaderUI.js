import { useState, useEffect } from 'react';

/**
 * Hook to manage Reader UI states like sidebar, toc, and module expansion.
 * @param {Array} modules - List of modules to initialize expansion state.
 * @param {string} activeSection - Current active section to auto-expand modules.
 * @param {Array} sections - List of sections to find parent module.
 */
export function useReaderUI(modules = [], activeSection = null, sections = []) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState(new Set());

  // Initialize expanded modules when modules are loaded
  useEffect(() => {
    if (modules.length > 0 && expandedModules.size === 0) {
      setExpandedModules(new Set(modules.map((m) => m._id)));
    }
  }, [modules]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expand module when section changes
  useEffect(() => {
    if (activeSection && sections.length > 0) {
      const section = sections.find((s) => s._id === activeSection);
      if (section?.moduleId) {
        setExpandedModules((prev) => {
          if (prev.has(section.moduleId)) return prev;
          const next = new Set(prev);
          next.add(section.moduleId);
          return next;
        });
      }
    }
  }, [activeSection, sections]);

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
