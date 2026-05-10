'use client';

import { Save, Plus, Trash2 } from 'lucide-react';
import { useCoursifyStudio } from '@/context/CoursifyStudioContext';

const AUTHORING_STATUS_COLORS = {
  idea: 'bg-gray-100 text-gray-600',
  researching: 'bg-blue-100 text-blue-700',
  planned: 'bg-purple-100 text-purple-700',
  drafting: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-orange-100 text-orange-700',
  ready: 'bg-emerald-100 text-emerald-700',
};

function PlanCard({ label, children }) {
  return (
    <div className="bg-white border border-[#e5e3d8] rounded-xl p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] mb-2">{label}</p>
      {children}
    </div>
  );
}

function PlanText({ value, placeholder }) {
  return value ? (
    <p className="text-sm text-[#1e3a34] leading-relaxed">{value}</p>
  ) : (
    <p className="text-sm text-[#7c8e88] italic">{placeholder}</p>
  );
}

export function PlanningWorkspace() {
  const {
    course,
    editMode,
    planDraft,
    planSaving,
    showNoteForm,
    noteForm,
    noteSaving,
    setPlanDraft,
    setShowNoteForm,
    setNoteForm,
    handleSavePlan,
    handleAddNote,
    handleDeleteNote,
  } = useCoursifyStudio();

  if (!course) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-10 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1e3a34]">Planning Workspace</h2>
        {editMode && planDraft && !course.isFrozen && (
          <button
            onClick={handleSavePlan}
            disabled={planSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f644e] text-white rounded-xl text-xs font-bold hover:bg-[#17503e] transition-colors disabled:opacity-50"
          >
            {planSaving ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Plan
          </button>
        )}
      </div>

      <PlanCard label="Authoring Status">
        {editMode && planDraft && !course.isFrozen ? (
          <select
            value={planDraft.authoringStatus}
            onChange={(e) => setPlanDraft((d) => ({ ...d, authoringStatus: e.target.value }))}
            className="text-xs font-bold capitalize px-2.5 py-1.5 border border-[#e5e3d8] rounded-lg bg-[#f9f9f7] focus:outline-none focus:border-[#1f644e] text-[#1e3a34]"
          >
            {['idea', 'researching', 'planned', 'drafting', 'reviewing', 'ready'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
              AUTHORING_STATUS_COLORS[course.authoringStatus] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {course.authoringStatus || 'idea'}
          </span>
        )}
      </PlanCard>

      <PlanCard label="Target Audience">
        {editMode && planDraft && !course.isFrozen ? (
          <textarea
            rows={2}
            value={planDraft.targetAudience}
            onChange={(e) => setPlanDraft((d) => ({ ...d, targetAudience: e.target.value }))}
            placeholder="Who is this course for?"
            className="w-full text-sm text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1f644e] leading-relaxed"
          />
        ) : (
          <PlanText value={course.targetAudience} placeholder="Not defined yet." />
        )}
      </PlanCard>

      <PlanCard label="Learning Objectives">
        {editMode && planDraft && !course.isFrozen ? (
          <textarea
            rows={4}
            value={planDraft.learningObjectives}
            onChange={(e) => setPlanDraft((d) => ({ ...d, learningObjectives: e.target.value }))}
            placeholder="One objective per line"
            className="w-full text-sm text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1f644e] leading-relaxed"
          />
        ) : course.learningObjectives?.length > 0 ? (
          <ul className="space-y-1">
            {course.learningObjectives.map((o, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#1e3a34]">
                <span className="text-[#1f644e] shrink-0">✓</span>
                {o}
              </li>
            ))}
          </ul>
        ) : (
          <PlanText value="" placeholder="None yet." />
        )}
      </PlanCard>

      <PlanCard label="Prerequisites">
        {editMode && planDraft && !course.isFrozen ? (
          <textarea
            rows={3}
            value={planDraft.prerequisites}
            onChange={(e) => setPlanDraft((d) => ({ ...d, prerequisites: e.target.value }))}
            placeholder="One prerequisite per line"
            className="w-full text-sm text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1f644e] leading-relaxed"
          />
        ) : course.prerequisites?.length > 0 ? (
          <ul className="space-y-1">
            {course.prerequisites.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#1e3a34]">
                <span className="text-[#7c8e88] shrink-0">•</span>
                {p}
              </li>
            ))}
          </ul>
        ) : (
          <PlanText value="" placeholder="None specified." />
        )}
      </PlanCard>

      <PlanCard label="Outcome">
        {editMode && planDraft && !course.isFrozen ? (
          <textarea
            rows={2}
            value={planDraft.outcome}
            onChange={(e) => setPlanDraft((d) => ({ ...d, outcome: e.target.value }))}
            placeholder="What will learners be able to do after this course?"
            className="w-full text-sm text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1f644e] leading-relaxed"
          />
        ) : (
          <PlanText value={course.outcome} placeholder="Not defined yet." />
        )}
      </PlanCard>

      <PlanCard label="Outline">
        {editMode && planDraft && !course.isFrozen ? (
          <textarea
            rows={8}
            value={planDraft.outline}
            onChange={(e) => setPlanDraft((d) => ({ ...d, outline: e.target.value }))}
            placeholder="Free-form outline of modules and sections…"
            className="w-full text-sm text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1f644e] leading-relaxed font-mono"
          />
        ) : course.outline ? (
          <pre className="text-sm text-[#1e3a34] whitespace-pre-wrap leading-relaxed font-mono">
            {course.outline}
          </pre>
        ) : (
          <PlanText value="" placeholder="No outline yet." />
        )}
      </PlanCard>

      <PlanCard label="Planning Notes">
        {editMode && planDraft && !course.isFrozen ? (
          <textarea
            rows={3}
            value={planDraft.planningNotes}
            onChange={(e) => setPlanDraft((d) => ({ ...d, planningNotes: e.target.value }))}
            placeholder="Internal notes, reminders, decisions…"
            className="w-full text-sm text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1f644e] leading-relaxed"
          />
        ) : (
          <PlanText value={course.planningNotes} placeholder="No notes yet." />
        )}
      </PlanCard>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
            Research Notes ({course.researchNotes?.length || 0})
          </h3>
          <button
            onClick={() => setShowNoteForm(!showNoteForm)}
            disabled={course.isFrozen}
            className={`flex items-center gap-1 px-2.5 py-1 bg-[#f0f5f2] hover:bg-[#e0ede8] text-[#1f644e] text-xs font-bold rounded-lg transition-colors ${course.isFrozen ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Plus className="w-3 h-3" />
            Add Note
          </button>
        </div>

        {showNoteForm && (
          <div className="bg-white border border-[#1f644e]/30 rounded-xl p-4 mb-4 space-y-3">
            <input
              type="text"
              value={noteForm.title}
              onChange={(e) => setNoteForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title *"
              className="w-full text-sm text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1f644e]"
            />
            <textarea
              rows={3}
              value={noteForm.summary}
              onChange={(e) => setNoteForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="Key takeaway or finding *"
              className="w-full text-sm text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1f644e]"
            />
            <div className="flex gap-2">
              <input
                type="url"
                value={noteForm.sourceUrl}
                onChange={(e) => setNoteForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                placeholder="Source URL (optional)"
                className="flex-1 text-sm text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1f644e]"
              />
              <select
                value={noteForm.sourceType}
                onChange={(e) => setNoteForm((f) => ({ ...f, sourceType: e.target.value }))}
                className="text-xs font-bold px-2.5 py-2 border border-[#e5e3d8] rounded-lg bg-[#f9f9f7] focus:outline-none focus:border-[#1f644e] text-[#1e3a34]"
              >
                {['web', 'paper', 'book', 'video', 'other'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              rows={2}
              value={noteForm.notes}
              onChange={(e) => setNoteForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Detailed notes or quotes (optional)"
              className="w-full text-sm text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1f644e]"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddNote}
                disabled={noteSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f644e] text-white rounded-lg text-xs font-bold hover:bg-[#17503e] transition-colors disabled:opacity-50"
              >
                {noteSaving ? (
                  <div className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                Save Note
              </button>
              <button
                onClick={() => setShowNoteForm(false)}
                className="px-3 py-1.5 border border-[#e5e3d8] rounded-lg text-xs font-bold text-[#7c8e88] hover:text-[#1e3a34] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {course.researchNotes?.length > 0 ? (
          <div className="space-y-3">
            {course.researchNotes.map((note, i) => (
              <div key={i} className="bg-white border border-[#e5e3d8] rounded-xl p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-[#1e3a34]">{note.title || 'Untitled'}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#f0f5f2] rounded text-[#7c8e88] capitalize">
                      {note.sourceType || 'other'}
                    </span>
                    {!course.isFrozen && (
                      <button
                        onClick={() => handleDeleteNote(i)}
                        className="p-1 rounded-md hover:bg-red-50 text-[#7c8e88] hover:text-[#c94c4c] transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                {note.summary && (
                  <p className="text-sm text-[#1e3a34] leading-relaxed">{note.summary}</p>
                )}
                {note.sourceUrl && (
                  <a
                    href={note.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#1f644e] hover:underline truncate block"
                  >
                    {note.sourceUrl}
                  </a>
                )}
                {note.notes && (
                  <p className="text-xs text-[#7c8e88] leading-relaxed border-t border-[#e5e3d8] pt-1.5">
                    {note.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-[#e5e3d8] rounded-xl p-6 text-center">
            <p className="text-sm text-[#7c8e88]">No research notes yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
