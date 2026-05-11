#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { scaffold, scaffoldModule, scaffoldSection } from '../src/scaffold.js';
import { packageCourse } from '../src/packager.js';
import { validateCourse } from '../src/validator.js';
import { authLogin, authStatus, authLogout } from '../src/auth-commands.js';
import { CoursifyApiClient } from '../src/api-client.js';
import { publishCourse } from '../src/publisher.js';

const program = new Command();

program.name('coursify').description('Local-first authoring tool for Coursify').version('1.0.0');

program.option('-v, --verbose', 'Enable verbose logging', false);

program
  .command('init')
  .argument('<name>', 'Name of the course')
  .description('Scaffold a new course directory structure')
  .action(async (name) => {
    try {
      await scaffold(name);
      console.log(chalk.green(`\nSuccessfully initialized course: ${name}`));
      console.log(chalk.cyan('Next steps:'));
      console.log(`  1. cd ${name}`);
      console.log('  2. Run `coursify init-module "Module Title"` to add a module');
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('init-module')
  .argument('<title>', 'Title of the module')
  .option('-o, --order <number>', 'Module order', '1')
  .description('Add a new module directory to the current course')
  .action(async (title, options) => {
    try {
      const modDir = await scaffoldModule(process.cwd(), title, parseInt(options.order));
      console.log(chalk.green(`\nSuccessfully created module: ${modDir}`));
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('init-section')
  .argument('<title>', 'Title of the section')
  .option('-m, --module <dir>', 'Module directory', '.')
  .option('-o, --order <number>', 'Section order', '1')
  .option('-t, --type <type>', 'Section type (standard, lab, procedural)', 'standard')
  .description('Add a new section directory to a module')
  .action(async (title, options) => {
    try {
      const secDir = await scaffoldSection(
        options.module,
        title,
        parseInt(options.order),
        options.type
      );
      console.log(chalk.green(`\nSuccessfully created section: ${secDir}`));
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('package')
  .argument('[dir]', 'Directory of the course', '.')
  .option('-o, --output <file>', 'Output bundle file name', 'course-bundle.json')
  .option('--dry-run', 'Preview the bundle structure without writing to file', false)
  .description('Bundle a course directory into a JSON file for import')
  .action(async (dir, options) => {
    try {
      const bundle = await packageCourse(dir);
      if (options.dryRun) {
        console.log(chalk.bold.yellow('DRY RUN ENABLED - Bundle preview:'));
        console.log(JSON.stringify(bundle, null, 2));
      } else {
        const fs = (await import('fs')).default;
        fs.writeFileSync(options.output, JSON.stringify(bundle, null, 2));
        console.log(chalk.green(`\nSuccessfully packaged course into ${options.output}`));
      }
      console.log(chalk.bold(`Course: ${bundle.title}`));
      console.log(`Modules: ${bundle.modules.length}`);
      console.log(`Sections: ${bundle.modules.reduce((acc, m) => acc + m.sections.length, 0)}`);
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('validate')
  .argument('[dir]', 'Directory of the course', '.')
  .description('Validate course structure and content')
  .action(async (dir) => {
    try {
      const results = await validateCourse(dir);
      if (results.errors.length === 0) {
        console.log(chalk.green('✔ Course is valid!'));
        if (results.warnings.length > 0) {
          console.log(chalk.yellow(`\nWarnings (${results.warnings.length}):`));
          results.warnings.forEach((w) => console.log(chalk.yellow(`  ⚠ ${w}`)));
        }
      } else {
        console.log(chalk.red(`✖ Course has ${results.errors.length} errors:`));
        results.errors.forEach((e) => console.log(chalk.red(`  error: ${e}`)));
        process.exit(1);
      }
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const auth = program.command('auth').description('Manage authentication');

auth
  .command('login')
  .option('--base-url <url>', 'Server base URL')
  .option('--dev', 'Use localhost for development', false)
  .description('Authenticate via OAuth (opens browser)')
  .action(async (options) => {
    if (options.dev) {
      options.baseUrl = options.baseUrl || 'http://localhost:3000';
    } else {
      options.baseUrl = options.baseUrl || 'https://hasanraiyan.me';
    }
    await authLogin(options);
    process.exit(0);
  });

auth
  .command('status')
  .description('Show current auth status')
  .action(async () => {
    await authStatus();
  });

auth
  .command('logout')
  .description('Clear stored tokens')
  .action(async () => {
    await authLogout();
  });

program
  .command('list')
  .option('--base-url <url>', 'Server base URL')
  .option('--dev', 'Use localhost for development', false)
  .description('List courses from server')
  .action(async (options) => {
    try {
      const globalOptions = program.opts();
      if (options.dev) {
        options.baseUrl = options.baseUrl || 'http://localhost:3000';
      } else {
        options.baseUrl = options.baseUrl || 'https://hasanraiyan.me';
      }
      const client = new CoursifyApiClient(options.baseUrl, { verbose: globalOptions.verbose });
      const courses = await client.listCourses();
      console.log(chalk.bold(`\nCourses on ${options.baseUrl}:`));
      courses.forEach((c) => {
        console.log(`- ${chalk.green(c.title)} (${c.status}) [${c.authoringStatus}] ID: ${c._id}`);
      });
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('publish')
  .argument('[dir]', 'Directory of the course', '.')
  .option('--base-url <url>', 'Server base URL')
  .option('--dev', 'Use localhost for development', false)
  .option('--publish', 'Set course status to published after sync', false)
  .option('--dry-run', 'Preview the sync process without making server changes', false)
  .description('Package and push course to server')
  .action(async (dir, options) => {
    try {
      const globalOptions = program.opts();
      if (options.dev) {
        options.baseUrl = options.baseUrl || 'http://localhost:3000';
      } else {
        options.baseUrl = options.baseUrl || 'https://hasanraiyan.me';
      }
      await publishCourse(dir, { ...options, verbose: globalOptions.verbose });
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program.parse();
