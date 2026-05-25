#!/usr/bin/env node

/**
 * Coursify CLI Tool
 * Mirrors MCP tools for command-line access.
 *
 * Usage: node scripts/coursify.js [command] [options]
 */

const { createJiti } = require('jiti');
const path = require('path');
const fs = require('fs');

// Set up jiti to handle aliases and ESM
const jiti = createJiti(__filename, {
  alias: {
    '@': path.join(process.cwd(), 'src'),
  },
  interopDefault: true,
});

// Load environment variables
require('dotenv').config();

const { program } = require('commander');

// Import DB operations and constants using jiti
const dbOps = jiti('@/lib/coursify/db-ops.js');
const { COURSE_AUTHORING_GUIDE } = jiti('@/lib/coursify/constants.js');
const { parseMarkdownToBlocks } = jiti('@/lib/coursify/utils.js');
const dbConnectImport = jiti('@/lib/dbConnect.js');
const dbConnect = dbConnectImport.default || dbConnectImport;

const CACHE_FILE = path.join(process.cwd(), '.coursify-cache.json');

function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch (e) {
      return { idMap: {} };
    }
  }
  return { idMap: {} };
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function resolveFromCache(alias) {
  const cache = loadCache();
  return cache.idMap[alias] || alias;
}

function updateIdMap(name, id) {
  if (!name || !id) return;
  const cache = loadCache();
  cache.idMap[name] = id;
  saveCache(cache);
}

// ─── Linter Logic ─────────────────────────────────────────────────────────────

function lintContent(title, content) {
  const issues = [];
  const lines = content.split('\n');

  // 1. Heading level consistency
  if (content.includes('\n# ')) {
    issues.push('Found H1 (#). Use H2 (##) for block headers and H3 (###) for sub-headings.');
  }

  // 2. Mermaid syntax (basic check)
  if (content.includes('```mermaid') && !content.includes('```\n')) {
    issues.push('Possible unclosed Mermaid block.');
  }

  // 3. Quiz validation
  const blocks = parseMarkdownToBlocks(content);
  blocks.forEach((b, i) => {
    if (b.type === 'QuizBlock') {
      (b.quiz?.questions || []).forEach((q, qi) => {
        if (!q.question) issues.push(`Block ${i}, Quiz ${qi}: Missing question text.`);
        if (!q.options?.length) issues.push(`Block ${i}, Quiz ${qi}: No options provided.`);
        if (q.correctAnswer === null || q.correctAnswer === undefined) {
          issues.push(`Block ${i}, Quiz ${qi}: Missing or invalid correctAnswer.`);
        }
      });
    }
  });

  return issues;
}

async function connect() {
  try {
    await dbConnect();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

// Global Help
program
  .name('coursify')
  .description('CLI tool for managing Coursify courses, modules, and sections')
  .version('1.1.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().verbose) {
      process.env.VERBOSE = 'true';
    }
  });

function logVerbose(msg, data) {
  if (process.env.VERBOSE) {
    console.error(`[VERBOSE] ${msg}`);
    if (data) console.error(JSON.stringify(data, null, 2));
  }
}

// 1. Guide
program
  .command('guide')
  .description('Prints out the full Coursify authoring guide, workflows, and templates')
  .action(() => {
    // ... rest of guide action
  });

// New Top-level commands
program
  .command('preview <file>')
  .description('Parse a Markdown file and preview the blocks (Dry-Run)')
  .action((file) => {
    const content = readTextFile(file);
    if (!content) {
      console.error(`File not found or empty: ${file}`);
      process.exit(1);
    }
    const blocks = parseMarkdownToBlocks(content);
    const issues = lintContent(file, content);

    console.log(JSON.stringify({ blocks, lintIssues: issues }, null, 2));
    if (issues.length > 0) {
      console.warn(`\nFound ${issues.length} potential issues.`);
    }
  });

