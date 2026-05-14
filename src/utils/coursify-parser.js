/**
 * Coursify Markdown Parser Utility
 *
 * Shared between Client (Studio, Reader) and Server (DB Operations, MCP).
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

/**
 * Parses a Markdown string with ## [BlockType] headers into structured Coursify blocks.
 */
export function parseMarkdownToBlocks(text) {
  if (!text || typeof text !== 'string') return [];

  // Source of truth for valid block types and their aliases
  const SUPPORTED_BLOCKS = [
    'MdBlock',
    'QuizBlock',
    'VideoBlock',
    'ResourceBlock',
    'StepByStepBlock',
    'AccordionBlock',
    'TabsBlock',
    'CalloutBlock',
    'ChartBlock',
  ];
  const AUTHORING_ALIASES = {
    MermaidBlock: { target: 'MdBlock', wrap: (c) => `\`\`\`mermaid\n${c}\n\`\`\`` },
    CodeBlock: { target: 'MdBlock', wrap: (c) => `\`\`\`\n${c}\n\`\`\`` },
  };
  const ALL_VALID = [...SUPPORTED_BLOCKS, ...Object.keys(AUTHORING_ALIASES)];

  // Remove potential YAML frontmatter
  const cleanText = text.replace(/^---[\s\S]*?---/, '').trim();

  const blockRegex = new RegExp(`##\\s*\\[(${ALL_VALID.join('|')})\\]`, 'g');
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

    // Handle Aliases (transforming them to base types)
    let blockType = m.type;
    let finalContent = rawContent;

    if (AUTHORING_ALIASES[m.type]) {
      const alias = AUTHORING_ALIASES[m.type];
      blockType = alias.target;
      finalContent = alias.wrap(rawContent);
    }

    const block = { type: blockType, order: i };

    if (blockType === 'MdBlock') {
      block.content = finalContent;
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
        rawContent = rawContent.replace(titleMatch[0], '').trim();
      }
      const numMatch = rawContent.match(/^showNumbering:\s*(.*)/m);
      if (numMatch) {
        block.showNumbering = unescapeString(numMatch[1]) !== 'false';
        rawContent = rawContent.replace(numMatch[0], '').trim();
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
    } else if (m.type === 'AccordionBlock') {
      block.items = [];
      const titleMatch = rawContent.match(/^title:\s*(.*)/m);
      if (titleMatch) {
        block.title = unescapeString(titleMatch[1]);
        rawContent = rawContent.replace(titleMatch[0], '').trim();
      }

      const iParts = rawContent.split(/(?:^|\n)\s*-\s*item:\s*/).filter((p) => p.trim());
      iParts.forEach((i) => {
        const lines = i.split('\n');
        const title = unescapeString(lines[0]);
        let itemContent = lines.slice(1).join('\n').trim();
        if (itemContent.startsWith('content:')) {
          itemContent = itemContent.replace(/^content:\s*/, '').trim();
        }
        itemContent = unescapeString(itemContent);
        if (title) block.items.push({ title, content: itemContent });
      });
    } else if (m.type === 'TabsBlock') {
      block.tabs = [];
      const tParts = rawContent.split(/(?:^|\n)\s*-\s*tab:\s*/).filter((p) => p.trim());
      tParts.forEach((t) => {
        const lines = t.split('\n');
        const title = unescapeString(lines[0]);
        let tabContent = lines.slice(1).join('\n').trim();
        if (tabContent.startsWith('content:')) {
          tabContent = tabContent.replace(/^content:\s*/, '').trim();
        }
        tabContent = unescapeString(tabContent);
        if (title) block.tabs.push({ title, content: tabContent });
      });
    } else if (m.type === 'CalloutBlock') {
      const typeMatch = rawContent.match(/^type:\s*(.*)/m);
      if (typeMatch) block.calloutType = unescapeString(typeMatch[1]);
      else block.calloutType = 'info';

      const titleMatch = rawContent.match(/^title:\s*(.*)/m);
      if (titleMatch) block.title = unescapeString(titleMatch[1]);

      const contentMatch = rawContent.match(/^content:\s*([\s\S]*)/m);
      if (contentMatch) {
        block.content = unescapeString(contentMatch[1]);
      } else {
        const lines = rawContent
          .split('\n')
          .filter((l) => !l.startsWith('type:') && !l.startsWith('title:'));
        block.content = unescapeString(lines.join('\n').trim());
      }
    } else if (m.type === 'QuizBlock') {
      block.quiz = { questions: [] };
      const titleMatch = rawContent.match(/^title:\s*(.*)/m);
      if (titleMatch) {
        block.title = unescapeString(titleMatch[1]);
        rawContent = rawContent.replace(titleMatch[0], '').trim();
      }

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
    } else if (m.type === 'ChartBlock') {
      block.chart = {
        type: 'bar',
        title: '',
        description: '',
        data: { labels: [], datasets: [] },
        options: {},
      };

      const typeMatch = rawContent.match(/^type:\s*["']?(.*?)["']?$/m);
      if (typeMatch) block.chart.type = unescapeString(typeMatch[1]);

      const titleMatch = rawContent.match(/^title:\s*["']?(.*?)["']?$/m);
      if (titleMatch) block.chart.title = unescapeString(titleMatch[1]);

      const descMatch = rawContent.match(/^description:\s*["']?(.*?)["']?$/m);
      if (descMatch) block.chart.description = unescapeString(descMatch[1]);

      // Extract data section
      const dataSectionMatch = rawContent.match(/data:\s*\n([\s\S]*?)(?:\n\w+:|$)/);
      if (dataSectionMatch) {
        const dataContent = dataSectionMatch[1];
        const labelsMatch = dataContent.match(/labels:\s*\[(.*?)\]/);
        if (labelsMatch) {
          block.chart.data.labels = labelsMatch[1].split(',').map((l) => unescapeString(l.trim()));
        }

        const datasetsContentMatch = dataContent.match(/datasets:\s*\n([\s\S]*)$/);
        const datasetsContent = datasetsContentMatch ? datasetsContentMatch[1] : dataContent;

        const datasetsParts = datasetsContent
          .split(/(?:^|\n)\s*-\s*label:\s*/)
          .filter((p) => p.trim());
        datasetsParts.forEach((part) => {
          const lines = part.split('\n');
          const label = unescapeString(lines[0].trim());
          const dataset = { label, data: [], color: '' };

          const dataMatch = part.match(/data:\s*\[(.*?)\]/);
          if (dataMatch) {
            dataset.data = dataMatch[1]
              .split(',')
              .map((d) => parseFloat(d.trim()))
              .filter((d) => !isNaN(d));
          }

          const colorMatch = part.match(/color:\s*["']?(.*?)["']?$/m);
          if (colorMatch) {
            dataset.color = unescapeString(colorMatch[1]);
          }

          block.chart.data.datasets.push(dataset);
        });
      }

      // Extract options section
      const optionsSectionMatch = rawContent.match(/options:\s*\n([\s\S]*?)(?:\n\w+:|$)/);
      if (optionsSectionMatch) {
        const optionsContent = optionsSectionMatch[1];
        const optionLines = optionsContent.split('\n');
        optionLines.forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('-')) return;
          const [key, ...valParts] = trimmed.split(':');
          if (key && valParts.length > 0) {
            const val = valParts.join(':').trim();
            const cleanVal = unescapeString(val);
            if (cleanVal === 'true') block.chart.options[key.trim()] = true;
            else if (cleanVal === 'false') block.chart.options[key.trim()] = false;
            else if (!isNaN(cleanVal) && cleanVal !== '')
              block.chart.options[key.trim()] = parseFloat(cleanVal);
            else block.chart.options[key.trim()] = cleanVal;
          }
        });
      }
    }
    blocks.push(block);
  }

  return blocks;
}

/**
 * Generates a Markdown string from structured Coursify blocks.
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
    } else if (block.type === 'AccordionBlock') {
      if (block.title) output += `title: "${block.title}"\n`;
      (block.items || []).forEach((item) => {
        output += `- item: "${item.title}"\n  content: "${(item.content || '').replace(/\n/g, '\\n')}"\n`;
      });
      output += '\n';
    } else if (block.type === 'TabsBlock') {
      (block.tabs || []).forEach((tab) => {
        output += `- tab: "${tab.title}"\n  content: "${(tab.content || '').replace(/\n/g, '\\n')}"\n`;
      });
      output += '\n';
    } else if (block.type === 'CalloutBlock') {
      if (block.calloutType) output += `type: "${block.calloutType}"\n`;
      if (block.title) output += `title: "${block.title}"\n`;
      output += `content: "${(block.content || '').replace(/\n/g, '\\n')}"\n\n`;
    } else if (block.type === 'QuizBlock') {
      if (block.title) output += `title: "${block.title}"\n\n`;
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
    } else if (block.type === 'ChartBlock' && block.chart) {
      const c = block.chart;
      output += `type: "${c.type || 'bar'}"\n`;
      if (c.title) output += `title: "${c.title}"\n`;
      if (c.description) output += `description: "${c.description}"\n`;

      output += `data:\n`;
      output += `  labels: [${(c.data?.labels || []).map((l) => `"${l}"`).join(', ')}]\n`;
      output += `  datasets:\n`;
      (c.data?.datasets || []).forEach((ds) => {
        output += `    - label: "${ds.label}"\n`;
        output += `      data: [${(ds.data || []).join(', ')}]\n`;
        if (ds.color) output += `      color: "${ds.color}"\n`;
      });

      if (c.options && Object.keys(c.options).length > 0) {
        output += `options:\n`;
        Object.entries(c.options).forEach(([k, v]) => {
          output += `  ${k}: ${typeof v === 'string' ? `"${v}"` : v}\n`;
        });
      }
      output += '\n';
    }
    if (i < blocks.length - 1) output += '---\n\n';
  });

  return output;
}

/**
 * Parses full section Markdown including frontmatter.
 */
export function parseMarkdownSection(text) {
  const result = {
    title: '',
    summary: '',
    learningGoals: [],
    estimatedDuration: '',
    status: 'draft',
    blocks: [],
  };

  // 1. Parse YAML Front-matter
  const frontMatterMatch = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (frontMatterMatch) {
    const yaml = frontMatterMatch[1];
    const lines = yaml.split('\n');
    let currentKey = '';

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('-')) {
        if (currentKey === 'learningGoals') {
          result.learningGoals.push(
            trimmed
              .replace(/^-/, '')
              .trim()
              .replace(/^["'](.*)["']$/, '$1')
          );
        }
      } else if (trimmed.includes(':')) {
        const idx = trimmed.indexOf(':');
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        currentKey = k;
        const cleanV = v.replace(/^["'](.*)["']$/, '$1');
        if (k === 'title') result.title = cleanV;
        if (k === 'summary') result.summary = cleanV;
        if (k === 'estimatedDuration') result.estimatedDuration = cleanV;
        if (k === 'status') result.status = cleanV;
      }
    });
  }

  // 2. Extract Blocks
  result.blocks = parseMarkdownToBlocks(text);

  return result;
}

/**
 * Generates full section Markdown including frontmatter.
 */
export function generateFullMarkdown(data) {
  let output = '---\n';
  output += `title: "${data.title}"\n`;
  output += `summary: "${data.summary}"\n`;
  output += `learningGoals:\n${(data.learningGoals || []).map((g) => `  - "${g}"`).join('\n')}\n`;
  output += `estimatedDuration: "${data.estimatedDuration}"\n`;
  output += `status: "${data.status}"\n`;
  output += '---\n\n# Blocks\n\n';
  output += generateMarkdownFromBlocks(data.blocks);
  return output;
}
