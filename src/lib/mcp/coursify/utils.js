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
    title: course.title,
    description: course.description || '',
    status: course.status || 'draft',
    difficulty: course.difficulty || 'beginner',
    estimatedDuration: course.estimatedDuration || '',
    tags: course.tags || [],
    thumbnail: course.thumbnail || null,
    sectionCount: course.sectionCount ?? 0,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

export function normalizeSection(section) {
  return {
    id: section._id?.toString?.() || section.id,
    courseId: section.courseId?.toString?.() || section.courseId,
    title: section.title,
    content: section.content || '',
    order: section.order ?? 0,
    resources: section.resources || [],
    createdAt: section.createdAt,
    updatedAt: section.updatedAt,
  };
}
