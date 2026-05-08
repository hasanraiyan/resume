import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Hook to manage course data fetching, progress tracking, and context.
 * @param {string} courseId - The ID or slug of the course.
 * @param {boolean} isAdmin - Whether to use the internal admin API.
 */
export function useCourseReader(courseId, isAdmin = false) {
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [modules, setModules] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [showOverview, setShowOverview] = useState(true);
  const [visited, setVisited] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Sections ordered by module position then section position within the module.
  // This is the correct order for prev/next navigation — the raw `sections` array
  // uses a global `order` field where each module independently starts at 0/1,
  // causing cross-module collisions when sorted naively.
  const orderedSections = useMemo(() => {
    if (!modules.length) return [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const sortedModules = [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const result = [];
    for (const mod of sortedModules) {
      const modSections = sections
        .filter((s) => s.moduleId === mod._id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      result.push(...modSections);
    }
    // Append any sections not assigned to a module
    const unassigned = sections
      .filter((s) => !s.moduleId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    result.push(...unassigned);
    return result;
  }, [sections, modules]);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    try {
      setIsLoading(true);
      const baseUrl = isAdmin ? '/api/coursify/courses' : '/api/coursify/public/courses';
      const res = await fetch(`${baseUrl}/${courseId}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.course);
        setSections(data.sections);
        setModules(data.modules || []);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, isAdmin]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // Expose current section context to external tools (like ChatbotWidget)
  useEffect(() => {
    if (!activeSection || !sections.length) return;
    const section = sections.find((s) => s._id === activeSection);
    if (section) {
      window.__coursifyCtx = {
        sectionId: section._id,
        sectionTitle: section.title,
        sectionSummary: section.summary || '',
      };
    }
    return () => {
      delete window.__coursifyCtx;
    };
  }, [activeSection, sections]);

  const markVisited = (sectionId) => {
    if (!sectionId) return;
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
  };

  const navigateTo = (sectionId) => {
    if (activeSection) markVisited(activeSection);
    setShowOverview(false);
    setActiveSection(sectionId);
  };

  const showOverviewPage = () => {
    setShowOverview(true);
    setActiveSection(null);
  };

  return {
    course,
    sections,
    orderedSections,
    modules,
    activeSection,
    showOverview,
    visited,
    isLoading,
    notFound,
    navigateTo,
    showOverviewPage,
    markVisited,
    setActiveSection,
    setShowOverview,
  };
}
