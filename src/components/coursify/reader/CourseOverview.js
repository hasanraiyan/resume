import { Clock, Layers, Star, Play, CheckCircle2, BookOpen, Brain } from 'lucide-react';

function UnitIcon({ unit }) {
  if (unit.unitType === 'quiz')
    return (
      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
        <Brain className="w-4 h-4 text-purple-600" />
      </div>
    );
  return (
    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
      <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
    </div>
  );
}

export function CourseOverview({ course, units, modules, onNavigateTo, hideThumbnail = false }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero section */}
      <section className="space-y-6">
        {!hideThumbnail && course.thumbnail && (
          <div className="w-full aspect-video rounded-2xl overflow-hidden border border-[#e5e3d8] shadow-sm mb-8">
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#f0f5f2] text-[#1f644e] text-[10px] font-bold uppercase tracking-wider">
              {course.difficulty}
            </span>
            {course.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full bg-white border border-[#e5e3d8] text-[#7c8e88] text-[10px] font-bold"
              >
                #{tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#1e3a34] tracking-tight leading-tight">
            {course.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            {course.estimatedDuration && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7c8e88]" />
                <span className="text-sm font-bold text-[#1e3a34]">{course.estimatedDuration}</span>
              </div>
            )}
            {units.length > 0 && (
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#7c8e88]" />
                <span className="text-sm font-bold text-[#1e3a34]">
                  {units.length} unit{units.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {course.description && (
          <p className="text-lg text-[#1e3a34]/80 leading-relaxed max-w-2xl">
            {course.description}
          </p>
        )}
      </section>

      {/* Learning objectives */}
      {course.learningObjectives?.length > 0 && (
        <section className="bg-white border border-[#e5e3d8] rounded-2xl p-6 lg:p-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#7c8e88] mb-6">
            What you'll learn
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {course.learningObjectives.map((obj, i) => (
              <div key={i} className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-[#1e3a34] leading-snug">{obj}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Unit outline */}
      {units.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#7c8e88]">
            {modules.length > 0 ? 'Course outline' : 'Units'}
          </h3>

          <div className="space-y-4">
            {modules.length > 0 ? (
              modules.map((mod) => {
                const modUnits = units.filter((u) => u.moduleId || u.moduleId === mod._id);
                if (modUnits.length === 0) return null;

                return (
                  <div key={mod._id} className="space-y-3">
                    <h4 className="text-sm font-bold text-[#1e3a34] flex items-center gap-2 px-1">
                      {mod.title}
                    </h4>
                    <div className="grid gap-2">
                      {modUnits.map((unit) => (
                        <button
                          key={unit._id || unit.id}
                          onClick={() => onNavigateTo(unit._id || unit.id)}
                          className="flex items-center gap-4 p-3 bg-white border border-[#e5e3d8] rounded-xl hover:border-[#1f644e]/40 hover:bg-[#f0f5f2] transition-all text-left group"
                        >
                          <UnitIcon unit={unit} />
                          <span className="text-sm font-semibold text-[#1e3a34] group-hover:text-[#1f644e] transition-colors">
                            {unit.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid gap-2">
                {units.map((unit) => (
                  <button
                    key={unit._id || unit.id}
                    onClick={() => onNavigateTo(unit._id || unit.id)}
                    className="flex items-center gap-4 p-3 bg-white border border-[#e5e3d8] rounded-xl hover:border-[#1f644e]/40 hover:bg-[#f0f5f2] transition-all text-left group"
                  >
                    <UnitIcon unit={unit} />
                    <span className="text-sm font-semibold text-[#1e3a34] group-hover:text-[#1f644e] transition-colors">
                      {unit.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Start button */}
      {units.length > 0 && (
        <div className="pt-4">
          <button
            onClick={() => onNavigateTo(units[0]._id || units[0].id)}
            className="flex items-center gap-2 px-8 py-4 bg-[#1f644e] text-white rounded-2xl font-bold shadow-lg shadow-[#1f644e]/20 hover:bg-[#17503e] hover:-translate-y-0.5 transition-all"
          >
            Start Learning
            <Play className="w-4 h-4 fill-white" />
          </button>
        </div>
      )}
    </div>
  );
}
