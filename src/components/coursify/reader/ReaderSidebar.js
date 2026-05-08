import { X, BookOpen, ChevronRight, ScrollText } from 'lucide-react';
import { QuizIcon } from './icons';

/**
 * Shared Sidebar for the Coursify Reader.
 */
export function ReaderSidebar({
  course,
  modules,
  sections,
  activeSection,
  showOverview,
  visited,
  sidebarOpen,
  expandedModules,
  onClose,
  onShowOverview,
  onNavigateTo,
  onToggleModule,
  footer,
}) {
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 shrink-0 bg-white border-r border-[#e5e3d8] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile drawer header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#e5e3d8]">
          <span className="font-bold text-sm text-[#1e3a34]">Sections</span>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#f0f5f2] rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-[#7c8e88]" />
          </button>
        </div>

        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-[#e5e3d8]">
          <p className="font-bold text-xs text-[#1e3a34] line-clamp-2 leading-snug hidden lg:block">
            {course.title}
          </p>
        </div>

        {/* Section list */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Overview button */}
          <button
            onClick={onShowOverview}
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
                const isExpanded = expandedModules.has(mod._id);

                return (
                  <div
                    key={mod._id}
                    className={`mb-1 ${modIdx < modules.length - 1 ? 'pb-1 border-b border-[#f0f5f2]' : ''}`}
                  >
                    <button
                      onClick={() => onToggleModule(mod._id)}
                      className="w-full flex items-center gap-2 px-2 py-2 mt-1 hover:bg-[#f0f5f2] rounded-lg transition-colors group"
                    >
                      <span className="w-5 h-5 rounded-md bg-[#1f644e]/10 text-[#1f644e] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {modIdx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-[#1e3a34] truncate flex-1 text-left">
                        {mod.title}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-[#b0bfbb]">
                          {doneSections}/{modSections.length}
                        </span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-[#b0bfbb] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="space-y-0.5 mt-0.5">
                        {modSections.map((section) => (
                          <SidebarSectionBtn
                            key={section._id}
                            section={section}
                            active={activeSection === section._id}
                            done={visited.has(section._id)}
                            onClick={() => onNavigateTo(section._id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Unassigned sections */}
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
                          active={activeSection === section._id}
                          done={visited.has(section._id)}
                          onClick={() => onNavigateTo(section._id)}
                        />
                      ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            sections.map((section) => (
              <SidebarSectionBtn
                key={section._id}
                section={section}
                active={activeSection === section._id}
                done={visited.has(section._id)}
                onClick={() => onNavigateTo(section._id)}
              />
            ))
          )}
        </div>

        {/* Footer actions (e.g. Add Section) */}
        {footer && <div className="p-3 border-t border-[#e5e3d8]">{footer}</div>}
      </aside>
    </>
  );
}

function SidebarSectionBtn({ section, active, done, onClick }) {
  const isQuiz = section.sectionType === 'quiz';
  const hasEmbeddedQuiz =
    section.sectionType !== 'quiz' && (section.quiz?.questions?.length ?? 0) > 0;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
        active ? 'bg-[#1f644e] text-white shadow-sm' : 'text-[#1e3a34] hover:bg-[#f0f5f2]'
      }`}
    >
      {isQuiz ? (
        <QuizIcon className={`w-3 h-3 shrink-0 ${active ? 'text-white/80' : 'text-[#7c8e88]'}`} />
      ) : (
        <ScrollText className={`w-3 h-3 shrink-0 ${active ? 'text-white/80' : 'text-[#7c8e88]'}`} />
      )}
      <span
        className={`text-xs font-semibold truncate flex-1 leading-snug ${
          done && !active ? 'text-[#7c8e88]' : ''
        }`}
      >
        {section.title}
      </span>
      {hasEmbeddedQuiz && (
        <QuizIcon
          className={`w-3 h-3 shrink-0 opacity-50 ${active ? 'text-white' : 'text-[#7c8e88]'}`}
        />
      )}
    </button>
  );
}