program
  .command('init-section')
  .description('Generate a scaffolded Markdown file for a new section')
  .option('--type <standard|lab|procedural>', 'Template type', 'standard')
  .option('--title <string>', 'Section title', 'New Lesson')
  .option('--output <path>', 'Save to file instead of stdout')
  .action((options) => {
    let template = `---
title: ${options.title}
status: draft
---

## [MdBlock]
Intro to ${options.title}...

`;
    if (options.type === 'lab') {
      template += `## [StepByStepBlock]
title: "Lab Instructions"
- step: "Setup Environment"
  content: "Install dependencies..."
- step: "Execute Lab"
  content: "Run the command..."

`;
    } else if (options.type === 'procedural') {
      template += `## [StepByStepBlock]
title: "How to..."
- step: "First step"
  content: "..."

`;
    }

    template += `## [QuizBlock]
- question: "Quick check: What is..."
  options: ["A", "B", "C"]
  correctAnswer: "A"
  explanation: "Because..."
`;

    if (options.output) {
      fs.writeFileSync(options.output, template);
      console.log(`Template written to ${options.output}`);
    } else {
      console.log(template);
    }
  });

// 2. Course Operations
const courses = program.command('courses').description('Course management operations');

courses
  .command('list')
  .description('Retrieve all courses or search by keywords')
  .option('--query <string>', 'Search keyword for title, description, or tags')
  .option('--status <draft|published|all>', 'Filter by status', 'all')
  .option('--limit <n>', 'Limit results', (v) => parseInt(v), 20)
  .option('--offset <n>', 'Offset results', (v) => parseInt(v), 0)
  .action(async (options) => {
    await connect();
    logVerbose('Listing courses with options', options);
    const result = options.query
      ? await dbOps.dbSearchCourses({ query: options.query })
      : await dbOps.dbListCourses({
          status: options.status,
          limit: options.limit,
          offset: options.offset,
        });

    // Update ID map
    result.forEach((c) => {
      updateIdMap(c.slug, c.id);
      updateIdMap(c.title, c.id);
    });

    console.log(JSON.stringify(result, null, 2));
  });

courses
  .command('get <id>')
  .description('Fetches course metadata')
  .option('--include-content', 'Return full Markdown for all sections')
  .option('--include-research', 'Return all research notes')
  .option('--include-progress', 'Return completeness report')
  .action(async (id, options) => {
    await connect();
    const resolvedId = resolveFromCache(id);
    logVerbose(`Fetching course: ${resolvedId} (original: ${id})`);
    const data = await dbOps.dbGetCourse({
      id: resolvedId,
      includeSectionContent: !!options.includeContent,
    });
    if (options.includeResearch) {
      data.researchNotes = await dbOps.dbGetResearchNotes({ courseId: resolvedId });
    }
    if (options.includeProgress) {
      // Re-implementing the progress report logic from tools.js
      const { course, modules } = data;
      const planFields = {
        targetAudience: !!course.targetAudience,
        learningObjectives: (course.learningObjectives || []).length > 0,
        prerequisites: (course.prerequisites || []).length > 0,
        outcome: !!course.outcome,
        outline: !!course.outline,
      };
      const planComplete = Object.values(planFields).filter(Boolean).length;
      const sections = modules.flatMap((m) => m.sections || []);
      const incompleteSections = sections.filter((s) => s.status !== 'complete').length;

      data.progressReport = {
        planCompleteness: {
          filled: planComplete,
          total: Object.keys(planFields).length,
          fields: planFields,
        },
        sectionStats: { total: sections.length, incomplete: incompleteSections },
        authoringStatus: course.authoringStatus || 'idea',
      };
    }
    updateIdMap(data.course.slug, data.course.id);
    updateIdMap(data.course.title, data.course.id);
    console.log(JSON.stringify(data, null, 2));
  });

courses
  .command('upsert')
  .description('Create or update a course')
  .option('--id <id>', 'Omit to create a new course')
  .option('--title <title>', 'Course title')
  .option('--status <status>', 'draft or published')
  .option('--file <path>', 'JSON file with course metadata')
  .action(async (options) => {
    await connect();
    const fileData = parseJsonFile(options.file);
    const payload = { ...fileData, ...options };
    delete payload.file;
    if (payload.id) payload.id = resolveFromCache(payload.id);

    logVerbose('Upserting course with payload', payload);
    const PLAN_KEYS = [
      'targetAudience',
      'learningObjectives',
      'prerequisites',
      'outcome',
      'outline',
      'authoringStatus',
      'agentNotes',
    ];

    let result;
    if (!payload.id) {
      result = await dbOps.dbCreateCourse(payload);
      const hasPlanFields = PLAN_KEYS.some((k) => payload[k] !== undefined);
      if (hasPlanFields) {
        result = await dbOps.dbSaveCoursePlan({ courseId: result.course.id, ...payload });
      }
    } else {
      const BASIC_KEYS = [
        'title',
        'description',
        'difficulty',
        'estimatedDuration',
        'tags',
        'status',
      ];
      const hasBasic = BASIC_KEYS.some((k) => payload[k] !== undefined);
      const hasPlan = PLAN_KEYS.some((k) => payload[k] !== undefined);
      const id = payload.id;

      if (hasBasic && hasPlan) {
        await dbOps.dbUpdateCourse(payload);
        result = await dbOps.dbSaveCoursePlan({ courseId: id, ...payload });
      } else if (hasPlan) {
        result = await dbOps.dbSaveCoursePlan({ courseId: id, ...payload });
      } else {
        result = await dbOps.dbUpdateCourse(payload);
      }
    }
    updateIdMap(result.course.slug, result.course.id);
    console.log(JSON.stringify(result, null, 2));
  });

