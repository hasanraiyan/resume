'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const CoursifyContext = createContext();

export function CoursifyProvider({ children }) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const pollRef = useRef(null);

  const silentRefresh = useCallback(async () => {
    try {
      const res = await fetch('/api/coursify/bootstrap');
      const data = await res.json();
      if (data.success) setCourses(data.courses);
    } catch {}
  }, []);

  const fetchBootstrap = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/coursify/bootstrap');
      const data = await res.json();
      if (data.success) {
        setCourses(data.courses);
      } else {
        toast.error(data.error || 'Failed to load Coursify');
      }
    } catch (error) {
      console.error(error);
      toast.error('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll every 8s while any course is generating a thumbnail
  useEffect(() => {
    const anyGenerating = courses.some((c) => c.thumbnailGenerating);
    if (anyGenerating && !pollRef.current) {
      pollRef.current = setInterval(silentRefresh, 8000);
    } else if (!anyGenerating && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {};
  }, [courses, silentRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchBootstrap();
    }
  }, [session, fetchBootstrap]);

  const createCourse = async (payload) => {
    try {
      const res = await fetch('/api/coursify/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Course created');
        setCourses((prev) => [{ ...data.course, unitCount: 0 }, ...prev]);
        return data.course;
      } else {
        toast.error(data.error || 'Failed to create course');
        return null;
      }
    } catch (error) {
      toast.error('Error creating course');
      return null;
    }
  };

  const updateCourse = async (id, payload) => {
    try {
      const res = await fetch(`/api/coursify/courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setCourses((prev) => prev.map((c) => (c._id === id ? { ...c, ...data.course } : c)));
        return data.course;
      } else {
        toast.error(data.error || 'Failed to update course');
        return null;
      }
    } catch (error) {
      toast.error('Error updating course');
      return null;
    }
  };

  const deleteCourse = async (id) => {
    const prev = [...courses];
    setCourses((c) => c.filter((x) => x._id !== id));
    try {
      const res = await fetch(`/api/coursify/courses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Course deleted');
        return true;
      } else {
        setCourses(prev);
        toast.error(data.error || 'Failed to delete course');
        return false;
      }
    } catch (error) {
      setCourses(prev);
      toast.error('Error deleting course');
      return false;
    }
  };

  const togglePublish = async (id) => {
    try {
      const res = await fetch(`/api/coursify/courses/${id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCourses((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: data.course.status } : c))
        );
        toast.success(
          data.course.status === 'published' ? 'Course published' : 'Course unpublished'
        );
        return data.course;
      } else {
        toast.error(data.error || 'Failed to update status');
        return null;
      }
    } catch (error) {
      toast.error('Error updating status');
      return null;
    }
  };

  return (
    <CoursifyContext.Provider
      value={{
        isLoading,
        courses,
        setCourses,
        createCourse,
        updateCourse,
        deleteCourse,
        togglePublish,
        refresh: fetchBootstrap,
      }}
    >
      {children}
    </CoursifyContext.Provider>
  );
}

export const useCoursify = () => useContext(CoursifyContext);
