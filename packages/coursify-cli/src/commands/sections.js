import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { apiClient } from '../http-client.js';
import { parseMarkdownToBlocks, lintContent } from '../utils.js';

export function setupSectionsCommands(program) {
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