courses
  .command('delete <ids...>')
  .description('Soft-delete one or more courses')
  .action(async (ids) => {
    await connect();
    const resolvedIds = ids.map(resolveFromCache);
    await Promise.all(resolvedIds.map((id) => dbOps.dbDeleteCourse({ id })));
    console.log(JSON.stringify({ success: true, deletedIds: resolvedIds }, null, 2));
  });

// 3. Module Operations
const modules = program.command('modules').description('Module management operations');

modules
  .command('upsert')
  .description('Create or update a module')
  .option('--id <id>', 'Module ID (omit to create)')
  .requiredOption('--courseId <id>', 'Course ID')
  .option('--title <title>', 'Module title')
  .option('--order <n>', 'Display order', (v) => parseInt(v))
  .option('--file <path>', 'JSON file with module metadata')
  .action(async (options) => {
    await connect();
    const fileData = parseJsonFile(options.file);
    const payload = { ...fileData, ...options };
    delete payload.file;
    payload.courseId = resolveFromCache(payload.courseId);

    const { id, courseId, ...fields } = payload;
    const result = id
      ? await dbOps.dbUpdateModule({ id, ...fields })
      : await dbOps.dbCreateModule({ courseId, ...fields });
    console.log(JSON.stringify(result, null, 2));
  });

modules
  .command('reorder')
  .description('Reorder modules in a course')
  .requiredOption('--courseId <id>', 'Course ID')
  .argument('<ids...>', 'Module IDs in desired order')
  .action(async (ids, options) => {
    await connect();
    const courseId = resolveFromCache(options.courseId);
    const result = await dbOps.dbReorderModules({ courseId, moduleIds: ids });
    console.log(JSON.stringify(result, null, 2));
  });

modules
  .command('delete <ids...>')
  .description('Soft-delete one or more modules')
  .action(async (ids) => {
    await connect();
    const result = await dbOps.dbDeleteModules({ ids });
    console.log(JSON.stringify(result, null, 2));
  });

// 4. Section Operations
const sections = program.command('sections').description('Section management operations');

sections
  .command('sync')
  .description('Batch synchronize sections from a directory')
  .requiredOption('--courseId <id>', 'Course ID')
  .option('--moduleId <id>', 'Default Module ID')
  .requiredOption('--dir <path>', 'Directory containing .md files')
  .option('--dry-run', 'Preview changes without saving')
  .action(async (options) => {
    await connect();
    const courseId = resolveFromCache(options.courseId);
    const dirPath = path.resolve(process.cwd(), options.dir);

    if (!fs.existsSync(dirPath)) {
      console.error(`Directory not found: ${dirPath}`);
      process.exit(1);
    }

    const files = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith('.md'))
      .sort();
    logVerbose(`Found ${files.length} markdown files in ${dirPath}`);

    const results = [];
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const rawContent = fs.readFileSync(filePath, 'utf8');

      // Simple frontmatter extraction
      const fmMatch = rawContent.match(/^---([\s\S]*?)---/);
      let title = file.replace(/^\d+-/, '').replace('.md', '').replace(/-/g, ' ');
      let status = 'draft';
      let order = parseInt(file.match(/^(\d+)-/)?.[1]);

      if (fmMatch) {
        const fm = fmMatch[1];
        const tMatch = fm.match(/title:\s*(.*)/);
        const sMatch = fm.match(/status:\s*(.*)/);
        const oMatch = fm.match(/order:\s*(.*)/);
        if (tMatch) title = tMatch[1].trim();
        if (sMatch) status = sMatch[1].trim();
        if (oMatch) order = parseInt(oMatch[1]);
      }

      const content = rawContent.replace(/^---[\s\S]*?---/, '').trim();
      const payload = {
        courseId,
        moduleId: options.moduleId,
        title,
        status,
        content,
        order: isNaN(order) ? undefined : order,
      };

      if (options.dryRun) {
        const issues = lintContent(file, content);
        results.push({ file, title, issues, action: 'skip (dry-run)' });
      } else {
        logVerbose(`Syncing section: ${title} from ${file}`);
        const result = await dbOps.dbAddSection(payload);
        results.push({ file, title, sectionId: result.section.id, action: 'created' });
      }
    }

    console.log(JSON.stringify(results, null, 2));
  });

