#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { setupAuthCommands } from './commands/auth.js';
import { setupContentCommands } from './commands/content.js';
import { setupUtilsCommands } from './commands/utils.js';

program
  .name('coursify')
  .description('Standalone CLI for managing Coursify courses')
  .version('1.0.0');

setupAuthCommands(program);
setupContentCommands(program);
setupUtilsCommands(program);

program.parse();
