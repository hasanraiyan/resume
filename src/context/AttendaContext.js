// @/context/AttendaContext.js
'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import * as api from '@/lib/attenda/api';
import {
  loadAll,
  persist,
  getSemesters,
  getSemester,
  createSemester as storageCreateSemester,
  updateSemester as storageUpdateSemester,
  deleteSemester as storageDeleteSemester,
  getSubjects as storageGetSubjects,
  createSubject as storageCreateSubject,
  updateSubject as storageUpdateSubject,
  deleteSubject as storageDeleteSubject,
  getTimetable as storageGetTimetable,
  setTimetableSlots as storageSetTimetableSlots,
  getDay,
  saveDay as storageSaveDay,
  getHolidays as storageGetHolidays,
  addHoliday as storageAddHoliday,
  removeHoliday as storageRemoveHoliday,
  exportBackup as storageExportBackup,
  importBackup as storageImportBackup,
} from '@/lib/attenda/storage';
import {
  computeCollegeAttendance,
  computeSubjectAttendance,
  computeAllSubjectAttendance,
  getTodaysLectures,
} from '@/lib/attenda/calculations';
import { generateCollegePredictions, generateSubjectPredictions } from '@/lib/attenda/predictions';

// --- Action Types ---
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_INITIALIZED: 'SET_INITIALIZED',
  SET_SYNCING: 'SET_SYNCING',
  SET_ERROR: 'SET_ERROR',
  SET_SEMESTERS: 'SET_SEMESTERS',
  SET_ACTIVE_SEMESTER: 'SET_ACTIVE_SEMESTER',
  SET_SUBJECTS: 'SET_SUBJECTS',
  SET_DAYS: 'SET_DAYS',
  SET_TIMETABLE: 'SET_TIMETABLE',
  SET_HOLIDAYS: 'SET_HOLIDAYS',
  SET_TODAY_STATUS: 'SET_TODAY_STATUS',
  ADD_SEMESTER: 'ADD_SEMESTER',
  UPDATE_SEMESTER: 'UPDATE_SEMESTER',
  REMOVE_SEMESTER: 'REMOVE_SEMESTER',
  ADD_SUBJECT: 'ADD_SUBJECT',
  UPDATE_SUBJECT: 'UPDATE_SUBJECT',
  REMOVE_SUBJECT: 'REMOVE_SUBJECT',
  SET_BOOTSTRAP_LOADING: 'SET_BOOTSTRAP_LOADING',
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ACTIONS.SET_INITIALIZED:
      return { ...state, isInitialized: true, isLoading: false };
    case ACTIONS.SET_SYNCING:
      return { ...state, isSyncing: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.SET_SEMESTERS:
      return { ...state, semesters: action.payload };
    case ACTIONS.SET_ACTIVE_SEMESTER:
      return { ...state, activeSemesterId: action.payload };
    case ACTIONS.SET_SUBJECTS:
      return { ...state, subjects: action.payload };
    case ACTIONS.SET_DAYS:
      return { ...state, allDays: action.payload };
    case ACTIONS.SET_TIMETABLE:
      return { ...state, timetable: action.payload };
    case ACTIONS.SET_HOLIDAYS:
      return { ...state, holidays: action.payload };
    case ACTIONS.SET_TODAY_STATUS:
      return { ...state, todayStatus: action.payload };
    case ACTIONS.SET_BOOTSTRAP_LOADING:
      return { ...state, isBootstrapLoading: action.payload };
    default:
      return state;
  }
}

const initialState = {
  semesters: [],
  subjects: [],
  allDays: {},
  timetable: null,
  holidays: [],
  activeSemesterId: null,
  todayStatus: null,
  isLoading: true,
  isBootstrapLoading: true,
  isSyncing: false,
  isInitialized: false,
  error: null,
};

const AttendaContext = createContext(null);

