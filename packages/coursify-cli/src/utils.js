/**
 * Ported from src/lib/mcp/coursify/utils.js
 */

export function unescapeString(str) {
  if (!str) return '';
  let val = str.trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.substring(1, val.length - 1);
  }
  return val.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

export function parseMarkdownToBlocks(text) {
  if (!text || typeof text !== 'string') return [];

  const cleanText = text.replace(/^---[\s\S]*?---/, '').trim();
  const blockRegex = /##\s*\[(MdBlock|QuizBlock|VideoBlock|ResourceBlock|StepByStepBlock)\]/g;
  const blocks = [];
  const matches = [];
  let match;

  while ((match = blockRegex.exec(cleanText)) !== null) {
    matches.push({ type: match[1], index: match.index, full: match[0] });
  }

  if (matches.length === 0) {
    return [{ type: 'MdBlock', content: cleanText, order: 0 }];
  }

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const nextIndex = matches[i + 1] ? matches[i + 1].index : cleanText.length;
    let rawContent = cleanText.substring(m.index + m.full.length, nextIndex).trim();

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

export function lintContent(title, content) {
  const issues = [];

  if (content.includes('\n# ')) {
    issues.push('Found H1 (#). Use H2 (##) for block headers and H3 (###) for sub-headings.');
  }

  if (content.includes('```mermaid') && !content.includes('```\n')) {
    issues.push('Possible unclosed Mermaid block.');
  }

  const blocks = parseMarkdownToBlocks(content);
  blocks.forEach((b, i) => {
    if (b.type === 'QuizBlock') {
      (b.quiz?.questions || []).forEach((q, qi) => {
        if (!q.question) issues.push(`Block ${i}, Quiz ${qi}: Missing question text.`);
        if (!q.options?.length) issues.push(`Block ${i}, Quiz ${qi}: No options provided.`);
        if (q.correctAnswer === null || q.correctAnswer === undefined || q.correctAnswer === '') {
          issues.push(`Block ${i}, Quiz ${qi}: Missing or invalid correctAnswer.`);
        }
      });
    }
  });

  return issues;
}
