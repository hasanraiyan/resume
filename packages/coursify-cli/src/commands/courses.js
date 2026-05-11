import chalk from 'chalk';
import { apiClient } from '../http-client.js';

export function setupCoursesCommands(program) {
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
}
