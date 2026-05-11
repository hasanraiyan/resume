import { Command } from 'commander';
import chalk from 'chalk';
import { scaffoldSection } from '../scaffold.js';

export const sectionCommands = new Command('section').description('Manage sections');

sectionCommands
  .command('add')
  .argument('<title>', 'Title of the section')
  .option('-m, --module <dir>', 'Module directory', '.')
  .option('-o, --order <number>', 'Section order', '1')
  .option('-t, --type <type>', 'Section type (standard, lab, procedural)', 'standard')
  .description('Add a new section directory to a module')
  .action(async (title, options) => {
    const secDir = await scaffoldSection(
      options.module,
      title,
      parseInt(options.order),
      options.type
    );
    console.log(chalk.green(`\nSuccessfully created section: ${secDir}`));
  });
