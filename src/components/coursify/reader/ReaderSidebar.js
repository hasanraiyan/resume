import { ChevronDown, ChevronRight, Play, CheckCircle2, BookOpen, Brain } from 'lucide-react';

export function ReaderSidebar({
  course,
  modules,
  units,
  activeUnitId,
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
    <aside
      className={`fixed lg:relative z-40 w-72 h-full border-r border-[#e5e3d8] bg-white transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="p-5 border-b border-[#e5e3d8]">
          <button
            onClick={onShowOverview}
            className={`w-full text-left p-3 rounded-xl transition-colors ${
              showOverview ? 'bg-[#f0f5f2] text-[#1f644e]' : 'hover:bg-[#fcfbf5] text-[#1e3a34]'
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4" />
              <span className="font-bold text-sm">Course Overview</span>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="px-3 py-2">
            <span className="font-bold text-sm text-[#1e3a34]">Units</span>
          </div>

          <div className="space-y-1">
            {modules.length > 0
              ? modules.map((mod) => {
                  const modUnits = units.filter(
                    (u) => u.moduleId === mod._id || u.moduleId === mod.id
                  );
                  const doneUnits = modUnits.filter((u) => visited.has(u._id || u.id)).length;
                  const isExpanded = expandedModules.has(mod._id || mod.id);

                  return (
                    <div key={mod._id || mod.id} className="space-y-1">
                      <button
                        onClick={() => onToggleModule(mod._id || mod.id)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#fcfbf5] transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[#7c8e88]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-[#7c8e88]" />
                          )}
                          <span className="text-xs font-bold text-[#1e3a34] truncate">
                            {mod.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#7c8e88] shrink-0">
                          {doneUnits}/{modUnits.length}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="ml-4 pl-4 border-l border-[#e5e3d8] space-y-1">
                          {modUnits.map((unit) => (
                            <SidebarUnitBtn
                              key={unit._id || unit.id}
                              unit={unit}
                              active={activeUnitId === (unit._id || unit.id)}
                              done={visited.has(unit._id || unit.id)}
                              onClick={() => onNavigateTo(unit._id || unit.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              : units.map((unit) => (
                  <SidebarUnitBtn
                    key={unit._id || unit.id}
                    unit={unit}
                    active={activeUnitId === (unit._id || unit.id)}
                    done={visited.has(unit._id || unit.id)}
                    onClick={() => onNavigateTo(unit._id || unit.id)}
                  />
                ))}
          </div>
        </div>

        {footer && <div className="p-4 border-t border-[#e5e3d8]">{footer}</div>}
      </div>
    </aside>
  );
}

function SidebarUnitBtn({ unit, active, done, onClick }) {
  const isQuiz = unit.unitType === 'quiz';
  const hasEmbeddedQuiz = unit.unitType !== 'quiz' && (unit.quiz?.questions?.length ?? 0) > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
        active ? 'bg-[#f0f5f2] text-[#1f644e] shadow-sm' : 'hover:bg-[#fcfbf5] text-[#1e3a34]/70'
      }`}
    >
      {done ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
      ) : isQuiz ? (
        <Brain className={`w-3.5 h-3.5 ${active ? 'text-[#1f644e]' : 'text-[#7c8e88]'}`} />
      ) : (
        <Play
          className={`w-3 h-3 ${active ? 'text-[#1f644e] fill-[#1f644e]' : 'text-[#7c8e88]'}`}
        />
      )}
      <span className={`text-xs font-bold truncate ${active ? 'text-[#1f644e]' : ''}`}>
        {unit.title}
      </span>
      {hasEmbeddedQuiz && !isQuiz && (
        <Brain className="w-2.5 h-2.5 text-purple-400 ml-auto shrink-0" />
      )}
    </button>
  );
}
