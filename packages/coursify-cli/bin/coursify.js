#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import {
  courseCommands,
  moduleCommands,
  sectionCommands,
  authCommands,
} from '../src/commands/index.js';

const program = new Command();

program.name('coursify').description('Local-first authoring tool for Coursify').version('1.0.1');

program.option('-v, --verbose', 'Enable verbose logging', false);

// Global middleware
program.hook('preAction', (thisCommand, actionCommand) => {
  if (thisCommand.opts().verbose) {
    console.log(chalk.gray(`[Verbose] Executing command: ${actionCommand.name()}`));
  }
});

// Add modular command groups
program.addCommand(courseCommands);
program.addCommand(moduleCommands);
program.addCommand(sectionCommands);
program.addCommand(authCommands);

// Centralized error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (err) {
  if (err.code === 'commander.helpDisplayed' || err.code === 'commander.help') {
    process.exit(0);
  }
  if (
    err.code === 'commander.unknownCommand' ||
    err.code === 'commander.missingArgument' ||
    err.code === 'commander.missingMandatoryOptionValue'
  ) {
    process.exit(1);
  }
  console.error(chalk.red(`\nError: ${err.message}`));
  if (program.opts().verbose && err.stack) {
    console.error(chalk.gray(err.stack));
  }
  process.exit(1);
}
