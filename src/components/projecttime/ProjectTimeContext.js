'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const ProjectTimeContext = createContext(null);

export function ProjectTimeProvider({ children }) {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [runningTimer, setRunningTimer] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const timerRef = useRef(null);

  // Calculate elapsed time for active running timer
  useEffect(() => {
    if (runningTimer && runningTimer.startTime) {
      const calculateSeconds = () => {
        const start = new Date(runningTimer.startTime).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - start) / 1000));
        setElapsedSeconds(diff);
      };

      calculateSeconds();
      timerRef.current = setInterval(calculateSeconds, 1000);
    } else {
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runningTimer]);

  const fetchBootstrapData = useCallback(async (workspaceId = null) => {
    try {
      setIsLoading(true);
      const url = workspaceId
        ? `/api/projecttime/bootstrap?workspaceId=${workspaceId}`
        : '/api/projecttime/bootstrap';
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setWorkspaces(data.workspaces || []);
        setActiveWorkspace(data.activeWorkspace || null);
        setProjects(data.projects || []);
        setTasks(data.tasks || []);
        setEntries(data.entries || []);
        setRunningTimer(data.runningTimer || null);
      } else {
        toast.error(data.error || 'Failed to load ProjectTime data');
      }
    } catch (error) {
      console.error('Failed to load ProjectTime bootstrap:', error);
      toast.error('Network error loading ProjectTime data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBootstrapData();
  }, [fetchBootstrapData]);

  const switchWorkspace = async (workspaceId) => {
    await fetchBootstrapData(workspaceId);
  };

  // Timer Actions
  const startTimer = async ({ projectId, taskId, description, billable = true }) => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch('/api/projecttime/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          workspaceId: activeWorkspace._id,
          projectId,
          taskId: taskId || null,
          description: description || '',
          billable,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRunningTimer(data.runningTimer);
        toast.success('Timer started');
      } else {
        toast.error(data.error || 'Failed to start timer');
      }
    } catch (error) {
      toast.error('Failed to start timer');
    }
  };

  const stopTimer = async (description = '') => {
    if (!activeWorkspace || !runningTimer) return;
    try {
      const res = await fetch('/api/projecttime/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop',
          workspaceId: activeWorkspace._id,
          description: description || runningTimer.description || '',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRunningTimer(null);
        setEntries((prev) => [data.entry, ...prev]);
        toast.success('Timer stopped & entry saved');
      } else {
        toast.error(data.error || 'Failed to stop timer');
      }
    } catch (error) {
      toast.error('Failed to stop timer');
    }
  };

  // Entry Actions
  const addManualEntry = async (entryData) => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch('/api/projecttime/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: activeWorkspace._id,
          ...entryData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEntries((prev) => [data.entry, ...prev]);
        toast.success('Time entry created');
        return true;
      } else {
        toast.error(data.error || 'Failed to create time entry');
        return false;
      }
    } catch (error) {
      toast.error('Failed to create time entry');
      return false;
    }
  };

  const updateEntry = async (id, updateData) => {
    try {
      const res = await fetch(`/api/projecttime/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (data.success) {
        setEntries((prev) => prev.map((e) => (e._id === id ? data.entry : e)));
        toast.success('Time entry updated');
        return true;
      } else {
        toast.error(data.error || 'Failed to update entry');
        return false;
      }
    } catch (error) {
      toast.error('Failed to update entry');
      return false;
    }
  };

  const deleteEntry = async (id) => {
    try {
      const res = await fetch(`/api/projecttime/entries/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setEntries((prev) => prev.filter((e) => e._id !== id));
        toast.success('Time entry deleted');
        return true;
      } else {
        toast.error(data.error || 'Failed to delete entry');
        return false;
      }
    } catch (error) {
      toast.error('Failed to delete entry');
      return false;
    }
  };

  // Project Actions
  const createProject = async (projectData) => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch('/api/projecttime/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace._id, ...projectData }),
      });

      const data = await res.json();
      if (data.success) {
        setProjects((prev) => [data.project, ...prev]);
        toast.success('Project created');
        return true;
      } else {
        toast.error(data.error || 'Failed to create project');
        return false;
      }
    } catch (error) {
      toast.error('Failed to create project');
      return false;
    }
  };

  const updateProject = async (id, projectData) => {
    try {
      const res = await fetch(`/api/projecttime/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      const data = await res.json();
      if (data.success) {
        setProjects((prev) => prev.map((p) => (p._id === id ? data.project : p)));
        toast.success('Project updated');
        return true;
      } else {
        toast.error(data.error || 'Failed to update project');
        return false;
      }
    } catch (error) {
      toast.error('Failed to update project');
      return false;
    }
  };

  const deleteProject = async (id) => {
    try {
      const res = await fetch(`/api/projecttime/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProjects((prev) => prev.filter((p) => p._id !== id));
        setTasks((prev) => prev.filter((t) => t.projectId !== id));
        setEntries((prev) => prev.filter((e) => e.projectId !== id));
        toast.success('Project deleted');
        return true;
      } else {
        toast.error(data.error || 'Failed to delete project');
        return false;
      }
    } catch (error) {
      toast.error('Failed to delete project');
      return false;
    }
  };

  // Task Actions
  const createTask = async (taskData) => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch('/api/projecttime/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWorkspace._id, ...taskData }),
      });

      const data = await res.json();
      if (data.success) {
        setTasks((prev) => [data.task, ...prev]);
        toast.success('Task created');
        return true;
      } else {
        toast.error(data.error || 'Failed to create task');
        return false;
      }
    } catch (error) {
      toast.error('Failed to create task');
      return false;
    }
  };

  const updateTask = async (id, taskData) => {
    try {
      const res = await fetch(`/api/projecttime/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.map((t) => (t._id === id ? data.task : t)));
        toast.success('Task updated');
        return true;
      } else {
        toast.error(data.error || 'Failed to update task');
        return false;
      }
    } catch (error) {
      toast.error('Failed to update task');
      return false;
    }
  };

  const deleteTask = async (id) => {
    try {
      const res = await fetch(`/api/projecttime/tasks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.filter((t) => t._id !== id));
        toast.success('Task deleted');
        return true;
      } else {
        toast.error(data.error || 'Failed to delete task');
        return false;
      }
    } catch (error) {
      toast.error('Failed to delete task');
      return false;
    }
  };

  // Workspace Actions
  const createWorkspace = async (name, description) => {
    try {
      const res = await fetch('/api/projecttime/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();
      if (data.success) {
        setWorkspaces((prev) => [...prev, data.workspace]);
        setActiveWorkspace(data.workspace);
        fetchBootstrapData(data.workspace._id);
        toast.success('Workspace created');
        return true;
      } else {
        toast.error(data.error || 'Failed to create workspace');
        return false;
      }
    } catch (error) {
      toast.error('Failed to create workspace');
      return false;
    }
  };

  const updateWorkspace = async (id, updateData) => {
    try {
      const res = await fetch(`/api/projecttime/workspaces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (data.success) {
        setActiveWorkspace(data.workspace);
        setWorkspaces((prev) => prev.map((w) => (w._id === id ? data.workspace : w)));
        toast.success('Workspace updated');
        return true;
      } else {
        toast.error(data.error || 'Failed to update workspace');
        return false;
      }
    } catch (error) {
      toast.error('Failed to update workspace');
      return false;
    }
  };

  return (
    <ProjectTimeContext.Provider
      value={{
        user,
        workspaces,
        activeWorkspace,
        projects,
        tasks,
        entries,
        runningTimer,
        elapsedSeconds,
        isLoading,
        switchWorkspace,
        startTimer,
        stopTimer,
        addManualEntry,
        updateEntry,
        deleteEntry,
        createProject,
        updateProject,
        deleteProject,
        createTask,
        updateTask,
        deleteTask,
        createWorkspace,
        updateWorkspace,
        refreshData: fetchBootstrapData,
      }}
    >
      {children}
    </ProjectTimeContext.Provider>
  );
}

export function useProjectTime() {
  const context = useContext(ProjectTimeContext);
  if (!context) {
    throw new Error('useProjectTime must be used within a ProjectTimeProvider');
  }
  return context;
}
