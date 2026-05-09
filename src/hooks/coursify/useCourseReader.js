import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Two calling modes:
 *   Public SSR:  useCourseReader({ initialData, slug, activeSectionId })
 *   Admin fetch: useCourseReader(courseId, isAdmin = true)
 */
export function useCourseReader(courseIdOrConfig, isAdmin = false) {
  const router = useRouter();

  const isConfig = typeof courseIdOrConfig === 'object' && courseIdOrConfig !== null;
  const { initialData, slug, activeSectionId } = isConfig ? courseIdOrConfig : {};
  const courseId = isConfig ? slug : courseIdOrConfig;

  const [course, setCourse] = useState(initialData?.course ?? null);
  const [sections, setSections] = useState(initialData?.sections ?? []);
  const [modules, setModules] = useState(initialData?.modules ?? []);
  const [activeSection, setActiveSection] = useState(activeSectionId ?? null);
  const [showOverview, setShowOverview] = useState(!activeSectionId);
  const [visited, setVisited] = useState(new Set());
  const [isLoading, setIsLoading] = useState(!initialData);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Track fetching state to prevent loops
  const inFlightRef = useRef(new Set());
  const loadedRef = useRef(new Set());

  // Initialize loadedRef with sections that already have content (from SSR)
  useEffect(() => {
    if (sections.length > 0) {
      sections.forEach((s) => {
        if (s.blocks?.length > 0) {
          loadedRef.current.add(s._id);
        }
      });
    }
  }, [sections]);

  useEffect(() => {
    if (initialData) {
      setCourse(initialData.course);
      setSections(initialData.sections);
      setModules(initialData.modules);
      setActiveSection(activeSectionId || null);
      setShowOverview(!activeSectionId);

      // Clear refs for new initial data (public routing)
      inFlightRef.current.clear();
      loadedRef.current.clear();

      if (initialData.sections) {
        initialData.sections.forEach((s) => {
          if (s.blocks?.length > 0) loadedRef.current.add(s._id);
        });
      }
    }
  }, [initialData, activeSectionId]);

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
    const unassigned = sections
      .filter((s) => !s.moduleId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    result.push(...unassigned);
    return result;
  }, [sections, modules]);

  const fetchSectionContent = useCallback(
    async (sectionId) => {
      if (!sectionId || inFlightRef.current.has(sectionId) || loadedRef.current.has(sectionId)) {
        return;
      }

      inFlightRef.current.add(sectionId);
      try {
        setSectionLoading(true);
        const baseUrl = isAdmin ? '/api/coursify/sections' : '/api/coursify/public/sections';
        const res = await fetch(`${baseUrl}/${sectionId}`);
        const data = await res.json();
        if (data.success) {
          setSections((prev) =>
            prev.map((s) => (s._id === sectionId ? { ...s, blocks: data.section.blocks } : s))
          );
          loadedRef.current.add(sectionId);
        }
      } catch (err) {
        console.error('Lazy load failed:', err);
      } finally {
        inFlightRef.current.delete(sectionId);
        setSectionLoading(false);
      }
    },
    [isAdmin]
  );

  const fetchCourse = useCallback(async () => {
    if (!courseId || initialData) return;
    try {
      setIsLoading(true);
      const baseUrl = isAdmin ? '/api/coursify/courses' : '/api/coursify/public/courses';
      const res = await fetch(`${baseUrl}/${courseId}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.course);
        setSections(data.sections);
        setModules(data.modules || []);
        // Reset fetch tracking on full refresh
        inFlightRef.current.clear();
        loadedRef.current.clear();
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, isAdmin, initialData]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // Load visited from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && courseId) {
      const saved = localStorage.getItem(`coursify_visited_${courseId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setVisited(new Set(parsed));
          }
        } catch (e) {
          console.error('Failed to parse visited sections', e);
        }
      }
    }
  }, [courseId]);

  // Save visited to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && courseId && visited.size > 0) {
      localStorage.setItem(`coursify_visited_${courseId}`, JSON.stringify(Array.from(visited)));
    }
  }, [courseId, visited]);

  useEffect(() => {
    if (activeSection) {
      const section = sections.find((s) => s._id === activeSection);
      const isLoaded = loadedRef.current.has(activeSection) || section?.blocks?.length > 0;

      if (!isLoaded && !inFlightRef.current.has(activeSection)) {
        fetchSectionContent(activeSection);
      }
    }
  }, [activeSection, fetchSectionContent, sections]);

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

  const markVisited = useCallback((sectionId) => {
    if (!sectionId) return;
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
  }, []);

  const navigateTo = useCallback(
    (sectionId) => {
      if (activeSection) markVisited(activeSection);
      setShowOverview(false);
      setActiveSection(sectionId);
      if (!isAdmin && slug) {
        router.push(`/coursify/${slug}/${sectionId}`, { scroll: false });
      }
    },
    [activeSection, slug, isAdmin, router, markVisited]
  );

  const showOverviewPage = useCallback(() => {
    setShowOverview(true);
    setActiveSection(null);
    if (!isAdmin && slug) {
      router.push(`/coursify/${slug}`, { scroll: false });
    }
  }, [slug, isAdmin, router]);

  const refresh = useCallback(() => {
    fetchCourse();
  }, [fetchCourse]);

  return {
    course,
    sections,
    orderedSections,
    modules,
    activeSection,
    showOverview,
    visited,
    isLoading,
    sectionLoading,
    notFound,
    navigateTo,
    showOverviewPage,
    markVisited,
    setActiveSection,
    setShowOverview,
    refresh,
  };
}
