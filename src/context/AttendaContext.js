// @/context/AttendaContext.js
'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import {
  loadAll,
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
  getAllDayDates,
  getHolidays as storageGetHolidays,
  addHoliday as storageAddHoliday,
  removeHoliday as storageRemoveHoliday,
  exportBackup as storageExportBackup,
  importBackup as storageImportBackup,
  persist,
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
  SET_ACTIVE_SEMESTER: 'SET_ACTIVE_SEMESTER',
  SET_SEMESTERS: 'SET_SEMESTERS',
  SET_SUBJECTS: 'SET_SUBJECTS',
  SET_TODAY_STATUS: 'SET_TODAY_STATUS',
  SET_LOADING: 'SET_LOADING',
  SET_INITIALIZED: 'SET_INITIALIZED',
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_ACTIVE_SEMESTER:
      return { ...state, activeSemesterId: action.payload };
    case ACTIONS.SET_SEMESTERS:
      return { ...state, semesters: action.payload };
    case ACTIONS.SET_SUBJECTS:
      return { ...state, subjects: action.payload };
    case ACTIONS.SET_TODAY_STATUS:
      return { ...state, todayStatus: action.payload };
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ACTIONS.SET_INITIALIZED:
      return { ...state, isInitialized: true, isLoading: false };
    default:
      return state;
  }
}

const initialState = {
  semesters: [],
  subjects: [],
  activeSemesterId: null,
  todayStatus: null,
  isLoading: true,
  isInitialized: false,
};

const AttendaContext = createContext(null);