sections
  .command('get <id>')
  .description('Fetch a single section with content')
  .action(async (id) => {
    await connect();
    const result = await dbOps.dbGetSectionContent({ id });
    console.log(JSON.stringify(result, null, 2));
  });

sections
  .command('upsert')
  .description('Create or update a section')
  .option('--id <id>', 'Update existing if provided')
  .requiredOption('--courseId <id>', 'Course ID')
  .option('--moduleId <id>', 'Module ID')
  .option('--title <title>', 'Section title')
  .option('--status <status>', 'planned, draft, needs_review, or complete')
  .option('--order <n>', 'Display order', (v) => parseInt(v))
  .option('--file <path>', 'JSON file with section metadata')
  .option('--content-file <path>', 'Markdown file for content (Magic Blocks)')
  .action(async (options) => {
    await connect();
    const courseId = resolveFromCache(options.courseId);
    const fileData = parseJsonFile(options.file);
    const content = readTextFile(options.contentFile);
    const payload = { ...fileData, ...options, courseId };
    if (content) payload.content = content;
    delete payload.file;
    delete payload.contentFile;

    const { id, ...fields } = payload;

    // Linting
    if (payload.content) {
      const issues = lintContent(payload.title || 'Untitled', payload.content);
      if (issues.length > 0) {
        console.warn('Lint Issues Found:');
        issues.forEach((i) => console.warn(`- ${i}`));
      }
    }

    logVerbose('Upserting section with payload', fields);
    let result;
    if (id) {
      result = await dbOps.dbUpdateSection({ id, ...fields });
    } else {
      result = await dbOps.dbAddSection(fields);
    }
    console.log(JSON.stringify(result, null, 2));
  });

sections
  .command('reorder')
  .description('Reorder sections in a course or module')
  .requiredOption('--courseId <id>', 'Course ID')
  .option('--moduleId <id>', 'Module ID')
  .argument('<ids...>', 'Section IDs in desired order')
  .action(async (ids, options) => {
    await connect();
    const courseId = resolveFromCache(options.courseId);
    const result = await dbOps.dbReorderSections({
      courseId,
      moduleId: options.moduleId,
      sectionIds: ids,
    });
    console.log(JSON.stringify(result, null, 2));
  });

sections
  .command('delete <ids...>')
  .description('Soft-delete one or more sections')
  .action(async (ids) => {
    await connect();
    const result = await dbOps.dbDeleteSections({ ids });
    console.log(JSON.stringify(result, null, 2));
  });

// 5. Research Operations
const research = program.command('research').description('Research and planning operations');

research
  .command('add')
  .description('Add research findings to a course')
  .requiredOption('--courseId <id>', 'Course ID')
  .option('--file <path>', 'JSON file with findings array')
  .action(async (options) => {
    await connect();
    const courseId = resolveFromCache(options.courseId);
    const findings = parseJsonFile(options.file);
    if (!Array.isArray(findings)) {
      console.error('Research file must contain an array of findings');
      process.exit(1);
    }
    const result = await dbOps.dbResearchFindings({ courseId, findings });
    console.log(JSON.stringify(result, null, 2));
  });

// --- Utility for File Parsing ---

function parseJsonFile(filePath) {
  if (!filePath) return {};
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading or parsing JSON file at ${filePath}:`, err.message);
    process.exit(1);
  }
}

function readTextFile(filePath) {
  if (!filePath) return '';
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    return fs.readFileSync(fullPath, 'utf8');
  } catch (err) {
    console.error(`Error reading text file at ${filePath}:`, err.message);
    process.exit(1);
  }
}

// Boilerplate done. Commands will be added in subsequent steps.

async function main() {
  await program.parseAsync(process.argv);
  // Close connection if needed
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}
