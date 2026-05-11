import { Command } from 'commander';
import chalk from 'chalk';
import { scaffoldModule } from '../scaffold.js';

export const moduleCommands = new Command('module').description('Manage modules');

moduleCommands
  .command('add')
  .argument('<title>', 'Title of the module')
  .option('-o, --order <number>', 'Module order', '1')
  .description('Add a new module directory to the current course')
  .action(async (title, options) => {
    const modDir = await scaffoldModule(process.cwd(), title, parseInt(options.order));
    console.log(chalk.green(`\nSuccessfully created module: ${modDir}`));
  });
