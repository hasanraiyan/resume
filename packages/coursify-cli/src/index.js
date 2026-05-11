#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { setupAuthCommands } from './commands/auth.js';
import { setupContentCommands } from './commands/content.js';
import { setupUtilsCommands } from './commands/utils.js';
import { setupConfigCommands } from './commands/config.js';

// --- Brand Header ---
const header = boxen(
  chalk.bold.green('Coursify CLI') + '\n' + chalk.dim('Professional Instructional Design Tool'),
  { padding: 1, margin: { bottom: 1 }, borderStyle: 'round', borderColor: 'green' }
);

program
  .name('coursify')
  .description('Standalone CLI for managing Coursify courses')
  .version('1.0.0')
  .addHelpText('before', header)
  .configureHelp({
    sortSubcommands: true,
    subcommandTerm: (cmd) => chalk.cyan(cmd.name()),
    commandDescription: (cmd) => chalk.dim(cmd.description()),
  });

setupAuthCommands(program);
setupContentCommands(program);
setupUtilsCommands(program);
setupConfigCommands(program);

// --- Custom Help Sections ---
program.on('--help', () => {
  console.log('\n' + chalk.bold('Examples:'));
  console.log(`  $ ${chalk.cyan('coursify login')}                   Authenticate your session`);
  console.log(`  $ ${chalk.cyan('coursify courses list')}           List all available courses`);
  console.log(`  $ ${chalk.cyan('coursify preview lesson.md')}      Lint and preview content`);
  console.log(`  $ ${chalk.cyan('coursify sections sync -d .')}     Sync a whole directory\n`);

  console.log(chalk.bold('Documentation:'));
  console.log(`  ${chalk.blue.underline('https://hasanraiyan.me/docs/coursify')}\n`);
});

program.parse();
