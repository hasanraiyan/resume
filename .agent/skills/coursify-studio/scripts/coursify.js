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
const { COURSE_AUTHORING_GUIDE } = jiti('@/lib/mcp/coursify/constants.js');
const dbConnectImport = jiti('@/lib/dbConnect.js');
const dbConnect = dbConnectImport.default || dbConnectImport;

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
  .version('1.0.0');

// 1. Guide
program
  .command('guide')
  .description('Prints out the full Coursify authoring guide, workflows, and templates')
  .action(() => {
    console.log('# Coursify Authoring Guide\n');
    Object.entries(COURSE_AUTHORING_GUIDE).forEach(([key, value]) => {
      if (key === 'studioSkill') {
        console.log(value);
        console.log('\n---\n');
      } else if (Array.isArray(value)) {
        console.log(`## ${key.charAt(0).toUpperCase() + key.slice(1)}`);
        value.forEach((item) => console.log(`- ${item}`));
        console.log('');
      } else if (typeof value === 'object') {
        console.log(`## ${key.charAt(0).toUpperCase() + key.slice(1)}`);
        console.log(JSON.stringify(value, null, 2));
        console.log('');
      } else {
        console.log(`## ${key.charAt(0).toUpperCase() + key.slice(1)}`);
        console.log(value);
        console.log('');
      }
    });
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
    const result = options.query
      ? await dbOps.dbSearchCourses({ query: options.query })
      : await dbOps.dbListCourses({
          status: options.status,
          limit: options.limit,
          offset: options.offset,
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
    const data = await dbOps.dbGetCourse({ id, includeSectionContent: !!options.includeContent });
    if (options.includeResearch) {
      data.researchNotes = await dbOps.dbGetResearchNotes({ courseId: id });
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
    console.log(JSON.stringify(result, null, 2));
  });

courses
  .command('delete <ids...>')
  .description('Soft-delete one or more courses')
  .action(async (ids) => {
    await connect();
    await Promise.all(ids.map((id) => dbOps.dbDeleteCourse({ id })));
    console.log(JSON.stringify({ success: true, deletedIds: ids }, null, 2));
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
    const result = await dbOps.dbReorderModules({ courseId: options.courseId, moduleIds: ids });
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
    const fileData = parseJsonFile(options.file);
    const content = readTextFile(options.contentFile);
    const payload = { ...fileData, ...options };
    if (content) payload.content = content;
    delete payload.file;
    delete payload.contentFile;

    const { id, courseId, ...fields } = payload;
    let result;
    if (id) {
      result = await dbOps.dbUpdateSection({ id, ...fields });
    } else {
      result = await dbOps.dbAddSection({ courseId, ...fields });
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
    const result = await dbOps.dbReorderSections({
      courseId: options.courseId,
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
    const findings = parseJsonFile(options.file);
    if (!Array.isArray(findings)) {
      console.error('Research file must contain an array of findings');
      process.exit(1);
    }
    const result = await dbOps.dbResearchFindings({ courseId: options.courseId, findings });
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
