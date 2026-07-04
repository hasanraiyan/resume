'use client';

import { useAttenda } from '@/context/AttendaContext';
import { useState } from 'react';
import { formatTime12H } from '@/utils/string';
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
  ChevronDown,
  ChevronUp,
  Check,
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
  const [expandedSubjectId, setExpandedSubjectId] = useState(null);
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
        <div className="space-y-3">
          {subjects.map((subject) => {
            const isExpanded = expandedSubjectId === subject.id;
            const syllabus = subject.syllabus || [];
            // Flatten all topics across all modules for progress stats
            const allTopics = syllabus.flatMap((m) => m.topics || []);
            const totalTopics = allTopics.length;
            const completedTopics = allTopics.filter((t) => t.status === 'completed').length;
            const completionRate =
              totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

            return (
              <div
                key={subject.id}
                className="rounded-xl border border-[#e5e3d8] bg-white overflow-hidden transition-all duration-200"
              >
                {/* Subject Row Header */}
                <div
                  onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#fcfbf5] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#1e3a34] truncate">{subject.name}</p>
                        {totalTopics > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f0f5f2] text-[#1f644e] font-semibold">
                            {completionRate}% syllabus
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#7c8e88] truncate">
                        {subject.facultyName && `${subject.facultyName} · `}
                        {subject.requiredAttendance}% required
                        {subject.credits ? ` · ${subject.credits} credits` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditingSubject(subject);
                        setShowSubjectModal(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-[#f0f5f2] transition-colors cursor-pointer"
                      title="Edit Subject"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#7c8e88]" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${subject.name}"?`)) removeSubject(subject.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-[#fef2f2] transition-colors cursor-pointer"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#c94c4c]" />
                    </button>
                    <button
                      onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
                      className="p-1.5 rounded-lg hover:bg-[#f0f5f2] transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#7c8e88]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#7c8e88]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Syllabus Details */}
                {isExpanded && (
                  <div className="border-t border-[#e5e3d8]/60 bg-[#fcfbf5]/40 p-4 animate-in slide-in-from-top-1 duration-150">
                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center text-xs font-bold text-[#7c8e88] mb-1.5">
                        <span>Syllabus Completion</span>
                        <span className="text-[#1e3a34]">
                          {completedTopics} of {totalTopics} topics ({completionRate}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#e5e3d8]/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#1f644e] to-[#2ecc71] transition-all duration-300 rounded-full"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Syllabus Modules & Topics */}
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {syllabus.length === 0 ? (
                        <div className="text-center py-6 text-xs text-[#7c8e88] italic bg-white/40 rounded-xl border border-dashed border-[#e5e3d8]">
                          No modules added to syllabus yet. Add a module below to get started.
                        </div>
                      ) : (
                        syllabus.map((mod) => {
                          const topics = mod.topics || [];
                          return (
                            <div
                              key={mod.id}
                              className="rounded-xl border border-[#e5e3d8] bg-white/60 overflow-hidden"
                            >
                              {/* Module Header */}
                              <div className="flex items-center justify-between px-3 py-2 bg-[#f0f5f2]/60 border-b border-[#e5e3d8]/40">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <BookOpen className="w-3.5 h-3.5 text-[#1f644e] shrink-0" />
                                  <span className="text-xs font-bold text-[#1e3a34] truncate">
                                    {mod.title}
                                  </span>
                                  <span className="text-[10px] text-[#7c8e88] font-medium">
                                    {topics.filter((t) => t.status === 'completed').length}/
                                    {topics.length} topics
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    const newSyllabus = syllabus.filter((m) => m !== mod);
                                    editSubject(subject.id, { syllabus: newSyllabus });
                                  }}
                                  className="p-1 rounded hover:bg-[#fef2f2] hover:text-[#c94c4c] transition-colors cursor-pointer shrink-0"
                                  title="Delete Module"
                                >
                                  <Trash2 className="w-3 h-3 text-[#c94c4c]" />
                                </button>
                              </div>

                              {/* Topics within module */}
                              <div className="p-2 space-y-1">
                                {topics.length === 0 ? (
                                  <div className="text-center py-3 text-[10px] text-[#b0bfba] italic">
                                    No topics in this module yet.
                                  </div>
                                ) : (
                                  topics.map((topic, tIdx) => {
                                    const statusColors = {
                                      not_started:
                                        'text-[#7c8e88] border-[#e5e3d8] bg-white hover:bg-neutral-50',
                                      in_progress:
                                        'text-amber-600 border-amber-200 bg-amber-50/50 hover:bg-amber-50',
                                      completed:
                                        'text-[#1f644e] border-[#1f644e]/20 bg-[#1f644e]/5 hover:bg-[#1f644e]/10',
                                    };

                                    return (
                                      <div
                                        key={topic.id || tIdx}
                                        className={`flex items-center justify-between p-2 rounded-lg border text-[11px] transition-all ${statusColors[topic.status] || statusColors.not_started}`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          {/* Status toggle */}
                                          <button
                                            onClick={() => {
                                              const nextStatusMap = {
                                                not_started: 'in_progress',
                                                in_progress: 'completed',
                                                completed: 'not_started',
                                              };
                                              const nextStatus =
                                                nextStatusMap[topic.status] || 'not_started';
                                              const newSyllabus = syllabus.map((m) => {
                                                if (m !== mod) return m;
                                                return {
                                                  ...m,
                                                  topics: (m.topics || []).map((t) => {
                                                    if (t !== topic) return t;
                                                    return {
                                                      ...t,
                                                      status: nextStatus,
                                                      completedAt:
                                                        nextStatus === 'completed'
                                                          ? new Date().toISOString()
                                                          : null,
                                                    };
                                                  }),
                                                };
                                              });
                                              editSubject(subject.id, { syllabus: newSyllabus });
                                            }}
                                            className="focus:outline-none cursor-pointer shrink-0"
                                          >
                                            {topic.status === 'not_started' && (
                                              <div className="w-3.5 h-3.5 rounded-full border-2 border-[#7c8e88]/40 hover:border-[#1f644e] transition-colors" />
                                            )}
                                            {topic.status === 'in_progress' && (
                                              <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 bg-amber-50 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                              </div>
                                            )}
                                            {topic.status === 'completed' && (
                                              <div className="w-3.5 h-3.5 rounded-full bg-[#1f644e] text-white flex items-center justify-center">
                                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                              </div>
                                            )}
                                          </button>

                                          <span
                                            className={`font-medium min-w-0 truncate ${topic.status === 'completed' ? 'line-through opacity-60' : ''}`}
                                          >
                                            {topic.title}
                                          </span>
                                        </div>

                                        <button
                                          onClick={() => {
                                            const newSyllabus = syllabus.map((m) => {
                                              if (m !== mod) return m;
                                              return {
                                                ...m,
                                                topics: (m.topics || []).filter((t) => t !== topic),
                                              };
                                            });
                                            editSubject(subject.id, { syllabus: newSyllabus });
                                          }}
                                          className="p-1 rounded hover:bg-[#fef2f2] hover:text-[#c94c4c] transition-colors cursor-pointer shrink-0 ml-1"
                                          title="Delete Topic"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    );
                                  })
                                )}

                                {/* Add topic to this module */}
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    const input = e.target.elements[`topicTitle_${mod.id}`];
                                    const title = input.value.trim();
                                    if (!title) return;

                                    const newTopic = {
                                      title,
                                      status: 'not_started',
                                    };
                                    const newSyllabus = syllabus.map((m) => {
                                      if (m !== mod) return m;
                                      return {
                                        ...m,
                                        topics: [...(m.topics || []), newTopic],
                                      };
                                    });
                                    editSubject(subject.id, { syllabus: newSyllabus });
                                    input.value = '';
                                  }}
                                  className="flex gap-1.5 mt-1.5"
                                >
                                  <input
                                    name={`topicTitle_${mod.id}`}
                                    type="text"
                                    placeholder="Add topic..."
                                    className="flex-1 px-2.5 py-1.5 text-[11px] rounded-lg border border-[#e5e3d8] bg-white outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10 text-[#1e3a34]"
                                  />
                                  <button
                                    type="submit"
                                    className="px-2.5 py-1.5 text-[11px] font-bold bg-[#1f644e] text-white rounded-lg hover:bg-[#17503e] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add</span>
                                  </button>
                                </form>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add Module Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.target.elements.moduleTitle;
                        const title = input.value.trim();
                        if (!title) return;

                        const newModule = {
                          title,
                          topics: [],
                        };
                        const newSyllabus = [...syllabus, newModule];
                        editSubject(subject.id, { syllabus: newSyllabus });
                        input.value = '';
                      }}
                      className="mt-3.5 flex gap-2"
                    >
                      <input
                        name="moduleTitle"
                        type="text"
                        placeholder="Add new module (e.g. Unit 1: Introduction)..."
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#e5e3d8] bg-white outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/10 text-[#1e3a34]"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 text-xs font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Module</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
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
                onClick={() => {
                  if (isExpanded) {
                    setExpandedDay(null);
                  } else {
                    setExpandedDay(dayIdx);
                    setNewSlot({ subjectId: '', startTime: '09:00', endTime: '10:00' });
                  }
                }}
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
                            {formatTime12H(slot.startTime)} - {formatTime12H(slot.endTime)}
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
                        setNewSlot({ subjectId: '', startTime: '09:00', endTime: '10:00' });
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
