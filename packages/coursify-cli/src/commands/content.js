import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { apiClient } from '../http-client.js';
import { parseMarkdownToBlocks, lintContent } from '../utils.js';

export function setupContentCommands(program) {
  // --- Courses ---
  const courses = program.command('courses').description('Course management');

  courses
    .command('list')
    .option('-q, --query <string>', 'Search query')
    .option('-s, --status <status>', 'Filter by status (draft, published, all)', 'all')
    .action(async (options) => {
      try {
        const query = options.query ? `&query=${encodeURIComponent(options.query)}` : '';
        const data = await apiClient(`/api/coursify/courses?status=${options.status}${query}`);
        console.table(data.courses.map(c => ({
          ID: c.id,
          Title: c.title,
          Status: c.status,
          Sections: c.sectionCount
        })));
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });

  courses
    .command('create')
    .requiredOption('-t, --title <title>', 'Course title')
    .option('-d, --description <desc>', 'Course description')
    .action(async (options) => {
      try {
        const data = await apiClient('/api/coursify/courses', {
          method: 'POST',
          body: JSON.stringify(options),
        });
        console.log(chalk.green(`Course created: ${data.course.id}`));
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });

  // --- Modules ---
  const modules = program.command('modules').description('Module management');

  modules
    .command('create')
    .requiredOption('-c, --course-id <id>', 'Course ID')
    .requiredOption('-t, --title <title>', 'Module title')
    .action(async (options) => {
      try {
        const data = await apiClient(`/api/coursify/courses/${options.courseId}/modules`, {
          method: 'POST',
          body: JSON.stringify({ title: options.title }),
        });
        console.log(chalk.green(`Module created: ${data.module._id}`));
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });

  // --- Sections ---
  const sections = program.command('sections').description('Section management');

  sections
    .command('sync')
    .requiredOption('-c, --course-id <id>', 'Course ID')
    .option('-m, --module-id <id>', 'Module ID')
    .requiredOption('-d, --dir <path>', 'Directory containing .md files')
    .action(async (options) => {
      try {
        const dirPath = path.resolve(process.cwd(), options.dir);
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md')).sort();

        for (const file of files) {
          const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
          const title = file.replace(/^\d+-/, '').replace('.md', '').replace(/-/g, ' ');

          const issues = lintContent(file, content);
          if (issues.length > 0) {
            console.warn(chalk.yellow(`Warning: Issues in ${file}:`));
            issues.forEach(i => console.warn(`- ${i}`));
          }

          const blocks = parseMarkdownToBlocks(content);

          await apiClient(`/api/coursify/courses/${options.courseId}/sections`, {
            method: 'POST',
            body: JSON.stringify({
              title,
              blocks,
              moduleId: options.moduleId,
            }),
          });
          console.log(chalk.green(`Synced: ${file}`));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });
}