export function AttendaProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Initialize from localStorage
  useEffect(() => {
    const store = loadAll();
    const semesters = getSemesters();

    // Set active semester to the first one, or stored preference
    let activeId = null;
    try {
      const stored = localStorage.getItem('attenda_active_semester');
      if (stored && semesters.some((s) => s.id === stored)) {
        activeId = stored;
      }
    } catch {}
    if (!activeId && semesters.length > 0) {
      activeId = semesters[semesters.length - 1].id;
    }

    dispatch({ type: ACTIONS.SET_SEMESTERS, payload: semesters });
    dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: activeId });
    dispatch({ type: ACTIONS.SET_INITIALIZED });
  }, []);

  // When activeSemesterId changes, update subjects
  useEffect(() => {
    if (state.activeSemesterId) {
      const subjects = storageGetSubjects(state.activeSemesterId);
      dispatch({ type: ACTIONS.SET_SUBJECTS, payload: subjects });
    } else {
      dispatch({ type: ACTIONS.SET_SUBJECTS, payload: [] });
    }
  }, [state.activeSemesterId]);

  // --- Semester operations ---
  const setActiveSemester = useCallback((id) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: id });
    try {
      localStorage.setItem('attenda_active_semester', id);
    } catch {}
  }, []);

  const addSemester = useCallback((data) => {
    const sem = storageCreateSemester(data);
    const semesters = getSemesters();
    dispatch({ type: ACTIONS.SET_SEMESTERS, payload: semesters });
    dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: sem.id });
    try {
      localStorage.setItem('attenda_active_semester', sem.id);
    } catch {}
    return sem;
  }, []);

  const editSemester = useCallback((id, updates) => {
    storageUpdateSemester(id, updates);
    const semesters = getSemesters();
    dispatch({ type: ACTIONS.SET_SEMESTERS, payload: semesters });
  }, []);

  const removeSemester = useCallback(
    (id) => {
      storageDeleteSemester(id);
      const semesters = getSemesters();
      dispatch({ type: ACTIONS.SET_SEMESTERS, payload: semesters });
      // If we deleted the active one, switch
      if (state.activeSemesterId === id) {
        const newActive = semesters.length > 0 ? semesters[semesters.length - 1].id : null;
        dispatch({ type: ACTIONS.SET_ACTIVE_SEMESTER, payload: newActive });
        try {
          localStorage.setItem('attenda_active_semester', newActive || '');
        } catch {}
      }
    },
    [state.activeSemesterId]
  );

  // --- Subject operations ---
  const addSubject = useCallback(
    (data) => {
      storageCreateSubject(data);
      const subjects = storageGetSubjects(state.activeSemesterId);
      dispatch({ type: ACTIONS.SET_SUBJECTS, payload: subjects });
    },
    [state.activeSemesterId]
  );

  const editSubject = useCallback(
    (id, updates) => {
      storageUpdateSubject(id, updates);
      const subjects = storageGetSubjects(state.activeSemesterId);
      dispatch({ type: ACTIONS.SET_SUBJECTS, payload: subjects });
    },
    [state.activeSemesterId]
  );

  const removeSubject = useCallback(
    (id) => {
      storageDeleteSubject(id);
      const subjects = storageGetSubjects(state.activeSemesterId);
      dispatch({ type: ACTIONS.SET_SUBJECTS, payload: subjects });
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

    const existing = getDay(dateKey);
    if (existing) {
      dispatch({ type: ACTIONS.SET_TODAY_STATUS, payload: existing });
    }
    return existing;
  }, []);

  const saveToday = useCallback(
    (dayData) => {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;

      const existing = getDay(dateKey);
      storageSaveDay(dateKey, {
        ...existing,
        ...dayData,
        semesterId: state.activeSemesterId,
        date: dateKey,
      });

      const saved = getDay(dateKey);
      dispatch({ type: ACTIONS.SET_TODAY_STATUS, payload: saved });
      return saved;
    },
    [state.activeSemesterId]
  );

  // --- Day operations ---
  const getSavedDay = useCallback((dateKey) => {
    return getDay(dateKey);
  }, []);

  const saveDayRecord = useCallback(
    (dateKey, dayData) => {
      storageSaveDay(dateKey, {
        ...dayData,
        semesterId: state.activeSemesterId,
        date: dateKey,
      });
    },
    [state.activeSemesterId]
  );

  const getAllDays = useCallback(() => {
    if (!state.activeSemesterId) return {};
    const dates = getAllDayDates(state.activeSemesterId);
    const days = {};
    dates.forEach((date) => {
      days[date] = getDay(date);
    });
    return days;
  }, [state.activeSemesterId]);

  // --- Timetable ---
  const getTimetableForSemester = useCallback(() => {
    if (!state.activeSemesterId) return { semesterId: null, slots: {} };
    return storageGetTimetable(state.activeSemesterId);
  }, [state.activeSemesterId]);

  const updateTimetableSlots = useCallback(
    (dayOfWeek, slots) => {
      if (!state.activeSemesterId) return;
      storageSetTimetableSlots(state.activeSemesterId, dayOfWeek, slots);
    },
    [state.activeSemesterId]
  );

  // --- Holidays ---
  const getHolidaysForSemester = useCallback(() => {
    if (!state.activeSemesterId) return [];
    return storageGetHolidays(state.activeSemesterId);
  }, [state.activeSemesterId]);

  const addHolidayToSemester = useCallback(
    (data) => {
      if (!state.activeSemesterId) return null;
      return storageAddHoliday({ ...data, semesterId: state.activeSemesterId });
    },
    [state.activeSemesterId]
  );

  const removeHolidayFromSemester = useCallback((id) => {
    storageRemoveHoliday(id);
  }, []);

  // --- Computed values ---
  const activeSemester = useMemo(() => {
    if (!state.activeSemesterId) return null;
    return getSemester(state.activeSemesterId);
  }, [state.activeSemesterId, state.semesters]);

  const allDays = useMemo(() => {
    if (!state.activeSemesterId) return {};
    const dates = getAllDayDates(state.activeSemesterId);
    const days = {};
    dates.forEach((date) => {
      days[date] = getDay(date);
    });
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeSemesterId]);

  const collegeStats = useMemo(() => {
    if (!activeSemester) return null;
    const holidays = storageGetHolidays(state.activeSemesterId);
    return computeCollegeAttendance(activeSemester, allDays, holidays);
  }, [activeSemester, state.activeSemesterId, allDays]);

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
    const timetable = storageGetTimetable(state.activeSemesterId);
    return getTodaysLectures(timetable, state.subjects);
  }, [state.activeSemesterId, state.subjects]);

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
      getAllDays,

      // Timetable
      getTimetableForSemester,
      updateTimetableSlots,

      // Holidays
      getHolidaysForSemester,
      addHolidayToSemester,
      removeHolidayFromSemester,

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
      getAllDays,
      getTimetableForSemester,
      updateTimetableSlots,
      getHolidaysForSemester,
      addHolidayToSemester,
      removeHolidayFromSemester,
    ]
  );

  return <AttendaContext.Provider value={contextValue}>{children}</AttendaContext.Provider>;
}

export function useAttenda() {
  const ctx = useContext(AttendaContext);
  if (!ctx) throw new Error('useAttenda must be used within AttendaProvider');
  return ctx;
}
