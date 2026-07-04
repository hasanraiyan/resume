// @/context/AttendaContext.js
'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import * as api from '@/lib/attenda/api';
import { loadAll, persist, importBackup as storageImportBackup } from '@/lib/attenda/storage';
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

      // Automatically select active semester if not set or invalid
      let finalActiveId = semesterId;
      if (!finalActiveId && data.semesters && data.semesters.length > 0) {
        finalActiveId = data.semesters[0].id;
      }

      if (finalActiveId) {
        dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: finalActiveId });
        try {
          localStorage.setItem('attenda_active_semester', finalActiveId);
        } catch {}
      }

      return data;
    } catch (error) {
      console.error('Failed to bootstrap Attenda:', error);
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: 'Failed to load from server.',
      });
    } finally {
      dispatch({ type: ACTIONS.SET_BOOTSTRAP_LOADING, payload: false });
      dispatch({ type: ACTIONS.SET_SYNCING, payload: false });
      dispatch({ type: ACTIONS.SET_INITIALIZED });
    }
  }, []);

  // Sync local offline data to server to reconcile ID mismatches
  const syncLocalStorageToServer = useCallback(async () => {
    const store = loadAll();
    const localSemesters = store.semesters || [];
    const localSemestersToSync = localSemesters.filter(
      (s) => s.id && String(s.id).startsWith('local_')
    );

    if (localSemestersToSync.length === 0) return;

    console.log('Syncing local semesters to server:', localSemestersToSync);

    for (const localSem of localSemestersToSync) {
      try {
        // 1. Create semester on server
        const serverSem = await api.createSemester({
          name: localSem.name,
          startDate: localSem.startDate,
          endDate: localSem.endDate,
          requiredAttendance: localSem.requiredAttendance,
          weeklyHolidays: localSem.weeklyHolidays,
          institutionName: localSem.institutionName,
          notes: localSem.notes,
        });

        const oldSemId = localSem.id;
        const newSemId = serverSem.id;

        // 2. Sync subjects
        const localSubjects = (store.subjects || []).filter((s) => s.semesterId === oldSemId);
        const subjectIdMap = {};
        for (const localSubj of localSubjects) {
          const serverSubj = await api.createSubject({
            semesterId: newSemId,
            name: localSubj.name,
            facultyName: localSubj.facultyName,
            color: localSubj.color,
            credits: localSubj.credits,
            requiredAttendance: localSubj.requiredAttendance,
            isActive: localSubj.isActive,
          });
          subjectIdMap[localSubj.id] = serverSubj.id;
        }

        // 3. Sync timetable
        const localTimetable = store.timetables?.[oldSemId];
        if (localTimetable && localTimetable.slots) {
          for (const dayOfWeek of Object.keys(localTimetable.slots)) {
            const slots = localTimetable.slots[dayOfWeek] || [];
            const mappedSlots = slots
              .map((s) => ({
                subjectId: subjectIdMap[s.subjectId] || s.subjectId,
                startTime: s.startTime,
                endTime: s.endTime,
              }))
              .filter((s) => s.subjectId && !String(s.subjectId).startsWith('local_'));

            if (mappedSlots.length > 0) {
              await api.updateTimetable({
                semesterId: newSemId,
                dayOfWeek: parseInt(dayOfWeek, 10),
                slots: mappedSlots,
              });
            }
          }
        }

        // 4. Sync holidays
        const localHolidays = (store.holidays || []).filter((h) => h.semesterId === oldSemId);
        for (const localHoliday of localHolidays) {
          await api.createHoliday({
            semesterId: newSemId,
            date: localHoliday.date,
            name: localHoliday.name,
            type: localHoliday.type,
          });
        }

        // 5. Sync days (attendance records)
        const localDays = Object.values(store.days || {}).filter((d) => d.semesterId === oldSemId);
        for (const localDay of localDays) {
          const mappedLectures = (localDay.lectures || [])
            .map((lec) => ({
              subjectId: subjectIdMap[lec.subjectId] || lec.subjectId,
              status: lec.status,
              isExtra: lec.isExtra,
              startTime: lec.startTime,
              endTime: lec.endTime,
            }))
            .filter((lec) => lec.subjectId && !String(lec.subjectId).startsWith('local_'));

          await api.saveDay({
            semesterId: newSemId,
            date: localDay.date,
            collegeStatus: localDay.collegeStatus,
            lectures: mappedLectures,
            notes: localDay.notes,
          });
        }

        // Update active semester in localStorage if it was the old one
        try {
          const storedActive = localStorage.getItem('attenda_active_semester');
          if (storedActive === oldSemId) {
            localStorage.setItem('attenda_active_semester', newSemId);
          }
        } catch {}

        // Clean up local storage for this semester
        store.semesters = store.semesters.filter((s) => s.id !== oldSemId);
        store.subjects = store.subjects.filter((s) => s.semesterId !== oldSemId);
        if (store.timetables) delete store.timetables[oldSemId];
        store.holidays = store.holidays.filter((h) => h.semesterId !== oldSemId);
        Object.keys(store.days || {}).forEach((date) => {
          if (store.days[date]?.semesterId === oldSemId) {
            delete store.days[date];
          }
        });

        persist();
      } catch (err) {
        console.error(`Failed to sync local semester ${localSem.name}:`, err);
      }
    }
  }, []);

  // Initialize: load semesters from server, pick active
  useEffect(() => {
    const init = async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });

      // First sync any local offline data to server to reconcile ID mismatches
      await syncLocalStorageToServer();

      let activeId = null;
      try {
        activeId = localStorage.getItem('attenda_active_semester');
      } catch {}

      // Then bootstrap from server
      await bootstrap(activeId);
    };
    init();
  }, [bootstrap, syncLocalStorageToServer]);

  // When activeSemesterId changes, refetch subjects and days
  useEffect(() => {
    if (!state.activeSemesterId || state.activeSemesterId.startsWith('temp_')) return;

    // Immediately clear stale data for the previous semester
    dispatch({ type: ACTIONS.SET_SUBJECTS, payload: [] });
    dispatch({ type: ACTIONS.SET_DAYS, payload: {} });
    dispatch({ type: ACTIONS.SET_TIMETABLE, payload: null });
    dispatch({ type: ACTIONS.SET_HOLIDAYS, payload: [] });

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
      }
    };
    refresh();
  }, [state.activeSemesterId]);

  // --- Semester operations ---
  const setActiveSemester = useCallback((id) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: id });
    try {
      localStorage.setItem('attenda_active_semester', id);
    } catch {}
  }, []);

  const addSemester = useCallback(
    async (data) => {
      const tempId = `temp_${Date.now()}`;
      const tempSemester = {
        id: tempId,
        name: data.name || 'Untitled Semester',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        requiredAttendance: data.requiredAttendance ?? 75,
        weeklyHolidays: data.weeklyHolidays || [0],
        institutionName: data.institutionName || '',
        notes: data.notes || '',
      };

      dispatch({ type: ACTIONS.SET_SEMESTERS, payload: [tempSemester, ...state.semesters] });
      dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: tempId });

      try {
        const semester = await api.createSemester(data);
        dispatch({
          type: ACTIONS.SET_SEMESTERS,
          payload: [semester, ...state.semesters.filter((s) => s.id !== tempId)],
        });
        dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: semester.id });
        try {
          localStorage.setItem('attenda_active_semester', semester.id);
        } catch {}
        await bootstrap(semester.id);
        return semester;
      } catch (error) {
        console.error('Failed to create semester:', error);
        dispatch({
          type: ACTIONS.SET_SEMESTERS,
          payload: state.semesters.filter((s) => s.id !== tempId),
        });
        const prevActive = state.semesters[0]?.id || null;
        dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: prevActive });
        throw error;
      }
    },
    [state.semesters, bootstrap]
  );

  const editSemester = useCallback(
    async (id, updates) => {
      const originalSemesters = [...state.semesters];
      const updatedSemesters = state.semesters.map((s) => (s.id === id ? { ...s, ...updates } : s));
      dispatch({ type: ACTIONS.SET_SEMESTERS, payload: updatedSemesters });

      try {
        await api.updateSemester(id, updates);
      } catch (error) {
        console.error('Failed to update semester:', error);
        dispatch({ type: ACTIONS.SET_SEMESTERS, payload: originalSemesters });
        throw error;
      }
    },
    [state.semesters]
  );

  const removeSemester = useCallback(
    async (id) => {
      const originalSemesters = [...state.semesters];
      const originalActiveId = state.activeSemesterId;

      const updatedSemesters = state.semesters.filter((s) => s.id !== id);
      dispatch({ type: ACTIONS.SET_SEMESTERS, payload: updatedSemesters });

      if (state.activeSemesterId === id) {
        const newActive =
          updatedSemesters.length > 0 ? updatedSemesters[updatedSemesters.length - 1].id : null;
        dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: newActive });
        try {
          if (newActive) localStorage.setItem('attenda_active_semester', newActive);
          else localStorage.removeItem('attenda_active_semester');
        } catch {}
      }

      try {
        await api.deleteSemester(id);
      } catch (error) {
        console.error('Failed to delete semester:', error);
        dispatch({ type: ACTIONS.SET_SEMESTERS, payload: originalSemesters });
        dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: originalActiveId });
        try {
          if (originalActiveId) localStorage.setItem('attenda_active_semester', originalActiveId);
        } catch {}
        throw error;
      }
    },
    [state.semesters, state.activeSemesterId]
  );

  // --- Subject operations ---
  const addSubject = useCallback(
    async (data) => {
      const tempId = `temp_${Date.now()}`;
      const tempSubject = {
        id: tempId,
        semesterId: state.activeSemesterId,
        name: data.name || 'Untitled',
        facultyName: data.facultyName || '',
        color: data.color || '#4a86e8',
        credits: data.credits ?? null,
        requiredAttendance: data.requiredAttendance ?? 75,
        isActive: data.isActive ?? true,
      };

      const originalSubjects = [...state.subjects];
      dispatch({ type: ACTIONS.SET_SUBJECTS, payload: [...state.subjects, tempSubject] });

      try {
        const created = await api.createSubject(data);
        dispatch({
          type: ACTIONS.SET_SUBJECTS,
          payload: [...originalSubjects, created],
        });
      } catch (error) {
        console.error('Failed to create subject:', error);
        dispatch({ type: ACTIONS.SET_SUBJECTS, payload: originalSubjects });
        throw error;
      }
    },
    [state.subjects, state.activeSemesterId]
  );

  const editSubject = useCallback(
    async (id, updates) => {
      const originalSubjects = [...state.subjects];
      const updated = state.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s));
      dispatch({ type: ACTIONS.SET_SUBJECTS, payload: updated });

      try {
        await api.updateSubject(id, updates);
      } catch (error) {
        console.error('Failed to update subject:', error);
        dispatch({ type: ACTIONS.SET_SUBJECTS, payload: originalSubjects });
        throw error;
      }
    },
    [state.subjects]
  );

  const removeSubject = useCallback(
    async (id) => {
      const originalSubjects = [...state.subjects];
      dispatch({ type: ACTIONS.SET_SUBJECTS, payload: state.subjects.filter((s) => s.id !== id) });

      try {
        await api.deleteSubject(id);
      } catch (error) {
        console.error('Failed to delete subject:', error);
        dispatch({ type: ACTIONS.SET_SUBJECTS, payload: originalSubjects });
        throw error;
      }
    },
    [state.subjects]
  );

  // --- Today operations ---
  const getTodayStatus = useCallback(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;

    const existing = state.allDays[dateKey];
    if (existing && String(existing.semesterId) !== String(state.activeSemesterId)) {
      return null;
    }
    return existing || null;
  }, [state.activeSemesterId, state.allDays]);

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

      const originalTodayStatus = state.todayStatus;
      const originalAllDays = { ...state.allDays };

      // Optimistic update
      dispatch({
        type: ACTIONS.SET_TODAY_STATUS,
        payload: { ...payload, date: dateKey },
      });
      dispatch({
        type: ACTIONS.SET_DAYS,
        payload: { ...state.allDays, [dateKey]: { ...payload, date: dateKey } },
      });

      try {
        const saved = await api.saveDay(payload);
        dispatch({ type: ACTIONS.SET_TODAY_STATUS, payload: saved });
        dispatch({ type: ACTIONS.SET_DAYS, payload: { ...state.allDays, [dateKey]: saved } });
        return saved;
      } catch (error) {
        console.error('Failed to save attendance:', error);
        dispatch({ type: ACTIONS.SET_TODAY_STATUS, payload: originalTodayStatus });
        dispatch({ type: ACTIONS.SET_DAYS, payload: originalAllDays });
        throw error;
      }
    },
    [state.activeSemesterId, state.allDays, state.todayStatus]
  );

  // --- Day operations ---
  const getSavedDay = useCallback(
    (dateKey) => {
      const d = state.allDays[dateKey] || null;
      if (d && String(d.semesterId) !== String(state.activeSemesterId)) {
        return null;
      }
      return d;
    },
    [state.activeSemesterId, state.allDays]
  );

  const saveDayRecord = useCallback(
    async (dateKey, dayData) => {
      const payload = {
        ...dayData,
        semesterId: state.activeSemesterId,
        date: dateKey,
      };

      const originalAllDays = { ...state.allDays };
      dispatch({
        type: ACTIONS.SET_DAYS,
        payload: { ...state.allDays, [dateKey]: payload },
      });

      try {
        const saved = await api.saveDay(payload);
        dispatch({
          type: ACTIONS.SET_DAYS,
          payload: { ...state.allDays, [dateKey]: saved },
        });
      } catch (error) {
        console.error('Failed to save day:', error);
        dispatch({ type: ACTIONS.SET_DAYS, payload: originalAllDays });
        throw error;
      }
    },
    [state.activeSemesterId, state.allDays]
  );

  // --- Timetable ---
  const getTimetableForSemester = useCallback(() => {
    if (state.timetable && String(state.timetable.semesterId) === String(state.activeSemesterId)) {
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
    return { semesterId: state.activeSemesterId, slots: {} };
  }, [state.activeSemesterId, state.timetable]);

  const updateTimetableSlots = useCallback(
    async (dayOfWeek, slots) => {
      if (!state.timetable) return;

      const originalTimetable = { ...state.timetable };
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

      try {
        await api.updateTimetable({
          semesterId: state.activeSemesterId,
          dayOfWeek,
          slots,
        });
      } catch (error) {
        console.error('Failed to update timetable:', error);
        dispatch({ type: ACTIONS.SET_TIMETABLE, payload: originalTimetable });
        throw error;
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
      const tempHoliday = {
        id: `temp_${Date.now()}`,
        semesterId: state.activeSemesterId,
        date: data.date,
        name: data.name || 'Holiday',
        type: data.type || 'manual',
      };

      const originalHolidays = [...state.holidays];
      dispatch({ type: ACTIONS.SET_HOLIDAYS, payload: [...state.holidays, tempHoliday] });

      try {
        const holiday = await api.createHoliday({
          ...data,
          semesterId: state.activeSemesterId,
        });
        dispatch({
          type: ACTIONS.SET_HOLIDAYS,
          payload: [...originalHolidays, holiday],
        });
        return holiday;
      } catch (error) {
        console.error('Failed to add holiday:', error);
        dispatch({ type: ACTIONS.SET_HOLIDAYS, payload: originalHolidays });
        throw error;
      }
    },
    [state.activeSemesterId, state.holidays]
  );

  const removeHolidayFromSemester = useCallback(
    async (id) => {
      const originalHolidays = [...state.holidays];
      dispatch({
        type: ACTIONS.SET_HOLIDAYS,
        payload: state.holidays.filter((h) => h.id !== id && h._id?.toString() !== id),
      });

      try {
        await api.deleteHoliday(id);
      } catch (error) {
        console.error('Failed to delete holiday:', error);
        dispatch({ type: ACTIONS.SET_HOLIDAYS, payload: originalHolidays });
        throw error;
      }
    },
    [state.holidays]
  );

  // --- Reset Attendance ---
  const resetAttendance = useCallback(async () => {
    if (!state.activeSemesterId) return;
    try {
      await api.resetAttendance(state.activeSemesterId);
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
    return state.semesters.find((s) => s.id === state.activeSemesterId) || null;
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

      // Backup Export / Import
      exportBackup: () => {
        const data = {
          semesters: state.semesters,
          subjects: state.subjects,
          days: state.allDays,
          timetable: state.timetable,
          holidays: state.holidays,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attenda-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
      importBackup: async (jsonData) => {
        try {
          storageImportBackup(jsonData);
          await syncLocalStorageToServer();
          await bootstrap(state.activeSemesterId);
        } catch (e) {
          throw new Error('Invalid backup file: ' + e.message);
        }
      },
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
      syncLocalStorageToServer,
      bootstrap,
    ]
  );

  return <AttendaContext.Provider value={contextValue}>{children}</AttendaContext.Provider>;
}

export function useAttenda() {
  const ctx = useContext(AttendaContext);
  if (!ctx) throw new Error('useAttenda must be used within AttendaProvider');
  return ctx;
}
