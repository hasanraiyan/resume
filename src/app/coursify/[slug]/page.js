'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
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
  Check,
  List,
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
  const [showOverview, setShowOverview] = useState(true);
  const [visited, setVisited] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // TOC state — must be before early returns
  const [headings, setHeadings] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);
  const [tocOpen, setTocOpen] = useState(true);
  const contentRef = useRef(null);

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/coursify/public/courses/${id}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.course);
        setSections(data.sections);
        setModules(data.modules || []);
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

  // currentSection computed here so TOC effects can access it unconditionally
  const currentSection = sections.find((s) => s._id === activeSection);
  const currentIndex = sections.findIndex((s) => s._id === activeSection);

  // TOC: extract headings from current section content
  useEffect(() => {
    if (!currentSection?.content) {
      setHeadings([]);
      setActiveHeading(null);
      return;
    }
    const lines = currentSection.content.split('\n');
    const extracted = [];
    for (const line of lines) {
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);
      if (h2Match) {
        const text = h2Match[1].trim();
        extracted.push({ level: 2, text, slug: text.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
      } else if (h3Match) {
        const text = h3Match[1].trim();
        extracted.push({ level: 3, text, slug: text.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
      }
    }
    setHeadings(extracted);
    setActiveHeading(extracted[0]?.text || null);
  }, [currentSection?.content]);

  // TOC: scroll-spy
  useEffect(() => {
    if (headings.length === 0 || !contentRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const text = entry.target.getAttribute('data-heading');
            if (text) setActiveHeading(text);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    const headingEls = contentRef.current.querySelectorAll('[data-heading]');
    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

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

  const navigateTo = (sectionId) => {
    if (activeSection) setVisited((v) => new Set(v).add(activeSection));
    setShowOverview(false);
    setActiveSection(sectionId);
    setSidebarOpen(false);
  };

  const showOverviewPage = () => {
    setShowOverview(true);
    setActiveSection(null);
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
            {showOverview ? (
              <span className="flex items-center gap-1 text-[10px] text-[#1f644e] font-bold">
                <BookOpen className="w-3 h-3" />
                Overview
              </span>
            ) : sections.length > 0 ? (
              <span className="flex items-center gap-1 text-[10px] text-[#7c8e88] font-bold">
                <Layers className="w-3 h-3" />
                {currentIndex + 1} / {sections.length}
              </span>
            ) : null}
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

          {/* Sidebar header: title + progress */}
          <div className="px-4 py-3 border-b border-[#e5e3d8] space-y-2.5">
            <p className="font-bold text-xs text-[#1e3a34] line-clamp-2 leading-snug hidden lg:block">
              {course.title}
            </p>
            {sections.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                    {modules.length > 0
                      ? `${modules.length} module${modules.length !== 1 ? 's' : ''}`
                      : 'Progress'}
                  </span>
                  <span className="text-[10px] font-bold text-[#1e3a34]">
                    {visited.size} / {sections.length} done
                  </span>
                </div>
                <div className="h-1.5 bg-[#f0f5f2] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1f644e] rounded-full transition-all duration-500"
                    style={{
                      width: `${sections.length > 0 ? (visited.size / sections.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Section list */}
          <div className="flex-1 overflow-y-auto p-2">
            {/* Overview button */}
            <button
              onClick={showOverviewPage}
              className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-colors flex items-center gap-2.5 ${
                showOverview ? 'bg-[#1f644e] text-white' : 'text-[#1e3a34] hover:bg-[#f0f5f2]'
              }`}
            >
              <BookOpen
                className={`w-4 h-4 shrink-0 ${showOverview ? 'text-white' : 'text-[#7c8e88]'}`}
              />
              <span className="text-xs font-bold truncate">Overview</span>
            </button>
            {modules.length > 0 ? (
              <>
                {modules.map((mod, modIdx) => {
                  const modSections = sections.filter((s) => s.moduleId === mod._id);
                  const doneSections = modSections.filter((s) => visited.has(s._id)).length;
                  return (
                    <div key={mod._id} className="mb-1">
                      {/* Module header */}
                      <div className="flex items-center gap-2 px-2 py-2 mt-1">
                        <span className="w-5 h-5 rounded-md bg-[#1f644e]/10 text-[#1f644e] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {modIdx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-[#1e3a34] truncate flex-1">
                          {mod.title}
                        </span>
                        <span className="text-[10px] font-bold text-[#b0bfbb] shrink-0">
                          {doneSections}/{modSections.length}
                        </span>
                      </div>
                      <div className="ml-2 pl-3 border-l-2 border-[#f0f5f2] space-y-0.5">
                        {modSections.map((section) => (
                          <SidebarSectionBtn
                            key={section._id}
                            section={section}
                            index={sections.indexOf(section)}
                            active={activeSection === section._id}
                            done={visited.has(section._id)}
                            onClick={() => navigateTo(section._id)}
                          />
                        ))}
                        {modSections.length === 0 && (
                          <p className="text-[10px] text-[#b0bfbb] px-3 py-1 italic">
                            No sections yet
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {sections.filter((s) => !s.moduleId).length > 0 && (
                  <div className="mb-1 mt-2">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#b0bfbb]">
                        More
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {sections
                        .filter((s) => !s.moduleId)
                        .map((section) => (
                          <SidebarSectionBtn
                            key={section._id}
                            section={section}
                            index={sections.indexOf(section)}
                            active={activeSection === section._id}
                            done={visited.has(section._id)}
                            onClick={() => navigateTo(section._id)}
                          />
                        ))}
                    </div>
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

        {/* ── Main Content ─ */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="flex min-h-0">
            {/* Article */}
            <article className="flex-1 max-w-3xl mx-auto px-4 lg:px-10 py-8" ref={contentRef}>
              {!currentSection && !showOverview ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-14 w-14 bg-[#f0f5f2] rounded-2xl flex items-center justify-center mb-4">
                    <BookOpen className="w-7 h-7 text-[#1f644e]" />
                  </div>
                  <h3 className="font-bold text-[#1e3a34] mb-2">No sections yet</h3>
                  <p className="text-sm text-[#7c8e88]">Check back soon — content is on the way.</p>
                </div>
              ) : showOverview ? (
                <>
                  {/* Course Overview */}
                  <div>
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

                    {/* Title + meta */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${DIFFICULTY_COLORS[course.difficulty] || DIFFICULTY_COLORS.beginner}`}
                      >
                        {course.difficulty}
                      </span>
                      {course.estimatedDuration && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#7c8e88]">
                          <Clock className="w-3 h-3" />
                          {course.estimatedDuration}
                        </span>
                      )}
                      {sections.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#7c8e88]">
                          <Layers className="w-3 h-3" />
                          {sections.length} section{sections.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {course.description && (
                      <p className="text-base text-[#7c8e88] leading-relaxed mb-8">
                        {course.description}
                      </p>
                    )}

                    {/* What you'll learn */}
                    {course.learningObjectives?.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-sm font-bold text-[#1e3a34] mb-3">
                          What you&apos;ll learn
                        </h3>
                        <ul className="space-y-2">
                          {course.learningObjectives.map((obj, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-[#1e3a34]">
                              <Check className="w-4 h-4 text-[#1f644e] shrink-0 mt-0.5" />
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Prerequisites */}
                    {course.prerequisites?.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-sm font-bold text-[#1e3a34] mb-3">Prerequisites</h3>
                        <ul className="space-y-2">
                          {course.prerequisites.map((pre, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-[#7c8e88]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#e5e3d8] shrink-0 mt-1.5" />
                              <span>{pre}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Section outline */}
                    {sections.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-sm font-bold text-[#1e3a34] mb-3">
                          {modules.length > 0 ? 'Course outline' : 'Sections'}
                        </h3>
                        <div className="space-y-1">
                          {modules.length > 0 ? (
                            <>
                              {modules.map((mod) => {
                                const modSections = sections.filter((s) => s.moduleId === mod._id);
                                return (
                                  <div key={mod._id} className="mb-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] mb-1 px-2">
                                      {mod.title}
                                    </p>
                                    {modSections.map((section) => (
                                      <button
                                        key={section._id}
                                        onClick={() => navigateTo(section._id)}
                                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors flex items-center gap-2"
                                      >
                                        <span className="w-5 h-5 rounded bg-[#f0f5f2] text-[#7c8e88] flex items-center justify-center text-[10px] font-bold shrink-0">
                                          {sections.indexOf(section) + 1}
                                        </span>
                                        {section.title}
                                      </button>
                                    ))}
                                  </div>
                                );
                              })}
                              {sections.filter((s) => !s.moduleId).length > 0 && (
                                <div className="mb-3">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] mb-1 px-2">
                                    More
                                  </p>
                                  {sections
                                    .filter((s) => !s.moduleId)
                                    .map((section) => (
                                      <button
                                        key={section._id}
                                        onClick={() => navigateTo(section._id)}
                                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors flex items-center gap-2"
                                      >
                                        <span className="w-5 h-5 rounded bg-[#f0f5f2] text-[#7c8e88] flex items-center justify-center text-[10px] font-bold shrink-0">
                                          {sections.indexOf(section) + 1}
                                        </span>
                                        {section.title}
                                      </button>
                                    ))}
                                </div>
                              )}
                            </>
                          ) : (
                            sections.map((section, i) => (
                              <button
                                key={section._id}
                                onClick={() => navigateTo(section._id)}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors flex items-center gap-2"
                              >
                                <span className="w-5 h-5 rounded bg-[#f0f5f2] text-[#7c8e88] flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {i + 1}
                                </span>
                                {section.title}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Start Course button */}
                    {sections.length > 0 && (
                      <button
                        onClick={() => navigateTo(sections[0]._id)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#1f644e] text-white rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors"
                      >
                        Start learning <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Markdown content */}
                  {currentSection.content ? (
                    <div className="coursify-md prose prose-sm max-w-none font-[family-name:var(--font-lora)] prose-headings:font-bold prose-headings:text-[#1e3a34] prose-p:text-[#1e3a34] prose-p:leading-relaxed prose-code:bg-[#f0f5f2] prose-code:rounded prose-code:px-1 prose-code:text-[#1f644e] prose-pre:bg-[#1e3a34] prose-pre:rounded-xl prose-blockquote:border-[#1f644e] prose-a:text-[#1f644e] prose-li:text-[#1e3a34] prose-strong:text-[#1e3a34] prose-table:text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          h2({ children, ...props }) {
                            const text = typeof children === 'string' ? children : '';
                            const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                            return (
                              <h2 id={slug} data-heading={text} className="scroll-mt-20" {...props}>
                                {children}
                              </h2>
                            );
                          },
                          h3({ children, ...props }) {
                            const text = typeof children === 'string' ? children : '';
                            const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                            return (
                              <h3 id={slug} data-heading={text} className="scroll-mt-20" {...props}>
                                {children}
                              </h3>
                            );
                          },
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

            {/* ── TOC Sidebar (desktop only) ── */}
            {headings.length > 0 && (
              <aside className="hidden lg:block shrink-0 sticky top-0 self-start max-h-screen overflow-y-auto py-8 pr-2 pl-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-[#7c8e88]">
                    <List className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      On this page
                    </span>
                  </div>
                  <button
                    onClick={() => setTocOpen((v) => !v)}
                    className="p-0.5 rounded text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors"
                    title={tocOpen ? 'Collapse' : 'Expand'}
                  >
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${tocOpen ? 'rotate-90' : ''}`}
                    />
                  </button>
                </div>
                {tocOpen && (
                  <nav className="space-y-0.5">
                    {headings.map((h) => (
                      <a
                        key={h.slug}
                        href={`#${h.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(h.slug);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className={`block text-xs leading-snug transition-colors py-0.5 ${
                          h.level === 3 ? 'pl-4' : ''
                        } ${
                          activeHeading === h.text
                            ? 'text-[#1f644e] font-bold'
                            : 'text-[#7c8e88] hover:text-[#1e3a34]'
                        }`}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                )}
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarSectionBtn({ section, index, active, done, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2.5 ${
        active ? 'bg-[#1f644e] text-white shadow-sm' : 'text-[#1e3a34] hover:bg-[#f0f5f2]'
      }`}
    >
      <span
        className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
          active
            ? 'bg-white/20 text-white'
            : done
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-[#f0f5f2] text-[#b0bfbb]'
        }`}
      >
        {done && !active ? <Check className="w-3 h-3" /> : index !== undefined ? index + 1 : null}
      </span>
      <span
        className={`text-xs font-semibold truncate flex-1 leading-snug ${
          done && !active ? 'text-[#7c8e88]' : ''
        }`}
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
