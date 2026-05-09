import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Hook to manage course data fetching, progress tracking, and context.
 * @param {string} courseId - The ID or slug of the course.
 * @param {boolean} isAdmin - Whether to use the internal admin API.
 */
export function useCourseReader(courseId, isAdmin = false) {
  const [course, setCourse] = useState(null);
  const [units, setUnits] = useState([]);
  const [modules, setModules] = useState([]);
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [showOverview, setShowOverview] = useState(true);
  const [visited, setVisited] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Units ordered by module position then unit position within the module.
  const orderedUnits = useMemo(() => {
    if (!modules.length) return [...units].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const sortedModules = [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const result = [];
    for (const mod of sortedModules) {
      const modUnits = units
        .filter((u) => u.moduleId === mod.id || u.moduleId === mod._id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      result.push(...modUnits);
    }
    // Append any units not assigned to a module
    const unassigned = units
      .filter((u) => !u.moduleId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    result.push(...unassigned);
    return result;
  }, [units, modules]);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    try {
      setIsLoading(true);
      const baseUrl = isAdmin ? '/api/coursify/courses' : '/api/coursify/public/courses';
      const res = await fetch(`${baseUrl}/${courseId}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.course);
        setUnits(data.units || []);
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

  // Expose current unit context to external tools (like ChatbotWidget)
  useEffect(() => {
    if (!activeUnitId || !units.length) return;
    const unit = units.find((u) => (u.id || u._id) === activeUnitId);
    if (unit) {
      window.__coursifyCtx = {
        unitId: unit.id || unit._id,
        unitTitle: unit.title,
        unitSummary: unit.summary || '',
      };
    }
    return () => {
      delete window.__coursifyCtx;
    };
  }, [activeUnitId, units]);

  const markVisited = (unitId) => {
    if (!unitId) return;
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(unitId);
      return next;
    });
  };

  const navigateTo = (unitId) => {
    if (activeUnitId) markVisited(activeUnitId);
    setShowOverview(false);
    setActiveUnitId(unitId);
  };

  const showOverviewPage = () => {
    setShowOverview(true);
    setActiveUnitId(null);
  };

  return {
    course,
    units,
    orderedUnits,
    modules,
    activeUnitId,
    showOverview,
    visited,
    isLoading,
    notFound,
    navigateTo,
    showOverviewPage,
    markVisited,
    setActiveUnitId,
    setShowOverview,
  };
}
