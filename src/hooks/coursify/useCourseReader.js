import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [visited, setVisited] = useState(new Set(activeSectionId ? [activeSectionId] : []));
  const [isLoading, setIsLoading] = useState(!initialData);
  const [notFound, setNotFound] = useState(false);

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