export function AttendaProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // --- Bootstrap: load all data from server ---
  const bootstrap = useCallback(async (semesterId) => {
    try {
      dispatch({ type: ACTIONS.SET_BOOTSTRAP_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_SYNCING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });

      const data = await api.fetchBootstrap(semesterId);

      // Build days lookup map
      const daysMap = {};
      (data.days || []).forEach((day) => {
        daysMap[day.date] = day;
      });

      dispatch({ type: ACTIONS.SET_SEMESTERS, payload: data.semesters || [] });
      dispatch({ type: ACTIONS.SET_SUBJECTS, payload: data.subjects || [] });
      dispatch({ type: ACTIONS.SET_DAYS, payload: daysMap });
      dispatch({ type: ACTIONS.SET_TIMETABLE, payload: data.timetables?.[0] || null });
      dispatch({ type: ACTIONS.SET_HOLIDAYS, payload: data.holidays || [] });

      // Lightweight localStorage cache: just store semester names for offline onboarding
      const store = loadAll();
      if (data.semesters && data.semesters.length > 0) {
        store.semesters = data.semesters;
        persist();
      }

      return data;
    } catch (error) {
      console.error('Failed to bootstrap Attenda:', error);
      // On error, fall back to localStorage cache
      const store = loadAll();
      dispatch({ type: ACTIONS.SET_SEMESTERS, payload: store?.semesters || [] });
      dispatch({ type: ACTIONS.SET_SUBJECTS, payload: [] });
      dispatch({ type: ACTIONS.SET_DAYS, payload: {} });
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: 'Failed to load from server. Using local data.',
      });
    } finally {
      dispatch({ type: ACTIONS.SET_BOOTSTRAP_LOADING, payload: false });
      dispatch({ type: ACTIONS.SET_SYNCING, payload: false });
      dispatch({ type: ACTIONS.SET_INITIALIZED });
    }
  }, []);

  // Initialize: load semesters from server, pick active
  useEffect(() => {
    const init = async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });

      // First, try localStorage for instant load
      const store = loadAll();
      const localSemesters = store?.semesters || [];
      let activeId = null;
      try {
        const stored = localStorage.getItem('attenda_active_semester');
        if (stored && localSemesters.some((s) => s.id === stored)) {
          activeId = stored;
        }
      } catch {}
      if (!activeId && localSemesters.length > 0) {
        activeId = localSemesters[localSemesters.length - 1].id;
      }

      if (localSemesters.length > 0) {
        dispatch({ type: ACTIONS.SET_SEMESTERS, payload: localSemesters });
        const subjs = storageGetSubjects(activeId);
        dispatch({ type: ACTIONS.SET_SUBJECTS, payload: subjs });
        dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: activeId });
      }

      // Then bootstrap from server
      await bootstrap(activeId);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When activeSemesterId changes, refetch subjects and days
  useEffect(() => {
    if (!state.activeSemesterId) return;

    const refresh = async () => {
      try {
        const [subjects, days, timetable, holidays] = await Promise.all([
          api.fetchSubjects(state.activeSemesterId),
          api.fetchDays(state.activeSemesterId),
          api.fetchTimetable(state.activeSemesterId),
          api.fetchHolidays(state.activeSemesterId),
        ]);

        const daysMap = {};
        (days || []).forEach((day) => {
          daysMap[day.date] = day;
        });

        dispatch({ type: ACTIONS.SET_SUBJECTS, payload: subjects || [] });
        dispatch({ type: ACTIONS.SET_DAYS, payload: daysMap });
        dispatch({ type: ACTIONS.SET_TIMETABLE, payload: timetable || null });
        dispatch({ type: ACTIONS.SET_HOLIDAYS, payload: holidays || [] });
      } catch (error) {
        console.error('Failed to refresh semester data:', error);
        // Fall back to localStorage
        const subjs = storageGetSubjects(state.activeSemesterId);
        dispatch({ type: ACTIONS.SET_SUBJECTS, payload: subjs });
      }
    };
    refresh();
  }, [state.activeSemesterId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Semester operations ---
  const setActiveSemester = useCallback((id) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: id });
    try {
      localStorage.setItem('attenda_active_semester', id);
    } catch {}
  }, []);

  const addSemester = useCallback(
    async (data) => {
      try {
        const semester = await api.createSemester(data);
        // Refresh bootstrap
        await bootstrap(semester.id);
        dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: semester.id });
        try {
          localStorage.setItem('attenda_active_semester', semester.id);
        } catch {}
        return semester;
      } catch (error) {
        console.error('Failed to create semester:', error);
        // Fallback: localStorage
        const sem = storageCreateSemester(data);
        const semesters = getSemesters();
        dispatch({ type: ACTIONS.SET_SEMESTERS, payload: semesters });
        dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: sem.id });
        return sem;
      }
    },
    [bootstrap]
  );

  const editSemester = useCallback(
    async (id, updates) => {
      try {
        await api.updateSemester(id, updates);
        await bootstrap(state.activeSemesterId);
      } catch (error) {
        console.error('Failed to update semester:', error);
        storageUpdateSemester(id, updates);
        const semesters = getSemesters();
        dispatch({ type: ACTIONS.SET_SEMESTERS, payload: semesters });
      }
    },
    [state.activeSemesterId, bootstrap]
  );

  const removeSemester = useCallback(
    async (id) => {
      try {
        await api.deleteSemester(id);
        await bootstrap();
      } catch (error) {
        console.error('Failed to delete semester:', error);
        storageDeleteSemester(id);
        const semesters = getSemesters();
        dispatch({ type: ACTIONS.SET_SEMESTERS, payload: semesters });
        if (state.activeSemesterId === id) {
          const newActive = semesters.length > 0 ? semesters[semesters.length - 1].id : null;
          dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: newActive });
        }
      }
    },
    [state.activeSemesterId, bootstrap]
  );

  // --- Subject operations ---
  const addSubject = useCallback(
    async (data) => {
      try {
        await api.createSubject(data);
        const subjects = await api.fetchSubjects(state.activeSemesterId);
        dispatch({ type: ACTIONS.SET_SUBJECTS, payload: subjects || [] });
      } catch (error) {
        console.error('Failed to create subject:', error);
        storageCreateSubject(data);
        const subjects = storageGetSubjects(state.activeSemesterId);
        dispatch({ type: ACTIONS.SET_SUBJECTS, payload: subjects });
      }
    },
    [state.activeSemesterId]
  );

  const editSubject = useCallback(
    async (id, updates) => {
      try {
        await api.updateSubject(id, updates);
        const subjects = await api.fetchSubjects(state.activeSemesterId);
        dispatch({ type: ACTIONS.SET_SUBJECTS, payload: subjects || [] });
      } catch (error) {
        console.error('Failed to update subject:', error);
        storageUpdateSubject(id, updates);
        const subjects = storageGetSubjects(state.activeSemesterId);
        dispatch({ type: ACTIONS.SET_SUBJECTS, payload: subjects });
      }
    },
    [state.activeSemesterId]
  );

  const removeSubject = useCallback(
    async (id) => {
      try {
        await api.deleteSubject(id);
        const subjects = await api.fetchSubjects(state.activeSemesterId);
        dispatch({ type: ACTIONS.SET_SUBJECTS, payload: subjects || [] });
      } catch (error) {
        console.error('Failed to delete subject:', error);
        storageDeleteSubject(id);
        const subjects = storageGetSubjects(state.activeSemesterId);
        dispatch({ type: ACTIONS.SET_SUBJECTS, payload: subjects });
      }
    },
    [state.activeSemesterId]
  );

  // --- Today operations ---
  const getTodayStatus = useCallback(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;

    const existing = state.allDays[dateKey] || getDay(dateKey);
    return existing || null;
  }, [state.allDays]);

  const saveToday = useCallback(
    async (dayData) => {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;

      const payload = {
        ...dayData,
        semesterId: state.activeSemesterId,
        date: dateKey,
      };

      // Optimistic update
      dispatch({
        type: ACTIONS.SET_TODAY_STATUS,
        payload: { ...payload, date: dateKey },
      });

      // Update local days map
      const updatedDays = { ...state.allDays, [dateKey]: { ...payload } };
      dispatch({ type: ACTIONS.SET_DAYS, payload: updatedDays });

      try {
        const saved = await api.saveDay(payload);
        // Update with server response
        const finalDays = { ...state.allDays, [dateKey]: saved };
        dispatch({ type: ACTIONS.SET_DAYS, payload: finalDays });
        dispatch({ type: ACTIONS.SET_TODAY_STATUS, payload: saved });
        // Also cache in localStorage
        storageSaveDay(dateKey, saved);
        return saved;
      } catch (error) {
        console.error('Failed to save attendance:', error);
        // Fallback to localStorage
        storageSaveDay(dateKey, payload);
        return payload;
      }
    },
    [state.activeSemesterId, state.allDays]
  );

  // --- Day operations ---
  const getSavedDay = useCallback(
    (dateKey) => {
      return state.allDays[dateKey] || getDay(dateKey) || null;
    },
    [state.allDays]
  );

  const saveDayRecord = useCallback(
    async (dateKey, dayData) => {
      const payload = {
        ...dayData,
        semesterId: state.activeSemesterId,
        date: dateKey,
      };

      // Optimistic update
      const updatedDays = { ...state.allDays, [dateKey]: payload };
      dispatch({ type: ACTIONS.SET_DAYS, payload: updatedDays });

      try {
        const saved = await api.saveDay(payload);
        const finalDays = { ...state.allDays, [dateKey]: saved };
        dispatch({ type: ACTIONS.SET_DAYS, payload: finalDays });
        storageSaveDay(dateKey, saved);
      } catch (error) {
        console.error('Failed to save day:', error);
        storageSaveDay(dateKey, payload);
      }
    },
    [state.activeSemesterId, state.allDays]
  );

  // --- Timetable ---
  const getTimetableForSemester = useCallback(() => {
    if (state.timetable) {
      // Convert from server format (days array) to client format (slots map)
      const slots = {};
      (state.timetable.days || []).forEach((day) => {
        slots[day.dayOfWeek] = (day.slots || []).map((slot) => ({
          id: slot.id || slot._id,
          subjectId: slot.subjectId,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }));
      });
      return {
        semesterId: state.activeSemesterId,
        slots,
      };
    }
    // Fallback to localStorage
    if (state.activeSemesterId) {
      return storageGetTimetable(state.activeSemesterId);
    }
    return { semesterId: null, slots: {} };
  }, [state.activeSemesterId, state.timetable]);

  const updateTimetableSlots = useCallback(
    async (dayOfWeek, slots) => {
      // Optimistic local update
      if (state.timetable) {
        const updated = { ...state.timetable };
        const dayIndex = (updated.days || []).findIndex((d) => d.dayOfWeek === dayOfWeek);
        const newSlots = slots.map((s) => ({
          subjectId: s.subjectId,
          startTime: s.startTime,
          endTime: s.endTime,
        }));
        if (dayIndex >= 0) {
          updated.days[dayIndex].slots = newSlots;
        } else {
          updated.days = [...(updated.days || []), { dayOfWeek, slots: newSlots }];
        }
        dispatch({ type: ACTIONS.SET_TIMETABLE, payload: updated });
      }

      // Also update localStorage
      if (state.activeSemesterId) {
        storageSetTimetableSlots(state.activeSemesterId, dayOfWeek, slots);
      }

      // Sync to server
      try {
        await api.updateTimetable({
          semesterId: state.activeSemesterId,
          dayOfWeek,
          slots,
        });
      } catch (error) {
        console.error('Failed to update timetable:', error);
      }
    },
    [state.activeSemesterId, state.timetable]
  );

  // --- Holidays ---
  const getHolidaysForSemester = useCallback(() => {
    return state.holidays || [];
  }, [state.holidays]);

  const addHolidayToSemester = useCallback(
    async (data) => {
      try {
        const holiday = await api.createHoliday({
          ...data,
          semesterId: state.activeSemesterId,
        });
        const updated = [...(state.holidays || []), holiday];
        dispatch({ type: ACTIONS.SET_HOLIDAYS, payload: updated });
        return holiday;
      } catch (error) {
        console.error('Failed to add holiday:', error);
        // Fallback
        const local = storageAddHoliday({ ...data, semesterId: state.activeSemesterId });
        const updated = [...(state.holidays || []), local];
        dispatch({ type: ACTIONS.SET_HOLIDAYS, payload: updated });
        return local;
      }
    },
    [state.activeSemesterId, state.holidays]
  );

  const removeHolidayFromSemester = useCallback(
    async (id) => {
      // Try server delete first (server IDs are MongoDB ObjectIds, local IDs have 'local_' prefix)
      const isServerId = id && !id.startsWith('local_');
      if (isServerId) {
        try {
          await api.deleteHoliday(id);
        } catch (error) {
          console.error('Failed to delete holiday from server:', error);
        }
      }
      storageRemoveHoliday(id);
      const updated = (state.holidays || []).filter((h) => h.id !== id && h._id?.toString() !== id);
      dispatch({ type: ACTIONS.SET_HOLIDAYS, payload: updated });
    },
    [state.holidays]
  );

  // --- Reset Attendance ---
  const resetAttendance = useCallback(async () => {
    if (!state.activeSemesterId) return;
    try {
      await api.resetAttendance(state.activeSemesterId);
      // Clear local days state
      dispatch({ type: ACTIONS.SET_DAYS, payload: {} });
      dispatch({ type: ACTIONS.SET_TODAY_STATUS, payload: null });
    } catch (error) {
      console.error('Failed to reset attendance:', error);
      throw error;
    }
  }, [state.activeSemesterId]);

  // --- Computed values ---
  const activeSemester = useMemo(() => {
    if (!state.activeSemesterId) return null;
    // Try state first (server data), then localStorage
    const fromState = state.semesters.find((s) => s.id === state.activeSemesterId);
    if (fromState) return fromState;
    return getSemester(state.activeSemesterId);
  }, [state.activeSemesterId, state.semesters]);

  const allDays = state.allDays || {};

  const collegeStats = useMemo(() => {
    if (!activeSemester) return null;
    const holidays = state.holidays || [];
    return computeCollegeAttendance(activeSemester, allDays, holidays);
  }, [activeSemester, allDays, state.holidays]);

  const subjectStats = useMemo(() => {
    if (!activeSemester) return [];
    return computeAllSubjectAttendance(activeSemester, state.subjects, allDays);
  }, [activeSemester, state.subjects, allDays]);

  const collegePredictions = useMemo(() => {
    if (!collegeStats || !activeSemester) return null;
    return generateCollegePredictions(collegeStats, activeSemester);
  }, [collegeStats, activeSemester]);

  const subjectPredictions = useMemo(() => {
    if (!activeSemester) return {};
    const result = {};
    state.subjects.forEach((subject) => {
      if (!subject.isActive) return;
      const stats = computeSubjectAttendance(subject, allDays, activeSemester);
      result[subject.id] = generateSubjectPredictions(stats, subject);
    });
    return result;
  }, [state.subjects, allDays, activeSemester]);

  const todaysLectures = useMemo(() => {
    if (!state.activeSemesterId) return [];
    const timetable = getTimetableForSemester();
    return getTodaysLectures(timetable, state.subjects);
  }, [state.activeSemesterId, state.subjects, getTimetableForSemester]);

  const contextValue = useMemo(
    () => ({
      // State
      ...state,

      // Derived
      activeSemester,
      allDays,
      collegeStats,
      subjectStats,
      collegePredictions,
      subjectPredictions,
      todaysLectures,

      // Semester actions
      setActiveSemester,
      addSemester,
      editSemester,
      removeSemester,

      // Subject actions
      addSubject,
      editSubject,
      removeSubject,

      // Today actions
      getTodayStatus,
      saveToday,

      // Day actions
      getSavedDay,
      saveDayRecord,

      // Timetable
      getTimetableForSemester,
      updateTimetableSlots,

      // Holidays
      getHolidaysForSemester,
      addHolidayToSemester,
      removeHolidayFromSemester,

      // Reset
      resetAttendance,

      // Backup
      exportBackup: storageExportBackup,
      importBackup: storageImportBackup,
    }),
    [
      state,
      activeSemester,
      allDays,
      collegeStats,
      subjectStats,
      collegePredictions,
      subjectPredictions,
      todaysLectures,
      setActiveSemester,
      addSemester,
      editSemester,
      removeSemester,
      addSubject,
      editSubject,
      removeSubject,
      getTodayStatus,
      saveToday,
      getSavedDay,
      saveDayRecord,
      getTimetableForSemester,
      updateTimetableSlots,
      getHolidaysForSemester,
      addHolidayToSemester,
      removeHolidayFromSemester,
      resetAttendance,
    ]
  );

  return <AttendaContext.Provider value={contextValue}>{children}</AttendaContext.Provider>;
}

export function useAttenda() {
  const ctx = useContext(AttendaContext);
  if (!ctx) throw new Error('useAttenda must be used within AttendaProvider');
  return ctx;
}
