'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Pacifico, Nunito, Lora } from 'next/font/google';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Layers,
  Tag,
  ExternalLink,
  Menu,
  X,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

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

export default function PublicCourseReaderPage({ params }) {
  const { slug } = use(params);
  const id = slug;
  const router = useRouter();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [modules, setModules] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [visited, setVisited] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/coursify/public/courses/${id}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.course);
        setSections(data.sections);
        setModules(data.modules || []);
        setActiveSection(data.sections[0]?._id || null);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // Expose current section context to ChatbotWidget via window global
  useEffect(() => {
    if (!activeSection || !sections.length) return;
    const section = sections.find((s) => s._id === activeSection);
    if (section) {
      window.__coursifyCtx = {
        sectionId: section._id,
        sectionTitle: section.title,
        sectionSummary: section.summary || '',
      };
    }
    return () => {
      delete window.__coursifyCtx;
    };
  }, [activeSection, sections]);

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
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div
        className={`min-h-screen bg-[#fcfbf5] ${pacifico.variable} ${nunito.variable} font-[family-name:var(--font-sans)] flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="h-16 w-16 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <BookOpen className="w-8 h-8 text-[#1f644e]" />
          </div>
          <h2 className="font-bold text-[#1e3a34] mb-2">Course not found</h2>
          <p className="text-sm text-[#7c8e88] mb-6">
            This course may not be published yet or the link is incorrect.
          </p>
          <button
            onClick={() => router.push('/coursify')}
            className="text-[#1f644e] font-bold text-sm hover:underline"
          >
            Browse all courses
          </button>
        </div>
      </div>
    );
  }

  const currentSection = sections.find((s) => s._id === activeSection);
  const currentIndex = sections.findIndex((s) => s._id === activeSection);

  const navigateTo = (sectionId) => {
    if (activeSection) setVisited((v) => new Set(v).add(activeSection));
    setActiveSection(sectionId);
    setSidebarOpen(false);
  };
  const progressPct = sections.length > 0 ? ((currentIndex + 1) / sections.length) * 100 : 0;

  return (
    <div
      className={`h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex flex-col ${pacifico.variable} ${nunito.variable} ${lora.variable}`}
    >
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e5e3d8] px-4 lg:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => router.push('/coursify')}
            className="p-1.5 hover:bg-[#f0f5f2] rounded-full transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <img
            src="/images/apps/coursify.png"
            alt="Coursify"
            className="h-6 w-6 rounded-md object-contain shrink-0 hidden sm:block"
          />
          <span className="font-[family-name:var(--font-logo)] text-lg text-[#1f644e] shrink-0 hidden sm:block">
            Coursify
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#e5e3d8] shrink-0 hidden sm:block" />
          <h1 className="font-bold text-[#1e3a34] text-sm lg:text-base truncate">{course.title}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
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
            {sections.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-[#7c8e88] font-bold">
                <Layers className="w-3 h-3" />
                {currentIndex + 1} / {sections.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg border border-[#e5e3d8] bg-white text-[#7c8e88] lg:hidden"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Reading progress bar */}
      {sections.length > 0 && (
        <div className="h-0.5 bg-[#e5e3d8] shrink-0">
          <div
            className="h-full bg-[#1f644e] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
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

          {/* Course info in sidebar */}
          <div className="px-4 py-3 border-b border-[#e5e3d8]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] mb-1">
              {modules.length > 0
                ? `${modules.length} modules · ${sections.length} sections`
                : `${sections.length} section${sections.length !== 1 ? 's' : ''}`}
            </p>
            {course.description && (
              <p className="text-xs text-[#7c8e88] leading-relaxed line-clamp-3">
                {course.description}
              </p>
            )}
          </div>

          {/* Section list */}
          <div className="flex-1 overflow-y-auto p-2">
            {modules.length > 0 ? (
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
                        <SidebarSectionBtn
                          key={section._id}
                          section={section}
                          active={activeSection === section._id}
                          done={visited.has(section._id)}
                          onClick={() => navigateTo(section._id)}
                        />
                      ))}
                      {modSections.length === 0 && (
                        <p className="text-[10px] text-[#7c8e88] px-3 py-1 italic">No sections</p>
                      )}
                    </div>
                  );
                })}
                {sections.filter((s) => !s.moduleId).length > 0 && (
                  <div className="mb-3">
                    <div className="px-2 py-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                        More
                      </span>
                    </div>
                    {sections
                      .filter((s) => !s.moduleId)
                      .map((section) => (
                        <SidebarSectionBtn
                          key={section._id}
                          section={section}
                          active={activeSection === section._id}
                          done={visited.has(section._id)}
                          onClick={() => navigateTo(section._id)}
                        />
                      ))}
                  </div>
                )}
              </>
            ) : (
              sections.map((section, i) => (
                <SidebarSectionBtn
                  key={section._id}
                  section={section}
                  index={i}
                  active={activeSection === section._id}
                  done={visited.has(section._id)}
                  onClick={() => navigateTo(section._id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <article className="max-w-3xl mx-auto px-4 lg:px-10 py-8">
            {/* Thumbnail */}
            {course.thumbnail && (
              <div className="w-full h-52 rounded-2xl overflow-hidden mb-8 border border-[#e5e3d8] shadow-sm">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Tags */}
            {course.tags?.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-6">
                <Tag className="w-3.5 h-3.5 text-[#7c8e88]" />
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-[#f0f5f2] text-[#7c8e88] text-[10px] font-bold rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {!currentSection ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-14 w-14 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-7 h-7 text-[#1f644e]" />
                </div>
                <h3 className="font-bold text-[#1e3a34] mb-2">No sections yet</h3>
                <p className="text-sm text-[#7c8e88]">Check back soon — content is on the way.</p>
              </div>
            ) : (
              <>
                {/* Section header */}
                <h2 className="text-xl lg:text-2xl font-bold text-[#1e3a34] leading-snug mb-6">
                  {currentSection.title}
                </h2>

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
                  <div className="py-16 text-center">
                    <p className="text-sm text-[#7c8e88]">No content yet for this section.</p>
                  </div>
                )}

                {/* Resources */}
                {currentSection.resources?.length > 0 && (
                  <div className="mt-10 pt-6 border-t border-[#e5e3d8]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-3">
                      Resources
                    </h3>
                    <ul className="space-y-2">
                      {currentSection.resources.map((r, i) => (
                        <li key={i}>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-[#e5e3d8] hover:border-[#1f644e]/40 hover:bg-[#f0f5f2] transition-colors group"
                          >
                            <span className="text-base shrink-0">
                              {RESOURCE_ICONS[r.type] || RESOURCE_ICONS.other}
                            </span>
                            <span className="text-sm font-bold text-[#1e3a34] flex-1 truncate group-hover:text-[#1f644e] transition-colors">
                              {r.title}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-[#7c8e88] shrink-0" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prev / Next navigation */}
                <SectionNav
                  sections={sections}
                  activeSection={activeSection}
                  onNavigate={navigateTo}
                />
              </>
            )}
          </article>
        </main>
      </div>
    </div>
  );
}

function SidebarSectionBtn({ section, index, active, done, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-colors flex items-center gap-2.5 ${
        active ? 'bg-[#1f644e] text-white' : 'text-[#1e3a34] hover:bg-[#f0f5f2]'
      }`}
    >
      {done && !active ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
      ) : index !== undefined ? (
        <span
          className={`text-[10px] font-bold shrink-0 w-5 h-5 rounded flex items-center justify-center ${
            active ? 'bg-white/20 text-white' : 'bg-[#e5e3d8] text-[#7c8e88]'
          }`}
        >
          {index + 1}
        </span>
      ) : null}
      <span
        className={`text-xs font-bold truncate flex-1 ${done && !active ? 'text-[#7c8e88]' : ''}`}
      >
        {section.title}
      </span>
    </button>
  );
}

