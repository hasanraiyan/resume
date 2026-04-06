'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

const TasklyContext = createContext(null);

const initialSettings = {
  sortOrder: 'due-date',
  defaultProjectColor: '#1f644e',
  defaultTaskStatus: 'todo',
  confirmDelete: true,
};

const initialState = {
  projects: [],
  tasks: [],
  stats: {
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    dueTodayTasks: 0,
    activeProjects: 0,
    projectCount: 0,
    completionRate: 0,
  },
  insights: null,
  isLoading: false,
  isBootstrapLoading: true,
  isTabLoading: false,
  error: null,
  activeTab: 'tasks',
  selectedProject: 'all',
  settings: initialSettings,
};

function tasklyReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_BOOTSTRAP_LOADING':
      return { ...state, isBootstrapLoading: action.payload };
    case 'SET_TAB_LOADING':
      return { ...state, isTabLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_SELECTED_PROJECT':
      return { ...state, selectedProject: action.payload };
    case 'SET_BOOTSTRAP':
      return {
        ...state,
        projects: action.payload.projects || [],
        tasks: action.payload.tasks || [],
        stats: action.payload.stats || state.stats,
      };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } };
    case 'SET_INSIGHTS':
      return { ...state, insights: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    default:
      return state;
  }
}

async function readJson(response) {
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export function TasklyProvider({ children }) {
  const [state, dispatch] = useReducer(tasklyReducer, initialState);

  const fetchBootstrap = useCallback(async () => {
    try {
      dispatch({ type: 'SET_BOOTSTRAP_LOADING', payload: true });
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const data = await fetch('/api/taskly/bootstrap').then(readJson);
      dispatch({ type: 'SET_BOOTSTRAP', payload: data });
    } catch (error) {
      console.error('Failed to fetch Taskly bootstrap:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load Taskly. Please try again.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_BOOTSTRAP_LOADING', payload: false });
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    try {
      dispatch({ type: 'SET_TAB_LOADING', payload: true });
      const data = await fetch('/api/taskly/insights').then(readJson);
      dispatch({ type: 'SET_INSIGHTS', payload: data.insights });
    } catch (error) {
      console.error('Failed to fetch Taskly insights:', error);
    } finally {
      dispatch({ type: 'SET_TAB_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('taskly-settings');
      if (!saved) return;
      dispatch({ type: 'SET_SETTINGS', payload: JSON.parse(saved) });
    } catch (error) {
      console.error('Failed to load Taskly settings:', error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('taskly-settings', JSON.stringify(state.settings));
    } catch (error) {
      console.error('Failed to persist Taskly settings:', error);
    }
  }, [state.settings]);

  const refreshAll = useCallback(
    async (includeInsights = false) => {
      await fetchBootstrap();
      if (includeInsights || state.insights) {
        await fetchInsights();
      }
    },
    [fetchBootstrap, fetchInsights, state.insights]
  );

  const addTask = async (task) => {
    await fetch('/api/taskly/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    }).then(readJson);
    await refreshAll(true);
  };

  const updateTask = async (id, task) => {
    await fetch(`/api/taskly/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    }).then(readJson);
    await refreshAll(true);
  };

  const deleteTask = async (id) => {
    await fetch(`/api/taskly/tasks/${id}`, { method: 'DELETE' }).then(readJson);
    await refreshAll(true);
  };

  const addProject = async (project) => {
    await fetch('/api/taskly/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    }).then(readJson);
    await refreshAll(true);
  };

  const updateProject = async (id, project) => {
    await fetch(`/api/taskly/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    }).then(readJson);
    await refreshAll(true);
  };

  const deleteProject = async (id) => {
    await fetch(`/api/taskly/projects/${id}`, { method: 'DELETE' }).then(readJson);
    await refreshAll(true);
  };

  const setActiveTab = (tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  const setSelectedProject = (projectId) =>
    dispatch({ type: 'SET_SELECTED_PROJECT', payload: projectId });
  const updateSettings = (settings) => dispatch({ type: 'SET_SETTINGS', payload: settings });

  const value = useMemo(
    () => ({
      ...state,
      fetchBootstrap,
      fetchInsights,
      addTask,
      updateTask,
      deleteTask,
      addProject,
      updateProject,
      deleteProject,
      setActiveTab,
      setSelectedProject,
      updateSettings,
    }),
    [state, fetchBootstrap, fetchInsights]
  );

  return <TasklyContext.Provider value={value}>{children}</TasklyContext.Provider>;
}

export function useTaskly() {
  const context = useContext(TasklyContext);
  if (!context) {
    throw new Error('useTaskly must be used within a TasklyProvider');
  }
  return context;
}
