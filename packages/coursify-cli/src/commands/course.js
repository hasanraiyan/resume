import { Command } from 'commander';
import chalk from 'chalk';
import { scaffold } from '../scaffold.js';
import { packageCourse } from '../packager.js';
import { validateCourse } from '../validator.js';
import { publishCourse } from '../publisher.js';
import { CoursifyApiClient } from '../api-client.js';

export const courseCommands = new Command('course').description('Manage courses');

courseCommands
  .command('init')
  .argument('<name>', 'Name of the course')
  .description('Scaffold a new course directory structure')
  .action(async (name) => {
    await scaffold(name);
    console.log(chalk.green(`\nSuccessfully initialized course: ${name}`));
    console.log(chalk.cyan('Next steps:'));
    console.log(`  1. cd ${name}`);
    console.log('  2. Run `coursify module add "Module Title"` to add a module');
  });

courseCommands
  .command('package')
  .argument('[dir]', 'Directory of the course', '.')
  .option('-o, --output <file>', 'Output bundle file name', 'course-bundle.json')
  .option('--dry-run', 'Preview the bundle structure without writing to file', false)
  .description('Bundle a course directory into a JSON file for import')
  .action(async (dir, options) => {
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
  });

courseCommands
  .command('validate')
  .argument('[dir]', 'Directory of the course', '.')
  .description('Validate course structure and content')
  .action(async (dir) => {
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
      throw new Error('Course validation failed');
    }
  });

courseCommands
  .command('list')
  .option('--base-url <url>', 'Server base URL')
  .option('--dev', 'Use localhost for development', false)
  .description('List courses from server')
  .action(async (options, command) => {
    const globalOptions = command.parent.parent.opts();
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
  });

courseCommands
  .command('publish')
  .argument('[dir]', 'Directory of the course', '.')
  .option('--base-url <url>', 'Server base URL')
  .option('--dev', 'Use localhost for development', false)
  .option('--publish', 'Set course status to published after sync', false)
  .option('--dry-run', 'Preview the sync process without making server changes', false)
  .description('Package and push course to server')
  .action(async (dir, options, command) => {
    const globalOptions = command.parent.parent.opts();
    if (options.dev) {
      options.baseUrl = options.baseUrl || 'http://localhost:3000';
    } else {
      options.baseUrl = options.baseUrl || 'https://hasanraiyan.me';
    }
    await publishCourse(dir, { ...options, verbose: globalOptions.verbose });
  });