function SectionNav({ sections, activeSection, onNavigate }) {
  const idx = sections.findIndex((s) => s._id === activeSection);
  const prev = idx > 0 ? sections[idx - 1] : null;
  const next = idx < sections.length - 1 ? sections[idx + 1] : null;

  if (!prev && !next) return null;

  return (
    <div className="mt-10 pt-6 border-t border-[#e5e3d8] flex items-center justify-between gap-4">
      {prev ? (
        <button
          onClick={() => onNavigate(prev._id)}
          className="flex items-center gap-2 text-left group"
        >
          <div className="p-1.5 rounded-lg border border-[#e5e3d8] text-[#7c8e88] group-hover:border-[#1f644e] group-hover:text-[#1f644e] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-[#7c8e88] font-bold uppercase tracking-wider">
              Previous
            </p>
            <p className="text-xs font-bold text-[#1e3a34] truncate max-w-[160px] group-hover:text-[#1f644e] transition-colors">
              {prev.title}
            </p>
          </div>
        </button>
      ) : (
        <div />
      )}

      {next && (
        <button
          onClick={() => onNavigate(next._id)}
          className="flex items-center gap-2 text-right group ml-auto"
        >
          <div className="min-w-0">
            <p className="text-[10px] text-[#7c8e88] font-bold uppercase tracking-wider text-right">
              Next
            </p>
            <p className="text-xs font-bold text-[#1e3a34] truncate max-w-[160px] group-hover:text-[#1f644e] transition-colors">
              {next.title}
            </p>
          </div>
          <div className="p-1.5 rounded-lg border border-[#e5e3d8] text-[#7c8e88] group-hover:border-[#1f644e] group-hover:text-[#1f644e] transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      )}
    </div>
  );
}
