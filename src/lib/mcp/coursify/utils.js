import { parseMarkdownToBlocks, generateMarkdownFromBlocks } from '@/utils/coursify-parser.js';

export { parseMarkdownToBlocks, generateMarkdownFromBlocks };

import { textResult, errorResult, toolMeta } from '../utils.js';

export { textResult, errorResult, toolMeta };

export function normalizeCourse(course) {
  return {
    id: course._id?.toString?.() || course.id,
    _id: course._id?.toString?.() || course.id,
    slug: course.slug || null,
    title: course.title,
    description: course.description || '',
    status: course.status || 'draft',
    difficulty: course.difficulty || 'beginner',
    estimatedDuration: course.estimatedDuration || '',
    tags: course.tags || [],
    thumbnail: course.thumbnail || null,
    sectionCount: course.sectionCount ?? 0,
    sectionsComplete: course.sectionsComplete ?? 0,
    sectionsTotal: course.sectionsTotal ?? 0,
    // Planning fields
    targetAudience: course.targetAudience || '',
    learningObjectives: course.learningObjectives || [],
    prerequisites: course.prerequisites || [],
    outcome: course.outcome || '',
    outline: course.outline || '',
    planningNotes: course.planningNotes || '',
    agentNotes: course.agentNotes || '',
    researchNotes: (course.researchNotes || []).map((n) => ({
      id: n._id?.toString?.() || n.id,
      _id: n._id?.toString?.() || n.id,
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
    deletedAt: course.deletedAt || null,
  };
}

export function normalizeSection(section) {
  return {
    id: section._id?.toString?.() || section.id,
    _id: section._id?.toString?.() || section.id,
    courseId: section.courseId?.toString?.() || section.courseId,
    moduleId: section.moduleId?.toString?.() || null,
    title: section.title,
    content: section.content || '',
    blocks: (section.blocks || []).map((b) => ({
      id: b._id?.toString?.() || b.id,
      _id: b._id?.toString?.() || b.id,
      type: b.type,
      title: b.title,
      content: b.content,
      quiz: b.quiz
        ? {
            questions: (b.quiz.questions || []).map((q) => ({
              id: q._id?.toString?.() || q.id,
              _id: q._id?.toString?.() || q.id,
              type: q.type,
              question: q.question,
              options: q.options || [],
              correctAnswer: q.correctAnswer ?? null,
              explanation: q.explanation || '',
              points: q.points ?? 1,
            })),
          }
        : undefined,
      video: b.video,
      resource: b.resource,
      steps: b.steps,
      showNumbering: b.showNumbering,
      items: b.items,
      tabs: b.tabs,
      calloutType: b.calloutType,
      chart: b.chart,
      order: b.order ?? 0,
    })),
    summary: section.summary || '',
    learningGoals: section.learningGoals || [],
    estimatedDuration: section.estimatedDuration || '',
    order: section.order ?? 0,
    status: section.status || 'draft',
    resources: section.resources || [],
    createdAt: section.createdAt,
    updatedAt: section.updatedAt,
    deletedAt: section.deletedAt || null,
  };
}

export function normalizeModule(mod) {
  return {
    id: mod._id?.toString?.() || mod.id,
    _id: mod._id?.toString?.() || mod.id,
    courseId: mod.courseId?.toString?.() || mod.courseId,
    title: mod.title,
    summary: mod.summary || '',
    learningGoals: mod.learningGoals || [],
    order: mod.order ?? 0,
    status: mod.status || 'planned',
    sectionCount: mod.sectionCount ?? 0,
    createdAt: mod.createdAt,
    updatedAt: mod.updatedAt,
    deletedAt: mod.deletedAt || null,
  };
}
