#!/usr/bin/env node

import { program } from 'commander';
import { setupAuthCommands } from './commands/auth.js';
import { setupCoursesCommands } from './commands/courses.js';
import { setupModulesCommands } from './commands/modules.js';
import { setupSectionsCommands } from './commands/sections.js';
import { setupUtilsCommands } from './commands/utils.js';

program
  .name('coursify')
  .description('Standalone CLI for managing Coursify courses')
  .version('1.0.0');

setupAuthCommands(program);
setupCoursesCommands(program);
setupModulesCommands(program);
setupSectionsCommands(program);
setupUtilsCommands(program);

program.parse();
