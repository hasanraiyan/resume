'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Pacifico, Nunito } from 'next/font/google';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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
  GripVertical,
  RefreshCw,
  Layers,
  Clock,
  Menu,
  X,
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

const DIFFICULTY_COLORS = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

const RESOURCE_ICONS = {
  video: '▶',
  article: '📄',
  doc: '📘',
  other: '🔗',
};

export default function CourseDetailPage({ params }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [showNewSection, setShowNewSection] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/coursify/courses/${id}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.course);
        setSections(data.sections);
        if (data.sections.length > 0 && !activeSection) {
          setActiveSection(data.sections[0]._id);
        }
      } else {
        toast.error(data.error || 'Failed to load course');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (session?.user?.role === 'admin') fetchCourse();
  }, [session, fetchCourse]);

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

  if (isLoading) {
    return (
      <div
        className={`min-h-screen bg-[#fcfbf5] ${pacifico.variable} ${nunito.variable} font-[family-name:var(--font-sans)]`}
      >
        <div className="h-16 border-b border-[#e5e3d8] bg-white animate-pulse" />
        <div className="flex">
          <div className="w-64 min-h-screen border-r border-[#e5e3d8] bg-white hidden lg:block animate-pulse" />
          <div className="flex-1 p-8 space-y-4 max-w-3xl">
            <div className="h-6 bg-[#e5e3d8] rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-[#e5e3d8] rounded w-full animate-pulse" />
            <div className="h-4 bg-[#e5e3d8] rounded w-3/4 animate-pulse" />
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
      className={`min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex flex-col ${pacifico.variable} ${nunito.variable}`}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e5e3d8] px-4 lg:px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/apps/coursify')}
            className="p-1.5 hover:bg-[#e5e3d8] rounded-full transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-[#1e3a34] text-sm lg:text-base truncate">
              {course.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold capitalize ${DIFFICULTY_COLORS[course.difficulty] || DIFFICULTY_COLORS.beginner}`}
              >
                {course.difficulty}
              </span>
              {course.estimatedDuration && (
                <span className="flex items-center gap-1 text-[10px] text-[#7c8e88] font-bold">
                  <Clock className="w-2.5 h-2.5" />
                  {course.estimatedDuration}
                </span>
              )}
              <span className="flex items-center gap-1 text-[10px] text-[#7c8e88] font-bold">
                <Layers className="w-2.5 h-2.5" />
                {sections.length} sections
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchCourse}
            className="p-1.5 rounded-lg border border-[#e5e3d8] bg-white text-[#7c8e88] hover:text-[#1f644e] transition-colors hidden sm:block"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleTogglePublish}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              course.status === 'published'
                ? 'bg-[#f0f5f2] border-[#1f644e]/30 text-[#1f644e]'
                : 'bg-white border-[#e5e3d8] text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e]'
            }`}
          >
            {course.status === 'published' ? (
              <>
                <Globe className="w-3 h-3" /> Published
              </>
            ) : (
              <>
                <Lock className="w-3 h-3" /> Draft
              </>
            )}
          </button>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg border border-[#e5e3d8] bg-white text-[#7c8e88] lg:hidden"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Section Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-[#e5e3d8] flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ top: 0, paddingTop: sidebarOpen ? 0 : undefined }}
        >
          {/* Mobile sidebar header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#e5e3d8]">
            <span className="font-bold text-sm">Sections</span>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4 text-[#7c8e88]" />
            </button>
          </div>

          <div className="p-3 border-b border-[#e5e3d8] hidden lg:block">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] px-2">
              Sections ({sections.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {sections.length === 0 ? (
              <div className="text-center py-8 px-4">
                <BookOpen className="w-8 h-8 text-[#e5e3d8] mx-auto mb-2" />
                <p className="text-xs text-[#7c8e88]">No sections yet</p>
              </div>
            ) : (
              sections.map((section, i) => (
                <button
                  key={section._id}
                  onClick={() => {
                    setActiveSection(section._id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-colors group flex items-center gap-2 ${
                    activeSection === section._id
                      ? 'bg-[#1f644e] text-white'
                      : 'text-[#1e3a34] hover:bg-[#f0f5f2]'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold shrink-0 w-5 h-5 rounded flex items-center justify-center ${activeSection === section._id ? 'bg-white/20 text-white' : 'bg-[#e5e3d8] text-[#7c8e88]'}`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs font-bold truncate flex-1">{section.title}</span>
                  <ChevronRight
                    className={`w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${activeSection === section._id ? 'opacity-100' : ''}`}
                  />
                </button>
              ))
            )}
          </div>

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
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {!currentSection ? (
            <div className="flex flex-col items-center justify-center h-full py-24 text-center px-4">
              <div className="h-14 w-14 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-[#1f644e]" />
              </div>
              <h3 className="font-bold text-[#1e3a34] mb-2">No section selected</h3>
              <p className="text-sm text-[#7c8e88] mb-6 max-w-xs">
                {sections.length === 0
                  ? 'This course has no sections yet. Add one manually or use the MCP tools with an AI agent.'
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
            <article className="max-w-3xl mx-auto px-4 lg:px-8 py-8">
              {/* Section header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider mb-1">
                    Section {sections.findIndex((s) => s._id === currentSection._id) + 1} of{' '}
                    {sections.length}
                  </p>
                  <h2 className="text-2xl font-bold text-[#1e3a34]">{currentSection.title}</h2>
                </div>
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
              </div>

              {/* Markdown content */}
              {currentSection.content ? (
                <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-[#1e3a34] prose-p:text-[#1e3a34] prose-p:leading-relaxed prose-code:bg-[#f0f5f2] prose-code:rounded prose-code:px-1 prose-code:text-[#1f644e] prose-pre:bg-[#1e3a34] prose-pre:rounded-xl prose-blockquote:border-[#1f644e] prose-a:text-[#1f644e] prose-li:text-[#1e3a34] prose-strong:text-[#1e3a34]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {currentSection.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-[#e5e3d8] rounded-2xl">
                  <p className="text-sm text-[#7c8e88] mb-3">This section has no content yet.</p>
                  <button
                    onClick={() => setEditingSection(currentSection)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1f644e] text-white rounded-xl text-xs font-bold mx-auto hover:bg-[#17503e] transition-colors"
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
                        <span className="text-base">{RESOURCE_ICONS[r.type] || '🔗'}</span>
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

              {/* Navigation */}
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
                          className="flex items-center gap-2 text-sm font-bold text-[#7c8e88] hover:text-[#1f644e] transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          {prev.title}
                        </button>
                      ) : (
                        <div />
                      )}
                      {next ? (
                        <button
                          onClick={() => setActiveSection(next._id)}
                          className="flex items-center gap-2 text-sm font-bold text-[#7c8e88] hover:text-[#1f644e] transition-colors"
                        >
                          {next.title}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-[#1f644e] bg-[#f0f5f2] px-3 py-1.5 rounded-full">
                          Course complete
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
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
