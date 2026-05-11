import chalk from 'chalk';
import { apiClient } from '../http-client.js';

export function setupModulesCommands(program) {
  const modules = program
    .command('modules')
    .description('Manage course modules and structural hierarchy');

  modules
    .command('create')
    .description('Create a new module within a specific course')
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
}
