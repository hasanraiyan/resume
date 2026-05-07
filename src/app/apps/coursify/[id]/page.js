'use client';

import { useState, useEffect, useCallback, use } from 'react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [showNewSection, setShowNewSection] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMeta, setShowMeta] = useState(true);
  const [editMode, setEditMode] = useState(false);

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
              Sections ({sections.length})
            </h2>
          </div>

          {/* Section list */}
          <div className="flex-1 overflow-y-auto p-2">
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <BookOpen className="w-8 h-8 text-[#e5e3d8] mb-2" />
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
                  className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-colors group flex items-center gap-2.5 ${
                    activeSection === section._id
                      ? 'bg-[#1f644e] text-white'
                      : 'text-[#1e3a34] hover:bg-[#f0f5f2]'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                      activeSection === section._id
                        ? 'bg-white/20 text-white'
                        : 'bg-[#e5e3d8] text-[#7c8e88]'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs font-bold truncate flex-1">{section.title}</span>
                  <ChevronRight
                    className={`w-3 h-3 shrink-0 transition-opacity ${
                      activeSection === section._id
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-60'
                    }`}
                  />
                </button>
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
          {!currentSection ? (
            <div className="flex flex-col items-center justify-center min-h-full py-24 text-center px-4">
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
            <article className="max-w-3xl mx-auto px-4 lg:px-10 py-8">
              {/* Course thumbnail banner — always shown at top */}
              {course.thumbnail && (
                <div className="w-full h-52 rounded-2xl overflow-hidden mb-8 border border-[#e5e3d8] shadow-sm">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

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
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        if (!inline && match) {
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
                  <p className="text-sm text-[#7c8e88] mb-3">This section has no content yet.</p>
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
                        <span className="text-base shrink-0">{RESOURCE_ICONS[r.type] || '🔗'}</span>
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
