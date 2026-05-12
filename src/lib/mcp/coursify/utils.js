export function textResult(text, structuredContent = undefined, extra = {}) {
  const content = [{ type: 'text', text }];
  if (structuredContent) {
    content.push({ type: 'text', text: JSON.stringify(structuredContent, null, 2) });
  }
  return {
    content,
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

/**
 * Parses a Markdown string with ## [BlockType] headers into structured Coursify blocks.
 * Ported from EditSectionModal.js (Magic Import logic).
 */
/**
 * Unescapes a string that was potentially wrapped in quotes and contained escaped characters.
 */
export function unescapeString(str) {
  if (!str) return '';
  let val = str.trim();
  // Remove surrounding quotes if they exist
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.substring(1, val.length - 1);
  }
  // Handle escaped characters
  return val.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

export function parseMarkdownToBlocks(text) {
  if (!text || typeof text !== 'string') return [];

  // Remove potential YAML frontmatter
  const cleanText = text.replace(/^---[\s\S]*?---/, '').trim();

  const blockRegex = /##\s*\[(MdBlock|QuizBlock|VideoBlock|ResourceBlock|StepByStepBlock)\]/g;
  const blocks = [];
  const matches = [];
  let match;

  while ((match = blockRegex.exec(cleanText)) !== null) {
    matches.push({ type: match[1], index: match.index, full: match[0] });
  }

  // If no block headers found, treat entire text as a single MdBlock
  if (matches.length === 0) {
    return [{ type: 'MdBlock', content: cleanText, order: 0 }];
  }

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const nextIndex = matches[i + 1] ? matches[i + 1].index : cleanText.length;
    let rawContent = cleanText.substring(m.index + m.full.length, nextIndex).trim();

    // Clean up trailing separators
    rawContent = rawContent.replace(/\n\s*---\s*$/, '').trim();
    const block = { type: m.type, order: i };

    if (m.type === 'MdBlock') {
      block.content = rawContent;
    } else if (m.type === 'VideoBlock') {
      const urlMatch = rawContent.match(/url:\s*(.*)/);
      const titleMatch = rawContent.match(/title:\s*(.*)/);
      block.video = {
        url: unescapeString(urlMatch?.[1] || ''),
        title: unescapeString(titleMatch?.[1] || ''),
        platform: 'youtube',
      };
    } else if (m.type === 'ResourceBlock') {
      const urlMatch = rawContent.match(/url:\s*(.*)/);
      const titleMatch = rawContent.match(/title:\s*(.*)/);
      const typeMatch = rawContent.match(/type:\s*(.*)/);
      block.resource = {
        url: unescapeString(urlMatch?.[1] || ''),
        title: unescapeString(titleMatch?.[1] || ''),
        type: unescapeString(typeMatch?.[1] || 'other'),
      };
    } else if (m.type === 'StepByStepBlock') {
      block.steps = [];
      const titleMatch = rawContent.match(/^title:\s*(.*)/m);
      if (titleMatch) {
        block.title = unescapeString(titleMatch[1]);
        rawContent = rawContent.replace(titleMatch[0], '');
      }
      const numMatch = rawContent.match(/^showNumbering:\s*(.*)/m);
      if (numMatch) {
        block.showNumbering = unescapeString(numMatch[1]) !== 'false';
        rawContent = rawContent.replace(numMatch[0], '');
      } else {
        block.showNumbering = true;
      }

      const sParts = rawContent.split(/(?:^|\n)\s*-\s*step:\s*/).filter((p) => p.trim());
      sParts.forEach((s) => {
        const lines = s.split('\n');
        const title = unescapeString(lines[0]);
        let stepContent = lines.slice(1).join('\n').trim();
        if (stepContent.startsWith('content:')) {
          stepContent = stepContent.replace(/^content:\s*/, '').trim();
        }
        stepContent = unescapeString(stepContent);
        if (title) block.steps.push({ title, content: stepContent });
      });
    } else if (m.type === 'QuizBlock') {
      block.quiz = { questions: [] };
      const qRegex = /(?:^|\n)\s*-\s*question:\s*/g;
      const qMatches = [];
      let qMatch;
      while ((qMatch = qRegex.exec(rawContent)) !== null) {
        qMatches.push({ index: qMatch.index, full: qMatch[0] });
      }

      for (let j = 0; j < qMatches.length; j++) {
        const start = qMatches[j].index + qMatches[j].full.length;
        const end = qMatches[j + 1] ? qMatches[j + 1].index : rawContent.length;
        const qRaw = rawContent.substring(start, end);

        const qObj = {
          type: 'multiple_choice',
          question: '',
          options: [],
          correctAnswer: '',
          explanation: '',
          points: 1,
        };

        const lines = qRaw.split('\n');
        qObj.question = unescapeString(lines[0]);

        let parsingKey = '';
        lines.slice(1).forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed) return;

          if (trimmed.includes(':') && !trimmed.startsWith('-')) {
            const sIdx = trimmed.indexOf(':');
            const key = trimmed.substring(0, sIdx).trim();
            const val = trimmed.substring(sIdx + 1).trim();

            if (key === 'type') qObj.type = unescapeString(val);
            else if (key === 'correctAnswer') qObj.correctAnswer = unescapeString(val);
            else if (key === 'explanation') qObj.explanation = unescapeString(val);
            else if (key === 'points') qObj.points = parseInt(val) || 1;
            else if (key === 'options') {
              parsingKey = 'options';
              const arrMatch = trimmed.match(/\[(.*?)\]/);
              if (arrMatch) {
                qObj.options = arrMatch[1].split(',').map((o) => unescapeString(o));
                parsingKey = '';
              }
            } else {
              parsingKey = key;
            }
          } else if (trimmed.startsWith('-') && parsingKey === 'options') {
            qObj.options.push(unescapeString(trimmed.replace(/^-/, '')));
          }
        });

        // Resolve correctAnswer index from text if needed
        if (qObj.options.length > 0) {
          const lowerCA = qObj.correctAnswer.toString().toLowerCase();
          if (qObj.type === 'multi_select') {
            const answers = [];
            qObj.options.forEach((opt, idx) => {
              if (lowerCA.includes(opt.toLowerCase())) answers.push(idx);
            });
            qObj.correctAnswer = answers;
          } else {
            const foundIdx = qObj.options.findIndex((o) => o.toLowerCase() === lowerCA);
            if (foundIdx !== -1) {
              qObj.correctAnswer = foundIdx;
            }
          }
          // True/False detection
          if (
            qObj.options.length === 2 &&
            qObj.options.some((o) => o.toLowerCase() === 'true') &&
            qObj.options.some((o) => o.toLowerCase() === 'false')
          ) {
            qObj.type = 'true_false';
          }
        }
        if (qObj.question) block.quiz.questions.push(qObj);
      }
    }
    blocks.push(block);
  }

  return blocks;
}

