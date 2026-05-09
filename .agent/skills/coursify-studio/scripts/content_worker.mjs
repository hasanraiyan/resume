/**
 * Coursify Studio Content Worker (ESM)
 * 
 * This script performs the actual database operations.
 * It is intended to be run via the manage_content.cjs launcher.
 */

import path from 'path';
import fs from 'fs';
import { 
  dbListCourses, 
  dbGetCourse, 
  dbUpdateCourse, 
  dbUpdateSection, 
  dbAddSection,
  dbDeleteSection 
} from '@/lib/coursify/db-ops';

const projectRoot = process.env.PROJECT_ROOT || process.cwd();

async function run() {
  const [,, command, ...args] = process.argv;

  if (!command || command === 'help') {
    console.log(`
Coursify Studio CLI
Usage: node manage_content.cjs <command> [options]

Commands:
  list-courses              List all courses
  get-course <id>           Get full course outline and content
  publish-course <id>       Toggle course publication status
  upsert-section <json>     Create or update a section (Pass JSON string)
  delete-section <id>       Soft delete a section
    `);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'list-courses': {
        const courses = await dbListCourses();
        // Simplified output for CLI readability
        const table = courses.map(c => ({
          id: c.id,
          title: c.title,
          status: c.status,
          sections: `${c.sectionsComplete}/${c.sectionsTotal}`
        }));
        console.table(table);
        break;
      }
      case 'get-course': {
        const id = args[0];
        if (!id) throw new Error('Course ID is required');
        const data = await dbGetCourse({ id, includeSectionContent: true });
        console.log(JSON.stringify(data, null, 2));
        break;
      }
      case 'publish-course': {
        const id = args[0];
        if (!id) throw new Error('Course ID is required');
        const { course } = await dbGetCourse({ id });
        const newStatus = course.status === 'published' ? 'draft' : 'published';
        const result = await dbUpdateCourse({ id, status: newStatus });
        console.log(`Success: Course '${result.course.title}' is now ${newStatus}.`);
        break;
      }
      case 'upsert-section': {
        const payload = JSON.parse(args[0]);
        let result;
        if (payload.id) {
          result = await dbUpdateSection(payload);
          console.log(`Success: Updated section '${result.section.title}'.`);
        } else {
          result = await dbAddSection(payload);
          console.log(`Success: Created section '${result.section.title}'.`);
        }
        break;
      }
      case 'delete-section': {
        const id = args[0];
        if (!id) throw new Error('Section ID is required');
        await dbDeleteSection({ id });
        console.log(`Success: Section ${id} deleted.`);
        break;
      }
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

run();
