export function textResult(text, structuredContent = undefined, extra = {}) {
  return {
    content: [{ type: 'text', text }],
    ...(structuredContent ? { structuredContent } : {}),
    ...extra,
  };
}

export function errorResult(message) {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

export function toolMeta(invoking, invoked) {
  return {
    'openai/toolInvocation/invoking': invoking,
    'openai/toolInvocation/invoked': invoked,
  };
}

export function normalizeCourse(course) {
  return {
    id: course._id?.toString?.() || course.id,
    slug: course.slug || null,
    title: course.title,
    description: course.description || '',
    status: course.status || 'draft',
    difficulty: course.difficulty || 'beginner',
    estimatedDuration: course.estimatedDuration || '',
    tags: course.tags || [],
    thumbnail: course.thumbnail || null,
    sectionCount: course.sectionCount ?? 0,
    // Planning fields
    targetAudience: course.targetAudience || '',
    learningObjectives: course.learningObjectives || [],
    prerequisites: course.prerequisites || [],
    outcome: course.outcome || '',
    outline: course.outline || '',
    planningNotes: course.planningNotes || '',
    researchNotes: (course.researchNotes || []).map((n) => ({
      id: n._id?.toString?.() || n.id,
      title: n.title || '',
      summary: n.summary || '',
      sourceUrl: n.sourceUrl || '',
      sourceType: n.sourceType || 'other',
      notes: n.notes || '',
      accessedAt: n.accessedAt || null,
    })),
    authoringStatus: course.authoringStatus || 'idea',
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

export function normalizeSection(section) {
  return {
    id: section._id?.toString?.() || section.id,
    courseId: section.courseId?.toString?.() || section.courseId,
    moduleId: section.moduleId?.toString?.() || null,
    title: section.title,
    sectionType: section.sectionType || 'lesson',
    content: section.content || '',
    quiz: {
      questions: (section.quiz?.questions || []).map((q) => ({
        id: q._id?.toString?.() || q.id,
        type: q.type,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer ?? null,
        explanation: q.explanation || '',
        points: q.points ?? 1,
      })),
    },
    summary: section.summary || '',
    learningGoals: section.learningGoals || [],
    estimatedDuration: section.estimatedDuration || '',
    order: section.order ?? 0,
    status: section.status || 'draft',
    resources: section.resources || [],
    createdAt: section.createdAt,
    updatedAt: section.updatedAt,
  };
}

export function normalizeModule(mod) {
  return {
    id: mod._id?.toString?.() || mod.id,
    courseId: mod.courseId?.toString?.() || mod.courseId,
    title: mod.title,
    summary: mod.summary || '',
    learningGoals: mod.learningGoals || [],
    order: mod.order ?? 0,
    status: mod.status || 'planned',
    sectionCount: mod.sectionCount ?? 0,
    createdAt: mod.createdAt,
    updatedAt: mod.updatedAt,
  };
}
