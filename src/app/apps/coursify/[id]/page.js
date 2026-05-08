'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Pacifico, Nunito, Lora } from 'next/font/google';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Globe,
  Lock,
  ChevronRight,
  BookOpen,
  ExternalLink,
  RefreshCw,
  Layers,
  Clock,
  Menu,
  X,
  Tag,
  ImagePlus,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import EditSectionModal from '@/components/coursify/EditSectionModal';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-logo',
  display: 'swap',
});

const nunito = Nunito({
  weight: ['400', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const lora = Lora({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

const DIFFICULTY_COLORS = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

const AUTHORING_STATUS_COLORS = {
  idea: 'bg-gray-100 text-gray-600',
  researching: 'bg-blue-100 text-blue-700',
  planned: 'bg-purple-100 text-purple-700',
  drafting: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-orange-100 text-orange-700',
  ready: 'bg-emerald-100 text-emerald-700',
};

const SECTION_STATUS_DOT = {
  planned: 'bg-gray-300',
  draft: 'bg-amber-400',
  needs_review: 'bg-orange-400',
  complete: 'bg-emerald-500',
};

const RESOURCE_ICONS = {
  video: '▶',
  article: '📄',
  doc: '📘',
  other: '🔗',
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

function SectionButton({ section, index, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-colors group flex items-center gap-2.5 ${
        active ? 'bg-[#1f644e] text-white' : 'text-[#1e3a34] hover:bg-[#f0f5f2]'
      }`}
    >
      {index !== undefined && (
        <span
          className={`text-[10px] font-bold shrink-0 w-5 h-5 rounded flex items-center justify-center ${
            active ? 'bg-white/20 text-white' : 'bg-[#e5e3d8] text-[#7c8e88]'
          }`}
        >
          {index + 1}
        </span>
      )}
      <span className="text-xs font-bold truncate flex-1">{section.title}</span>
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-white/60' : SECTION_STATUS_DOT[section.status] || 'bg-gray-300'}`}
      />
    </button>
  );
}

export default function CourseDetailPage({ params }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [editingSection, setEditingSection] = useState(null);
  const [showNewSection, setShowNewSection] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMeta, setShowMeta] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const thumbnailInputRef = useRef(null);
  const [planDraft, setPlanDraft] = useState(null);
  const [planSaving, setPlanSaving] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({
    title: '',
    summary: '',
    sourceUrl: '',
    sourceType: 'other',
    notes: '',
  });
  const [noteSaving, setNoteSaving] = useState(false);

  const fetchCourse = useCallback(
    async (silent = false) => {
      try {
        if (silent) setIsRefreshing(true);
        else setIsLoading(true);

        const res = await fetch(`/api/coursify/courses/${id}`);
        const data = await res.json();
        if (data.success) {
          setCourse(data.course);
          setSections(data.sections);
          setModules(data.modules || []);
          setActiveSection((prev) => {
            if (prev) return prev;
            return data.sections[0]?._id || null;
          });
        } else {
          toast.error(data.error || 'Failed to load course');
        }
      } catch {
        toast.error('Connection error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (session?.user?.role === 'admin') fetchCourse();
  }, [session, fetchCourse]);

  useEffect(() => {
    if (editMode && course) {
      setPlanDraft({
        authoringStatus: course.authoringStatus || 'idea',
        targetAudience: course.targetAudience || '',
        learningObjectives: (course.learningObjectives || []).join('\n'),
        prerequisites: (course.prerequisites || []).join('\n'),
        outcome: course.outcome || '',
        outline: course.outline || '',
        planningNotes: course.planningNotes || '',
      });
    } else if (!editMode) {
      setPlanDraft(null);
      setShowNoteForm(false);
    }
  }, [editMode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') return null;
  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    router.push('/login');
    return null;
  }

  const currentSection = sections.find((s) => s._id === activeSection);

  const handleTogglePublish = async () => {
    const res = await fetch(`/api/coursify/courses/${id}/publish`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setCourse((c) => ({ ...c, status: data.course.status }));
      toast.success(data.course.status === 'published' ? 'Published' : 'Unpublished');
    }
  };

  const handleSaveSection = async (payload) => {
    if (editingSection) {
      const res = await fetch(`/api/coursify/sections/${editingSection._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSections((prev) => prev.map((s) => (s._id === editingSection._id ? data.section : s)));
        toast.success('Section updated');
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } else {
      const res = await fetch(`/api/coursify/courses/${id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSections((prev) => [...prev, data.section]);
        setActiveSection(data.section._id);
        toast.success('Section added');
      } else {
        toast.error(data.error || 'Failed to add section');
      }
    }
    setEditingSection(null);
    setShowNewSection(false);
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm('Delete this section?')) return;
    const res = await fetch(`/api/coursify/sections/${sectionId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setSections((prev) => prev.filter((s) => s._id !== sectionId));
      if (activeSection === sectionId) {
        const remaining = sections.filter((s) => s._id !== sectionId);
        setActiveSection(remaining[0]?._id || null);
      }
      toast.success('Section deleted');
    }
  };

  const handleSavePlan = async () => {
    if (!planDraft) return;
    setPlanSaving(true);
    try {
      const body = {
        ...planDraft,
        learningObjectives: planDraft.learningObjectives
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        prerequisites: planDraft.prerequisites
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const res = await fetch(`/api/coursify/courses/${id}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setCourse((c) => ({ ...c, ...body }));
        toast.success('Plan saved');
      } else {
        toast.error(data.error || 'Failed to save plan');
      }
    } catch {
      toast.error('Save failed');
    } finally {
      setPlanSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteForm.title.trim() || !noteForm.summary.trim()) {
      toast.error('Title and summary are required');
      return;
    }
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/coursify/courses/${id}/research-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteForm),
      });
      const data = await res.json();
      if (data.success) {
        setCourse((c) => ({ ...c, researchNotes: data.researchNotes }));
        setNoteForm({ title: '', summary: '', sourceUrl: '', sourceType: 'other', notes: '' });
        setShowNoteForm(false);
        toast.success('Note added');
      } else {
        toast.error(data.error || 'Failed to add note');
      }
    } catch {
      toast.error('Failed to add note');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (index) => {
    if (!confirm('Delete this research note?')) return;
    try {
      const res = await fetch(`/api/coursify/courses/${id}/research-notes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      const data = await res.json();
      if (data.success) {
        setCourse((c) => ({ ...c, researchNotes: data.researchNotes }));
        toast.success('Note deleted');
      } else {
        toast.error(data.error || 'Failed to delete note');
      }
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/coursify/courses/${id}/thumbnail`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        setCourse((c) => ({ ...c, thumbnail: data.thumbnail, thumbnailGenerating: false }));
        toast.success('Thumbnail updated');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setThumbnailUploading(false);
      e.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div
        className={`h-screen bg-[#fcfbf5] ${pacifico.variable} ${nunito.variable} font-[family-name:var(--font-sans)]`}
      >
        <div className="h-14 border-b border-[#e5e3d8] bg-white animate-pulse" />
        <div className="flex">
          <div className="w-72 min-h-screen border-r border-[#e5e3d8] bg-white hidden lg:block animate-pulse" />
          <div className="flex-1 p-6 lg:p-10 space-y-4 max-w-3xl">
            <div className="h-5 bg-[#e5e3d8] rounded w-1/3 animate-pulse" />
            <div className="h-7 bg-[#e5e3d8] rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-[#e5e3d8] rounded w-full animate-pulse" />
            <div className="h-4 bg-[#e5e3d8] rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-[#e5e3d8] rounded w-5/6 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div
        className={`min-h-screen bg-[#fcfbf5] ${pacifico.variable} ${nunito.variable} font-[family-name:var(--font-sans)] flex items-center justify-center`}
      >
        <div className="text-center">
          <p className="text-[#7c8e88] mb-4">Course not found</p>
          <button
            onClick={() => router.push('/apps/coursify')}
            className="text-[#1f644e] font-bold text-sm"
          >
            Back to Coursify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex flex-col ${pacifico.variable} ${nunito.variable} ${lora.variable}`}
    >
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e5e3d8] px-4 lg:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
        {/* Left: back + title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => router.push('/apps/coursify')}
            className="p-1.5 hover:bg-[#f0f5f2] rounded-full transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-bold text-[#1e3a34] text-sm lg:text-base truncate">{course.title}</h1>
        </div>

        {/* Center: tab switcher */}
        <div className="hidden sm:flex items-center gap-0.5 bg-[#f0f5f2] rounded-xl p-0.5 shrink-0">
          {['content', 'planning'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-white text-[#1e3a34] shadow-sm'
                  : 'text-[#7c8e88] hover:text-[#1e3a34]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => fetchCourse(true)}
            title="Refresh"
            className={`p-1.5 rounded-lg text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2] transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleTogglePublish}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              course.status === 'published'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-white border-[#e5e3d8] text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e]'
            }`}
          >
            {course.status === 'published' ? (
              <>
                <Globe className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">Published</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">Draft</span>
              </>
            )}
          </button>

          <button
            onClick={() => setEditMode((v) => !v)}
            title={editMode ? 'Exit edit mode' : 'Edit'}
            className={`p-1.5 rounded-lg border transition-colors ${
              editMode
                ? 'bg-[#1f644e] border-[#1f644e] text-white'
                : 'border-[#e5e3d8] bg-white text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e]'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Sidebar toggle — mobile only */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg border border-[#e5e3d8] bg-white text-[#7c8e88] lg:hidden"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Course meta strip (desktop only) ── */}
      {showMeta && (
        <div className="hidden lg:flex items-center gap-3 px-6 py-2 bg-[#fcfbf5] border-b border-[#e5e3d8] shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${DIFFICULTY_COLORS[course.difficulty] || DIFFICULTY_COLORS.beginner}`}
          >
            {course.difficulty}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${AUTHORING_STATUS_COLORS[course.authoringStatus] || 'bg-gray-100 text-gray-600'}`}
          >
            {course.authoringStatus || 'idea'}
          </span>
          {course.estimatedDuration && (
            <span className="flex items-center gap-1 text-[10px] text-[#7c8e88] font-bold">
              <Clock className="w-3 h-3" />
              {course.estimatedDuration}
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] text-[#7c8e88] font-bold">
            <Layers className="w-3 h-3" />
            {sections.length} section{sections.length !== 1 ? 's' : ''}
          </span>
          {course.tags?.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[#7c8e88]">
              <Tag className="w-3 h-3" />
              {course.tags.slice(0, 3).join(', ')}
              {course.tags.length > 3 && ` +${course.tags.length - 3}`}
            </span>
          )}
          <button
            onClick={() => setShowMeta(false)}
            className="ml-auto p-1 rounded-md text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#e5e3d8] transition-colors"
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Section Sidebar ── */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-72 shrink-0 bg-white border-r border-[#e5e3d8] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile drawer header */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#e5e3d8]">
            <span className="font-bold text-sm text-[#1e3a34]">Sections</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 hover:bg-[#f0f5f2] rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-[#7c8e88]" />
            </button>
          </div>

          {/* Desktop sidebar header */}
          <div className="hidden lg:flex items-center justify-between px-4 py-3 border-b border-[#e5e3d8]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
              {modules.length > 0 ? `${modules.length} Modules` : `Sections (${sections.length})`}
            </h2>
          </div>

          {/* Section / Module list */}
          <div className="flex-1 overflow-y-auto p-2">
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <BookOpen className="w-8 h-8 text-[#e5e3d8] mb-2" />
                <p className="text-xs text-[#7c8e88]">No sections yet</p>
              </div>
            ) : modules.length > 0 ? (
              // Module-grouped view
              <>
                {modules.map((mod) => {
                  const modSections = sections.filter((s) => s.moduleId === mod._id);
                  return (
                    <div key={mod._id} className="mb-3">
                      <div className="px-2 py-1.5 flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] truncate flex-1">
                          {mod.title}
                        </span>
                        <span className="text-[10px] text-[#7c8e88] shrink-0">
                          {modSections.length}
                        </span>
                      </div>
                      {modSections.map((section) => (
                        <SectionButton
                          key={section._id}
                          section={section}
                          active={activeSection === section._id}
                          onClick={() => {
                            setActiveSection(section._id);
                            setSidebarOpen(false);
                          }}
                        />
                      ))}
                      {modSections.length === 0 && (
                        <p className="text-[10px] text-[#7c8e88] px-3 py-1 italic">No sections</p>
                      )}
                    </div>
                  );
                })}
                {/* Unassigned sections */}
                {sections.filter((s) => !s.moduleId).length > 0 && (
                  <div className="mb-3">
                    <div className="px-2 py-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                        Unassigned
                      </span>
                    </div>
                    {sections
                      .filter((s) => !s.moduleId)
                      .map((section) => (
                        <SectionButton
                          key={section._id}
                          section={section}
                          active={activeSection === section._id}
                          onClick={() => {
                            setActiveSection(section._id);
                            setSidebarOpen(false);
                          }}
                        />
                      ))}
                  </div>
                )}
              </>
            ) : (
              // Flat view (no modules)
              sections.map((section, i) => (
                <SectionButton
                  key={section._id}
                  section={section}
                  index={i}
                  active={activeSection === section._id}
                  onClick={() => {
                    setActiveSection(section._id);
                    setSidebarOpen(false);
                  }}
                />
              ))
            )}
          </div>

          {/* Add section — only in edit mode */}
          {editMode && (
            <div className="p-3 border-t border-[#e5e3d8]">
              <button
                onClick={() => {
                  setShowNewSection(true);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-[#e5e3d8] text-xs font-bold text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Section
              </button>
            </div>
          )}
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {activeTab === 'planning' && (
            <div className="max-w-3xl mx-auto px-4 lg:px-10 py-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1e3a34]">Planning Workspace</h2>
                {editMode && planDraft && (
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

              {/* Authoring Status */}
              <PlanCard label="Authoring Status">
                {editMode && planDraft ? (
                  <select
                    value={planDraft.authoringStatus}
                    onChange={(e) =>
                      setPlanDraft((d) => ({ ...d, authoringStatus: e.target.value }))
                    }
                    className="text-xs font-bold capitalize px-2.5 py-1.5 border border-[#e5e3d8] rounded-lg bg-[#f9f9f7] focus:outline-none focus:border-[#1f644e] text-[#1e3a34]"
                  >
                    {['idea', 'researching', 'planned', 'drafting', 'reviewing', 'ready'].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold capitalize ${AUTHORING_STATUS_COLORS[course.authoringStatus] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {course.authoringStatus || 'idea'}
                  </span>
                )}
              </PlanCard>

              {/* Target Audience */}
              <PlanCard label="Target Audience">
                {editMode && planDraft ? (
                  <textarea
                    rows={2}
                    value={planDraft.targetAudience}
                    onChange={(e) =>
                      setPlanDraft((d) => ({ ...d, targetAudience: e.target.value }))
                    }
                    placeholder="Who is this course for?"
                    className="w-full text-sm text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1f644e] leading-relaxed"
                  />
                ) : (
                  <PlanText value={course.targetAudience} placeholder="Not defined yet." />
                )}
              </PlanCard>

              {/* Learning Objectives */}
              <PlanCard label="Learning Objectives">
                {editMode && planDraft ? (
                  <>
                    <textarea
                      rows={4}
                      value={planDraft.learningObjectives}
                      onChange={(e) =>
                        setPlanDraft((d) => ({ ...d, learningObjectives: e.target.value }))
                      }
                      placeholder="One objective per line"
                      className="w-full text-sm text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1f644e] leading-relaxed"
                    />
                    <p className="text-[10px] text-[#7c8e88] mt-1">One objective per line</p>
                  </>
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

              {/* Prerequisites */}
              <PlanCard label="Prerequisites">
                {editMode && planDraft ? (
                  <>
                    <textarea
                      rows={3}
                      value={planDraft.prerequisites}
                      onChange={(e) =>
                        setPlanDraft((d) => ({ ...d, prerequisites: e.target.value }))
                      }
                      placeholder="One prerequisite per line"
                      className="w-full text-sm text-[#1e3a34] bg-[#f9f9f7] border border-[#e5e3d8] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#1f644e] leading-relaxed"
                    />
                    <p className="text-[10px] text-[#7c8e88] mt-1">One prerequisite per line</p>
                  </>
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

              {/* Outcome */}
              <PlanCard label="Outcome">
                {editMode && planDraft ? (
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

              {/* Outline */}
              <PlanCard label="Outline">
                {editMode && planDraft ? (
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

              {/* Planning Notes */}
              <PlanCard label="Planning Notes">
                {editMode && planDraft ? (
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

              {/* Research Notes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                    Research Notes ({course.researchNotes?.length || 0})
                  </h3>
                  <button
                    onClick={() => setShowNoteForm((v) => !v)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#f0f5f2] hover:bg-[#e0ede8] text-[#1f644e] text-xs font-bold rounded-lg transition-colors"
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
                      <div
                        key={i}
                        className="bg-white border border-[#e5e3d8] rounded-xl p-4 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-[#1e3a34]">
                            {note.title || 'Untitled'}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#f0f5f2] rounded text-[#7c8e88] capitalize">
                              {note.sourceType || 'other'}
                            </span>
                            <button
                              onClick={() => handleDeleteNote(i)}
                              className="p-1 rounded-md hover:bg-red-50 text-[#7c8e88] hover:text-[#c94c4c] transition-colors"
                              title="Delete note"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
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
                    <p className="text-xs text-[#7c8e88] mt-1">
                      Click "Add Note" above to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <article className="max-w-3xl mx-auto px-4 lg:px-10 py-8">
              {/* Course thumbnail banner — always visible */}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailUpload}
              />
              {thumbnailUploading ? (
                <div className="w-full h-52 rounded-2xl overflow-hidden mb-8 border border-[#e5e3d8] shadow-sm bg-gradient-to-br from-[#1f644e] to-[#2d8a6a] relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
                  <div className="flex flex-col items-center gap-2 z-10">
                    <div className="w-8 h-8 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                    <span className="text-xs font-bold text-white/70 tracking-wider uppercase">
                      Uploading thumbnail…
                    </span>
                  </div>
                </div>
              ) : course.thumbnailGenerating ? (
                <div className="w-full h-52 rounded-2xl overflow-hidden mb-8 border border-[#e5e3d8] shadow-sm bg-gradient-to-br from-[#1f644e] to-[#2d8a6a] relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
                  <div className="flex flex-col items-center gap-2 z-10">
                    <div className="w-8 h-8 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                    <span className="text-xs font-bold text-white/70 tracking-wider uppercase">
                      Generating thumbnail…
                    </span>
                  </div>
                </div>
              ) : course.thumbnail ? (
                <div className="w-full h-52 rounded-2xl overflow-hidden mb-8 border border-[#e5e3d8] shadow-sm relative group">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  {editMode && (
                    <button
                      onClick={() => thumbnailInputRef.current?.click()}
                      disabled={thumbnailUploading}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {thumbnailUploading ? (
                        <div className="w-7 h-7 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                      ) : (
                        <>
                          <ImagePlus className="w-7 h-7 text-white" />
                          <span className="text-xs font-bold text-white">Change thumbnail</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : editMode ? (
                <button
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={thumbnailUploading}
                  className="w-full h-52 rounded-2xl mb-8 border-2 border-dashed border-[#e5e3d8] flex flex-col items-center justify-center gap-2 hover:border-[#1f644e] hover:bg-[#f0f5f2] transition-colors"
                >
                  {thumbnailUploading ? (
                    <div className="w-7 h-7 rounded-full border-2 border-[#1f644e]/40 border-t-[#1f644e] animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-7 h-7 text-[#7c8e88]" />
                      <span className="text-xs font-bold text-[#7c8e88]">Upload thumbnail</span>
                    </>
                  )}
                </button>
              ) : null}

              {/* Section content */}
              {!currentSection ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-14 w-14 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4">
                    <BookOpen className="w-7 h-7 text-[#1f644e]" />
                  </div>
                  <h3 className="font-bold text-[#1e3a34] mb-2">
                    {sections.length === 0 ? 'No sections yet' : 'No section selected'}
                  </h3>
                  <p className="text-sm text-[#7c8e88] mb-6 max-w-xs">
                    {sections.length === 0
                      ? 'Add a section manually or use the MCP tools with an AI agent.'
                      : 'Select a section from the sidebar to start reading.'}
                  </p>
                  {sections.length === 0 && (
                    <button
                      onClick={() => setShowNewSection(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#1f644e] text-white rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Section
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Section header */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <h2 className="text-xl lg:text-2xl font-bold text-[#1e3a34] leading-snug min-w-0">
                      {currentSection.title}
                    </h2>
                    {editMode && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingSection(currentSection)}
                          className="p-2 rounded-xl hover:bg-[#f0f5f2] text-[#7c8e88] hover:text-[#1f644e] transition-colors"
                          title="Edit section"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(currentSection._id)}
                          className="p-2 rounded-xl hover:bg-red-50 text-[#7c8e88] hover:text-[#c94c4c] transition-colors"
                          title="Delete section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Markdown content */}
                  {currentSection.content ? (
                    <div className="coursify-md prose prose-sm max-w-none font-[family-name:var(--font-lora)] prose-headings:font-bold prose-headings:text-[#1e3a34] prose-p:text-[#1e3a34] prose-p:leading-relaxed prose-code:bg-[#f0f5f2] prose-code:rounded prose-code:px-1 prose-code:text-[#1f644e] prose-pre:bg-[#1e3a34] prose-pre:rounded-xl prose-blockquote:border-[#1f644e] prose-a:text-[#1f644e] prose-li:text-[#1e3a34] prose-strong:text-[#1e3a34] prose-table:text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          table({ children }) {
                            return (
                              <div className="overflow-x-auto my-7 rounded-xl border border-[#e5e3d8]">
                                <table className="w-full border-collapse text-sm">{children}</table>
                              </div>
                            );
                          },
                          code({ node, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const isBlock = String(children).includes('\n');

                            if (isBlock && match) {
                              return (
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{
                                    borderRadius: '0.75rem',
                                    fontSize: '0.82rem',
                                    margin: '0.75em 0',
                                    padding: '0.6em 0.9em',
                                  }}
                                  showLineNumbers
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              );
                            }
                            if (isBlock) {
                              return (
                                <div
                                  className="rounded-xl overflow-hidden my-3 w-full flex justify-center"
                                  style={{ background: '#18181b' }}
                                >
                                  <pre
                                    className="overflow-x-auto p-4 text-[0.82rem] leading-relaxed font-mono whitespace-pre"
                                    style={{ background: 'transparent' }}
                                  >
                                    <code className="font-mono" style={{ color: '#e4e4e7' }}>
                                      {children}
                                    </code>
                                  </pre>
                                </div>
                              );
                            }
                            return (
                              <code
                                className="bg-[#f0f5f2] text-[#1f644e] rounded px-1.5 py-0.5 text-[0.82em] font-mono font-semibold"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {currentSection.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-[#e5e3d8] rounded-2xl">
                      <p className="text-sm text-[#7c8e88] mb-3">
                        This section has no content yet.
                      </p>
                      <button
                        onClick={() => setEditingSection(currentSection)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1f644e] text-white rounded-xl text-xs font-bold hover:bg-[#17503e] transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Add Content
                      </button>
                    </div>
                  )}

                  {/* Resources */}
                  {currentSection.resources?.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-[#e5e3d8]">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-3">
                        Resources
                      </h4>
                      <div className="space-y-2">
                        {currentSection.resources.map((r, i) => (
                          <a
                            key={i}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-white border border-[#e5e3d8] rounded-xl hover:border-[#1f644e]/40 hover:bg-[#f0f5f2] transition-colors group"
                          >
                            <span className="text-base shrink-0">
                              {RESOURCE_ICONS[r.type] || '🔗'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#1e3a34] truncate">
                                {r.title || r.url}
                              </p>
                              <p className="text-xs text-[#7c8e88] truncate">{r.url}</p>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-[#7c8e88] group-hover:text-[#1f644e] shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prev / Next navigation */}
                  <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#e5e3d8]">
                    {(() => {
                      const idx = sections.findIndex((s) => s._id === currentSection._id);
                      const prev = sections[idx - 1];
                      const next = sections[idx + 1];
                      return (
                        <>
                          {prev ? (
                            <button
                              onClick={() => setActiveSection(prev._id)}
                              className="flex items-center gap-2 text-sm font-bold text-[#7c8e88] hover:text-[#1f644e] transition-colors max-w-[42%]"
                            >
                              <ArrowLeft className="w-4 h-4 shrink-0" />
                              <span className="truncate">{prev.title}</span>
                            </button>
                          ) : (
                            <div />
                          )}
                          {next ? (
                            <button
                              onClick={() => setActiveSection(next._id)}
                              className="flex items-center gap-2 text-sm font-bold text-[#7c8e88] hover:text-[#1f644e] transition-colors max-w-[42%]"
                            >
                              <span className="truncate">{next.title}</span>
                              <ChevronRight className="w-4 h-4 shrink-0" />
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-[#1f644e] bg-[#f0f5f2] px-3 py-1.5 rounded-full">
                              Course complete ✓
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </article>
          )}
        </main>
      </div>

      {(editingSection || showNewSection) && (
        <EditSectionModal
          section={editingSection || null}
          onSave={handleSaveSection}
          onClose={() => {
            setEditingSection(null);
            setShowNewSection(false);
          }}
        />
      )}
    </div>
  );
}
