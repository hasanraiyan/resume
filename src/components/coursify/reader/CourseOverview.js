import { Clock, Layers, Check, ChevronRight, ScrollText } from 'lucide-react';
import { QuizIcon } from './icons';

function SectionIcon({ section }) {
  const onlyQuiz = section.blocks?.length === 1 && section.blocks[0].type === 'QuizBlock';
  if (onlyQuiz) return <QuizIcon className="w-3 h-3 text-[#7c8e88] shrink-0" />;
  return <ScrollText className="w-3 h-3 text-[#7c8e88] shrink-0" />;
}

const DIFFICULTY_COLORS = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
};

/**
 * Shared Course Overview component.
 */
export function CourseOverview({ course, sections, modules, onNavigateTo, hideThumbnail = false }) {
  if (!course) return null;

  return (
    <div>
      {/* Thumbnail */}
      {course.thumbnail && !hideThumbnail && (
        <div className="w-full aspect-video rounded-2xl overflow-hidden mb-8 border border-[#e5e3d8] shadow-sm">
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title + meta */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
            DIFFICULTY_COLORS[course.difficulty] || DIFFICULTY_COLORS.beginner
          }`}
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
        <p className="text-base text-[#7c8e88] leading-relaxed mb-8">{course.description}</p>
      )}

      {/* What you'll learn */}
      {course.learningObjectives?.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-[#1e3a34] mb-3">What you&apos;ll learn</h3>
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
                {modules.map((mod, modIdx) => {
                  const modSections = sections.filter((s) => s.moduleId === mod._id);
                  return (
                    <div key={mod._id} className="mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] mb-1 px-2">
                        {modIdx + 1}. {mod.title}
                      </p>
                      <div className="ml-4 space-y-0.5">
                        {modSections.map((section) => (
                          <button
                            key={section._id}
                            onClick={() => onNavigateTo(section._id)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors flex items-center gap-2"
                          >
                            <SectionIcon section={section} />
                            {section.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {sections.filter((s) => !s.moduleId).length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88] mb-1 px-2">
                      More
                    </p>
                    <div className="ml-4 space-y-0.5">
                      {sections
                        .filter((s) => !s.moduleId)
                        .map((section) => (
                          <button
                            key={section._id}
                            onClick={() => onNavigateTo(section._id)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors flex items-center gap-2"
                          >
                            <SectionIcon section={section} />
                            {section.title}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              sections.map((section) => (
                <button
                  key={section._id}
                  onClick={() => onNavigateTo(section._id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors flex items-center gap-2"
                >
                  <SectionIcon section={section} />
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
          onClick={() => onNavigateTo(sections[0]._id)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#1f644e] text-white rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors"
        >
          Start learning <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
