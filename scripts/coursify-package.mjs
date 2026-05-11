import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { parseMarkdownToBlocks } from '../src/lib/mcp/coursify/utils.js';

/**
 * Coursify Packager Script
 *
 * Usage: node scripts/coursify-package.mjs <course-dir> [output-file]
 */

const courseDir = process.argv[2];
const outputFile = process.argv[3] || 'course-bundle.json';

if (!courseDir) {
  console.error('Usage: node scripts/coursify-package.mjs <course-dir> [output-file]');
  process.exit(1);
}

const absoluteCourseDir = path.resolve(process.cwd(), courseDir);

if (!fs.existsSync(absoluteCourseDir)) {
  console.error(`Course directory not found: ${absoluteCourseDir}`);
  process.exit(1);
}

function parseFrontmatter(content) {
  const fmMatch = content.match(/^---([\s\S]*?)---/);
  if (!fmMatch) return { data: {}, content };
  try {
    const data = yaml.load(fmMatch[1]);
    const body = content.replace(/^---[\s\S]*?---/, '').trim();
    return { data, content: body };
  } catch (e) {
    console.warn(`Failed to parse frontmatter: ${e.message}`);
    return { data: {}, content };
  }
}

async function packageCourse() {
  console.log(`Packaging course from: ${absoluteCourseDir}`);

  // 1. Course Metadata
  const courseInfoPath = path.join(absoluteCourseDir, 'info.yaml');
  if (!fs.existsSync(courseInfoPath)) {
    console.error(`Missing info.yaml in course root: ${courseInfoPath}`);
    process.exit(1);
  }
  const courseMetadata = yaml.load(fs.readFileSync(courseInfoPath, 'utf8'));

  const bundle = {
    ...courseMetadata,
    modules: [],
  };

  // 2. Modules
  const items = fs.readdirSync(absoluteCourseDir).sort();
  for (const item of items) {
    const itemPath = path.join(absoluteCourseDir, item);
    if (!fs.statSync(itemPath).isDirectory()) continue;

    const moduleInfoPath = path.join(itemPath, 'info.yaml');
    if (!fs.existsSync(moduleInfoPath)) continue; // Not a module directory

    console.log(`  Processing Module: ${item}`);
    const moduleMetadata = yaml.load(fs.readFileSync(moduleInfoPath, 'utf8'));
    const moduleEntry = {
      ...moduleMetadata,
      sections: [],
    };

    // 3. Sections
    const sectionDirs = fs.readdirSync(itemPath).sort();
    for (const sDir of sectionDirs) {
      const sPath = path.join(itemPath, sDir);
      if (!fs.statSync(sPath).isDirectory()) continue;

      const dataMdPath = path.join(sPath, 'data.md');
      if (!fs.existsSync(dataMdPath)) continue;

      console.log(`    Processing Section: ${sDir}`);
      const rawContent = fs.readFileSync(dataMdPath, 'utf8');
      const { data: sectionFm, content } = parseFrontmatter(rawContent);

      const blocks = parseMarkdownToBlocks(content);

      moduleEntry.sections.push({
        ...sectionFm,
        blocks,
        content, // Original markdown preserved if needed
      });
    }

    bundle.modules.push(moduleEntry);
  }

  fs.writeFileSync(outputFile, JSON.stringify(bundle, null, 2));
  console.log(`\nSuccessfully packaged course bundle to: ${outputFile}`);
}

packageCourse().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