/**
 * Generates a Markdown string from structured Coursify blocks.
 * Ported from EditSectionModal.js (generateMarkdownExport logic).
 */
export function generateMarkdownFromBlocks(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';
  let output = '';

  blocks.forEach((block, i) => {
    output += `## [${block.type}]\n`;
    if (block.type === 'MdBlock') {
      output += `${block.content}\n\n`;
    } else if (block.type === 'VideoBlock') {
      output += `url: ${block.video?.url || ''}\n`;
      output += `title: "${block.video?.title || ''}"\n\n`;
    } else if (block.type === 'ResourceBlock') {
      output += `url: ${block.resource?.url || ''}\n`;
      output += `title: "${block.resource?.title || ''}"\n`;
      output += `type: "${block.resource?.type || 'other'}"\n\n`;
    } else if (block.type === 'StepByStepBlock') {
      if (block.title) output += `title: "${block.title}"\n`;
      if (block.showNumbering === false) output += 'showNumbering: false\n';
      (block.steps || []).forEach((s) => {
        output += `- step: "${s.title}"\n  content: "${(s.content || '').replace(/\n/g, '\\n')}"\n`;
      });
      output += '\n';
    } else if (block.type === 'QuizBlock') {
      (block.quiz?.questions || []).forEach((q) => {
        output += `- question: "${q.question}"\n`;
        output += `  type: "${q.type}"\n`;
        output += `  options:\n${(q.options || []).map((o) => `    - "${o}"`).join('\n')}\n`;
        let answerText = q.correctAnswer;
        if (q.type === 'multiple_choice' || q.type === 'true_false') {
          const idx = parseInt(q.correctAnswer);
          if (!isNaN(idx) && q.options[idx]) answerText = q.options[idx];
        } else if (q.type === 'multi_select' && Array.isArray(q.correctAnswer)) {
          answerText = q.correctAnswer
            .map((idx) => q.options[parseInt(idx)])
            .filter(Boolean)
            .join(', ');
        }
        output += `  correctAnswer: "${answerText}"\n`;
        output += `  explanation: "${q.explanation}"\n`;
        output += `  points: ${q.points}\n`;
      });
      output += '\n';
    }
    if (i < blocks.length - 1) output += '---\n\n';
  });

  return output;
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
    content: section.content || '',
    blocks: (section.blocks || []).map((b) => ({
      id: b._id?.toString?.() || b.id,
      type: b.type,
      content: b.content,
      quiz: b.quiz
        ? {
            questions: (b.quiz.questions || []).map((q) => ({
              id: q._id?.toString?.() || q.id,
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
