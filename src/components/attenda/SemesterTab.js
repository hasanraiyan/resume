'use client';

import { useAttenda } from '@/context/AttendaContext';
import { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  Clock,
  Calendar,
  Download,
  Upload,
  ChevronRight,
  MoreVertical,
  X,
  RotateCcw,
} from 'lucide-react';
import SemesterModal from '@/components/attenda/SemesterModal';
import SubjectModal from '@/components/attenda/SubjectModal';
import HolidayModal from '@/components/attenda/HolidayModal';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

export default function SemesterTab() {
  const {
    activeSemester,
    activeSemesterId,
    semesters,
    subjects,
    getTimetableForSemester,
    updateTimetableSlots,
    getHolidaysForSemester,
    addHolidayToSemester,
    removeHolidayFromSemester,
    addSubject,
    editSubject,
    removeSubject,
    setActiveSemester,
    addSemester,
    editSemester,
    removeSemester,
    exportBackup,
    importBackup,
    resetAttendance,
  } = useAttenda();

  const [showEditSemesterModal, setShowEditSemesterModal] = useState(false);
  const [showAddSemesterModal, setShowAddSemesterModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('subjects'); // subjects | timetable | holidays | settings
  const [expandedDay, setExpandedDay] = useState(null);
  const [timetableDay, setTimetableDay] = useState(null);
  const [newSlot, setNewSlot] = useState({ subjectId: '', startTime: '09:00', endTime: '10:00' });

  const timetable = getTimetableForSemester();
  const holidays = getHolidaysForSemester();

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        importBackup(text);
        window.location.reload();
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    };
    input.click();
  };

  const renderSubjects = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">Subjects</p>
        <button
          onClick={() => {
            setEditingSubject(null);
            setShowSubjectModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f644e] text-white text-xs font-bold rounded-lg hover:bg-[#17503e] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-10">
          <BookOpen className="w-10 h-10 text-[#e5e3d8] mx-auto mb-2" />
          <p className="text-sm text-[#7c8e88]">No subjects yet</p>
          <p className="text-xs text-[#b0bfba] mt-1">Add your first subject to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="flex items-center justify-between p-3 rounded-xl border border-[#e5e3d8] bg-white"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: subject.color }}
                />
                <div>
                  <p className="text-sm font-bold text-[#1e3a34]">{subject.name}</p>
                  <p className="text-xs text-[#7c8e88]">
                    {subject.facultyName && `${subject.facultyName} · `}
                    {subject.requiredAttendance}% required
                    {subject.credits ? ` · ${subject.credits} credits` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingSubject(subject);
                    setShowSubjectModal(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-[#f0f5f2] transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#7c8e88]" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${subject.name}"?`)) removeSubject(subject.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-[#fef2f2] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#c94c4c]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTimetable = () => (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">
        Weekly Timetable
      </p>
      <p className="text-xs text-[#7c8e88] mb-4">
        Set a weekly schedule. Lectures will auto-populate when you mark attendance.
      </p>

      <div className="space-y-2">
        {DAY_NAMES.map((dayName, dayIdx) => {
          const slots = timetable?.slots?.[dayIdx] || [];
          const isExpanded = expandedDay === dayIdx;

          return (
            <div
              key={dayIdx}
              className="rounded-xl border border-[#e5e3d8] bg-white overflow-hidden"
            >
              <button
                onClick={() => setExpandedDay(isExpanded ? null : dayIdx)}
                className="w-full flex items-center justify-between p-3 text-left cursor-pointer hover:bg-[#fcfbf5] transition-colors"
              >
                <span className="text-sm font-bold text-[#1e3a34]">{dayName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#7c8e88]">
                    {slots.length} lecture{slots.length !== 1 ? 's' : ''}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-[#7c8e88] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3">
                  {slots.map((slot) => {
                    const sub = subjects.find((s) => s.id === slot.subjectId);
                    return (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#fcfbf5] mb-1.5"
                      >
                        <div className="flex items-center gap-2">
                          {sub && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: sub.color }}
                            />
                          )}
                          <span className="text-sm font-medium text-[#1e3a34]">
                            {sub?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-[#7c8e88]">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const updatedSlots = slots.filter((s) => s.id !== slot.id);
                            updateTimetableSlots(dayIdx, updatedSlots);
                          }}
                          className="p-1 rounded hover:bg-[#fef2f2] transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-[#c94c4c]" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add slot form */}
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      value={newSlot.subjectId}
                      onChange={(e) =>
                        setNewSlot((prev) => ({ ...prev, subjectId: e.target.value }))
                      }
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#e5e3d8] bg-white text-xs text-[#1e3a34] outline-none focus:border-[#1f644e]"
                    >
                      <option value="">Select subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) =>
                        setNewSlot((prev) => ({ ...prev, startTime: e.target.value }))
                      }
                      className="w-20 px-2 py-1.5 rounded-lg border border-[#e5e3d8] bg-white text-xs text-[#1e3a34] outline-none focus:border-[#1f644e]"
                    />
                    <span className="text-xs text-[#7c8e88]">-</span>
                    <input
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot((prev) => ({ ...prev, endTime: e.target.value }))}
                      className="w-20 px-2 py-1.5 rounded-lg border border-[#e5e3d8] bg-white text-xs text-[#1e3a34] outline-none focus:border-[#1f644e]"
                    />
                    <button
                      onClick={() => {
                        if (!newSlot.subjectId || !newSlot.startTime) return;
                        const updatedSlots = [
                          ...slots,
                          {
                            id: `slot_${Date.now()}`,
                            subjectId: newSlot.subjectId,
                            startTime: newSlot.startTime,
                            endTime: newSlot.endTime,
                          },
                        ];
                        updateTimetableSlots(dayIdx, updatedSlots);
                      }}
                      disabled={!newSlot.subjectId}
                      className="p-1.5 bg-[#1f644e] text-white rounded-lg hover:bg-[#17503e] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderHolidays = () => (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">Holidays</p>
        <button
          onClick={() => setShowHolidayModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f644e] text-white text-xs font-bold rounded-lg hover:bg-[#17503e] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Holiday
        </button>
      </div>

      {activeSemester && (
        <div className="mb-4 p-3 rounded-xl bg-[#fcfbf5] border border-[#e5e3d8]">
          <p className="text-xs font-bold text-[#7c8e88] mb-1">Weekly Holidays</p>
          <p className="text-sm text-[#1e3a34]">
            {(activeSemester.weeklyHolidays || []).map((d) => DAY_NAMES[d]).join(', ') || 'None'}
          </p>
        </div>
      )}

      {holidays.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 text-[#e5e3d8] mx-auto mb-2" />
          <p className="text-sm text-[#7c8e88]">No holidays added</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {holidays.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between p-3 rounded-xl border border-[#e5e3d8] bg-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#4a86e8]" />
                <div>
                  <p className="text-sm font-bold text-[#1e3a34]">{h.name}</p>
                  <p className="text-xs text-[#7c8e88]">{h.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-[#7c8e88]">{h.type}</span>
                <button
                  onClick={() => removeHolidayFromSemester(h.id)}
                  className="p-1 rounded hover:bg-[#fef2f2] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#c94c4c]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-4">Settings</p>

      {/* Semester selector */}
      {semesters.length > 1 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-[#7c8e88] mb-2">Active Semester</p>
          <select
            value={activeSemesterId || ''}
            onChange={(e) => setActiveSemester(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#e5e3d8] bg-white text-sm text-[#1e3a34] outline-none focus:border-[#1f644e]"
          >
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Semester details */}
      {activeSemester && (
        <div className="space-y-3 mb-6">
          <p className="text-xs font-bold text-[#7c8e88] mb-2">Semester Details</p>
          <div className="rounded-xl border border-[#e5e3d8] bg-white p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[#7c8e88]">Name</p>
                <p className="font-bold text-[#1e3a34]">{activeSemester.name}</p>
              </div>
              <div>
                <p className="text-xs text-[#7c8e88]">Institution</p>
                <p className="font-bold text-[#1e3a34]">{activeSemester.institutionName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#7c8e88]">Start Date</p>
                <p className="font-bold text-[#1e3a34]">{activeSemester.startDate || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#7c8e88]">End Date</p>
                <p className="font-bold text-[#1e3a34]">{activeSemester.endDate || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#7c8e88]">Required Attendance</p>
                <p className="font-bold text-[#1e3a34]">{activeSemester.requiredAttendance}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Semester / Delete Semester */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setShowEditSemesterModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#1f644e] text-[#1f644e] text-xs font-bold rounded-xl hover:bg-[#1f644e] hover:text-white transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit Semester
        </button>
        <button
          onClick={() => {
            if (
              semesters.length > 1 &&
              confirm(`Delete "${activeSemester?.name}"? This cannot be undone.`)
            ) {
              removeSemester(activeSemesterId);
            }
          }}
          disabled={semesters.length <= 1}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#c94c4c] text-[#c94c4c] text-xs font-bold rounded-xl hover:bg-[#c94c4c] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Semester
        </button>
      </div>

      {/* Semester Actions */}
      <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-3">Actions</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowAddSemesterModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#e5e3d8] text-[#1e3a34] text-xs font-bold rounded-xl hover:bg-[#f0f5f2] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Semester
        </button>
        <button
          onClick={() => {
            if (
              confirm(
                'Reset all attendance for this semester? Subjects, timetable, and holidays will be kept.'
              )
            ) {
              resetAttendance();
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#c94c4c] text-[#c94c4c] text-xs font-bold rounded-xl hover:bg-[#c94c4c] hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Attendance
        </button>
        <button
          onClick={exportBackup}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#e5e3d8] text-[#1e3a34] text-xs font-bold rounded-xl hover:bg-[#f0f5f2] transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Export Backup
        </button>
        <button
          onClick={handleImport}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#e5e3d8] text-[#1e3a34] text-xs font-bold rounded-xl hover:bg-[#f0f5f2] transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          Import Backup
        </button>
      </div>
    </div>
  );

  const subTabs = [
    { id: 'subjects', label: 'Subjects' },
    { id: 'timetable', label: 'Timetable' },
    { id: 'holidays', label: 'Holidays' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 mb-6 pb-4 pt-6">
      {/* Sub-tab navigation */}
      <div className="flex items-center gap-1 mb-6 bg-[#f0f5f2] rounded-xl p-1">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id)}
            className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === t.id
                ? 'bg-white text-[#1f644e] shadow-sm'
                : 'text-[#7c8e88] hover:text-[#1e3a34]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'subjects' && renderSubjects()}
      {activeSubTab === 'timetable' && renderTimetable()}
      {activeSubTab === 'holidays' && renderHolidays()}
      {activeSubTab === 'settings' && renderSettings()}

      {/* Modals */}
      {showEditSemesterModal && (
        <SemesterModal
          semester={activeSemester}
          onSave={(data) => {
            editSemester(activeSemester.id, data);
            setShowEditSemesterModal(false);
          }}
          onClose={() => setShowEditSemesterModal(false)}
        />
      )}
      {showAddSemesterModal && (
        <SemesterModal
          semester={null}
          onSave={(data) => {
            addSemester(data);
            setShowAddSemesterModal(false);
          }}
          onClose={() => setShowAddSemesterModal(false)}
        />
      )}
      {showSubjectModal && (
        <SubjectModal
          subject={editingSubject}
          onSave={(data) => {
            if (editingSubject) {
              editSubject(editingSubject.id, data);
            } else {
              addSubject({ ...data, semesterId: activeSemesterId });
            }
            setShowSubjectModal(false);
          }}
          onClose={() => setShowSubjectModal(false)}
        />
      )}
      {showHolidayModal && (
        <HolidayModal
          onSave={(data) => {
            addHolidayToSemester(data);
            setShowHolidayModal(false);
          }}
          onClose={() => setShowHolidayModal(false)}
        />
      )}
    </div>
  );
}
