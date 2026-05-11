#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { scaffold } from '../src/scaffold.js';
import { packageCourse } from '../src/packager.js';
import { validateCourse } from '../src/validator.js';
import { authLogin, authStatus, authLogout } from '../src/auth-commands.js';
import { CoursifyApiClient } from '../src/api-client.js';
import { publishCourse } from '../src/publisher.js';

const program = new Command();

program.name('coursify').description('Local-first authoring tool for Coursify').version('1.0.0');

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
      console.log('  2. Edit info.yaml and content in modules/');
      console.log('  3. Run `coursify package .` to generate a bundle');
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('package')
  .argument('[dir]', 'Directory of the course', '.')
  .option('-o, --output <file>', 'Output bundle file name', 'course-bundle.json')
  .description('Bundle a course directory into a JSON file for import')
  .action(async (dir, options) => {
    try {
      const bundle = await packageCourse(dir);
      const fs = (await import('fs')).default;
      fs.writeFileSync(options.output, JSON.stringify(bundle, null, 2));
      console.log(chalk.green(`\nSuccessfully packaged course into ${options.output}`));
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
  .option('--base-url <url>', 'Server base URL', 'http://localhost:3000')
  .description('Authenticate via OAuth (opens browser)')
  .action(async (options) => {
    await authLogin(options);
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
  .option('--base-url <url>', 'Server base URL', 'http://localhost:3000')
  .description('List courses from server')
  .action(async (options) => {
    try {
      const client = new CoursifyApiClient(options.baseUrl);
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
  .option('--base-url <url>', 'Server base URL', 'http://localhost:3000')
  .option('--publish', 'Set course status to published after sync', false)
  .description('Package and push course to server')
  .action(async (dir, options) => {
    try {
      await publishCourse(dir, options);
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program.parse();
