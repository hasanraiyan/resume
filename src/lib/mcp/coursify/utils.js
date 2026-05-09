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
 * Returns [] when no units could be extracted.
 */
export function parseOutlineToModules(outline) {
  const lines = outline.trim().split('\n');
  const unitTitles = [];
  let currentGroup = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ') && !trimmed.toLowerCase().includes('module')) {
      const title = trimmed.replace(/^##\s+/, '').trim();
      if (title) unitTitles.push({ title, group: currentGroup });
    } else if (trimmed.startsWith('### ')) {
      const title = trimmed.replace(/^###\s+/, '').trim();
      if (title && title.length < 100) unitTitles.push({ title, group: currentGroup });
    } else if (trimmed.match(/^#{1,2}\s+(module|phase|part|step)/i)) {
      currentGroup = trimmed.replace(/^#{1,2}\s+/, '').trim();
    }
  }

  if (unitTitles.length === 0) {
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
        unitTitles.push({ title: firstLine, group: '' });
      }
    }
  }

  if (unitTitles.length === 0) return [];

  const moduleMap = {};
  let unassignedBuffer = [];
  for (const s of unitTitles) {
    const mod = s.group || assignModule(s.title);
    if (mod) {
      if (unassignedBuffer.length > 0) {
        if (!moduleMap['Miscellaneous'])
          moduleMap['Miscellaneous'] = { units: [], label: 'Miscellaneous' };
        moduleMap['Miscellaneous'].units.push(...unassignedBuffer);
        unassignedBuffer = [];
      }
      if (!moduleMap[mod]) moduleMap[mod] = { units: [], label: mod };
      moduleMap[mod].units.push(s.title);
    } else {
      unassignedBuffer.push(s.title);
    }
  }
  if (unassignedBuffer.length > 0) {
    if (!moduleMap['Miscellaneous'])
      moduleMap['Miscellaneous'] = { units: [], label: 'Miscellaneous' };
    moduleMap['Miscellaneous'].units.push(...unassignedBuffer);
  }

  return Object.values(moduleMap).map((m, i) => ({
    order: i,
    title: m.label,
    summary: `Covers: ${m.units.slice(0, 3).join(', ')}${m.units.length > 3 ? `, and ${m.units.length - 3} more` : ''}`,
    unitCount: m.units.length,
    units: m.units,
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
    unitCount: course.unitCount ?? 0,
    unitsComplete: course.unitsComplete ?? 0,
    unitsTotal: course.unitsTotal ?? 0,
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

export function normalizeUnit(unit) {
  return {
    id: unit._id?.toString?.() || unit.id,
    courseId: unit.courseId?.toString?.() || unit.courseId,
    moduleId: unit.moduleId?.toString?.() || null,
    title: unit.title,
    unitType: unit.unitType || 'lesson',
    content: unit.content || '',
    quiz: {
      questions: (unit.quiz?.questions || []).map((q) => ({
        id: q._id?.toString?.() || q.id,
        type: q.type,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer ?? null,
        explanation: q.explanation || '',
        points: q.points ?? 1,
      })),
    },
    summary: unit.summary || '',
    learningGoals: unit.learningGoals || [],
    estimatedDuration: unit.estimatedDuration || '',
    order: unit.order ?? 0,
    status: unit.status || 'draft',
    completionStatus: unit.completionStatus || 'not_started',
    blocks: (unit.blocks || []).map((b) => ({
      id: b._id?.toString?.() || b.id,
      type: b.type,
      video: b.video,
      article: b.article,
      quiz: b.quiz,
    })),
    resources: unit.resources || [],
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
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
    unitCount: mod.unitCount ?? 0,
    createdAt: mod.createdAt,
    updatedAt: mod.updatedAt,
  };
}
