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

const MODULE_KEYWORDS = [
  {
    words: ['fundamental', 'basic', 'intro', 'overview', 'setup', 'what', 'why'],
    label: 'Foundations',
  },
  {
    words: ['core', 'main', 'build', 'implement', 'create', 'develop', 'pattern'],
    label: 'Core Concepts',
  },
  {
    words: ['advanced', 'deep', 'optim', 'scale', 'deploy', 'product', 'real'],
    label: 'Advanced & Applied',
  },
  {
    words: ['review', 'summary', 'next', 'future', 'wrap', 'conclusion', 'recap'],
    label: 'Review & Next Steps',
  },
];

function assignModule(title) {
  const lower = title.toLowerCase();
  for (const mk of MODULE_KEYWORDS) {
    if (mk.words.some((w) => lower.includes(w))) return mk.label;
  }
  return null;
}

/**
 * Parses a Markdown course outline into grouped module suggestions.
 * Returns [] when no sections could be extracted.
 */
export function parseOutlineToModules(outline) {
  const lines = outline.trim().split('\n');
  const sectionTitles = [];
  let currentGroup = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ') && !trimmed.toLowerCase().includes('module')) {
      const title = trimmed.replace(/^##\s+/, '').trim();
      if (title) sectionTitles.push({ title, group: currentGroup });
    } else if (trimmed.startsWith('### ')) {
      const title = trimmed.replace(/^###\s+/, '').trim();
      if (title && title.length < 100) sectionTitles.push({ title, group: currentGroup });
    } else if (trimmed.match(/^#{1,2}\s+(module|phase|part|step)/i)) {
      currentGroup = trimmed.replace(/^#{1,2}\s+/, '').trim();
    }
  }

  if (sectionTitles.length === 0) {
    const paragraphs = outline
      .trim()
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const p of paragraphs) {
      const firstLine = p
        .split('\n')[0]
        .trim()
        .replace(/^[-*\d.]\s+/, '');
      if (firstLine && firstLine.length > 3 && firstLine.length < 120) {
        sectionTitles.push({ title: firstLine, group: '' });
      }
    }
  }

  if (sectionTitles.length === 0) return [];

  const moduleMap = {};
  let unassignedBuffer = [];
  for (const s of sectionTitles) {
    const mod = s.group || assignModule(s.title);
    if (mod) {
      if (unassignedBuffer.length > 0) {
        if (!moduleMap['Miscellaneous'])
          moduleMap['Miscellaneous'] = { sections: [], label: 'Miscellaneous' };
        moduleMap['Miscellaneous'].sections.push(...unassignedBuffer);
        unassignedBuffer = [];
      }
      if (!moduleMap[mod]) moduleMap[mod] = { sections: [], label: mod };
      moduleMap[mod].sections.push(s.title);
    } else {
      unassignedBuffer.push(s.title);
    }
  }
  if (unassignedBuffer.length > 0) {
    if (!moduleMap['Miscellaneous'])
      moduleMap['Miscellaneous'] = { sections: [], label: 'Miscellaneous' };
    moduleMap['Miscellaneous'].sections.push(...unassignedBuffer);
  }

  return Object.values(moduleMap).map((m, i) => ({
    order: i,
    title: m.label,
    summary: `Covers: ${m.sections.slice(0, 3).join(', ')}${m.sections.length > 3 ? `, and ${m.sections.length - 3} more` : ''}`,
    sectionCount: m.sections.length,
    sections: m.sections,
  }));
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
