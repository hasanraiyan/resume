import { useState, useEffect, useCallback } from 'react';

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
