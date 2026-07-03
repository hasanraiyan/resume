// @/lib/attenda/api.js
// Server API client for Attenda. All calls go through here.
// Keeps localStorage as a write-through cache for offline resilience.

import { loadAll, persist } from './storage';

async function readJson(response) {
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

// --- Bootstrap ---

export async function fetchBootstrap(semesterId) {
  const params = new URLSearchParams();
  if (semesterId) params.set('semesterId', semesterId);
  const data = await fetch(`/api/attenda/bootstrap?${params}`).then(readJson);
  return data;
}

// --- Semesters ---

export async function fetchSemesters() {
  const data = await fetch('/api/attenda/semesters').then(readJson);
  return data.semesters;
}

export async function createSemester(data) {
  const result = await fetch('/api/attenda/semesters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(readJson);
  return result.semester;
}

export async function updateSemester(id, data) {
  const result = await fetch(`/api/attenda/semesters/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(readJson);
  return result.semester;
}

export async function deleteSemester(id) {
  await fetch(`/api/attenda/semesters/${id}`, { method: 'DELETE' }).then(readJson);
}

// --- Subjects ---

export async function fetchSubjects(semesterId) {
  const params = new URLSearchParams();
  if (semesterId) params.set('semesterId', semesterId);
  const data = await fetch(`/api/attenda/subjects?${params}`).then(readJson);
  return data.subjects;
}

export async function createSubject(data) {
  const result = await fetch('/api/attenda/subjects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(readJson);
  return result.subject;
}

export async function updateSubject(id, data) {
  const result = await fetch(`/api/attenda/subjects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(readJson);
  return result.subject;
}

export async function deleteSubject(id) {
  await fetch(`/api/attenda/subjects/${id}`, { method: 'DELETE' }).then(readJson);
}

// --- Days ---

export async function fetchDays(semesterId) {
  const params = new URLSearchParams();
  if (semesterId) params.set('semesterId', semesterId);
  const data = await fetch(`/api/attenda/days?${params}`).then(readJson);
  return data.days;
}

export async function saveDay(dayData) {
  const result = await fetch('/api/attenda/days', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dayData),
  }).then(readJson);
  return result.day;
}

// --- Timetable ---

export async function fetchTimetable(semesterId) {
  const params = new URLSearchParams();
  if (semesterId) params.set('semesterId', semesterId);
  const data = await fetch(`/api/attenda/timetable?${params}`).then(readJson);
  return data.timetable;
}

export async function updateTimetable(data) {
  const result = await fetch('/api/attenda/timetable', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(readJson);
  return result.timetable;
}

// --- Holidays ---

export async function fetchHolidays(semesterId) {
  const params = new URLSearchParams();
  if (semesterId) params.set('semesterId', semesterId);
  const data = await fetch(`/api/attenda/holidays?${params}`).then(readJson);
  return data.holidays;
}

export async function createHoliday(data) {
  const result = await fetch('/api/attenda/holidays', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(readJson);
  return result.holiday;
}

export async function deleteHoliday(id) {
  const params = new URLSearchParams();
  params.set('id', id);
  await fetch(`/api/attenda/holidays?${params}`, { method: 'DELETE' }).then(readJson);
}
