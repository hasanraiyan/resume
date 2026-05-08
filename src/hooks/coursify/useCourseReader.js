import { useState, useCallback, useEffect } from 'react';

export function useCourseReader(id, isPublic = true) {
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [modules, setModules] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [showOverview, setShowOverview] = useState(true);
  const [visited, setVisited] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchCourse = useCallback(
    async (silent = false) => {
      try {
        if (silent) setIsRefreshing(true);
        else setIsLoading(true);

        const baseUrl = isPublic ? '/api/coursify/public/courses' : '/api/coursify/courses';
        const res = await fetch(`${baseUrl}/${id}`);
        const data = await res.json();

        if (data.success) {
          setCourse(data.course);
          setSections(data.sections);
          setModules(data.modules || []);
          return data;
        } else {
          setError(data.error || 'Failed to load course');
          return null;
        }
      } catch (err) {
        setError('Connection error');
        return null;
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [id, isPublic]
  );

  const navigateTo = (sectionId) => {
    if (activeSection) setVisited((v) => new Set(v).add(activeSection));
    setShowOverview(false);
    setActiveSection(sectionId);
  };

  const showOverviewPage = () => {
    setShowOverview(true);
    setActiveSection(null);
  };

  return {
    course,
    setCourse,
    sections,
    setSections,
    modules,
    setModules,
    activeSection,
    setActiveSection,
    showOverview,
    setShowOverview,
    visited,
    setVisited,
    isLoading,
    isRefreshing,
    error,
    fetchCourse,
    navigateTo,
    showOverviewPage,
  };
}
