import chalk from 'chalk';
import { packageCourse } from './packager.js';
import { CoursifyApiClient } from './api-client.js';
import { authLogin } from './auth-commands.js';
import { loadCredentials, isTokenExpired } from './token-store.js';

export async function publishCourse(
  dir,
  { baseUrl, publish = false, dryRun = false, verbose = false } = {}
) {
  // 1. Auto-login check
  const credentials = loadCredentials();
  if (!credentials || isTokenExpired(credentials)) {
    console.log(chalk.yellow('No valid credentials found. Starting login flow...'));
    await authLogin({ baseUrl });
  }

  const client = new CoursifyApiClient(baseUrl, { verbose });

  if (dryRun) {
    console.log(chalk.bold.yellow('DRY RUN ENABLED - No changes will be made to the server.\n'));
  }

  console.log(chalk.blue('Packaging course...'));
  const bundle = await packageCourse(dir);

  // 2. Schema compliance: Map section status 'published' -> 'complete'
  // Server schema for sections only allows: ['planned', 'draft', 'needs_review', 'complete']
  if (bundle.modules) {
    bundle.modules.forEach((mod) => {
      if (mod.sections) {
        mod.sections.forEach((sec) => {
          if (sec.status === 'published') {
            sec.status = 'complete';
          }
        });
      }
    });
  }

  let courseId = bundle.id;

  // Slug-based resolution if ID is missing
  if (!courseId && bundle.slug) {
    try {
      if (verbose) console.log(chalk.gray(`Searching for course by slug: ${bundle.slug}`));
      const existingCourse = await client.getCourseBySlug(bundle.slug);
      if (existingCourse) {
        courseId = existingCourse.id;
        bundle.id = courseId; // Set it in bundle for the import API
        console.log(chalk.blue(`Found existing course via slug: ${bundle.slug} (ID: ${courseId})`));
      }
    } catch (err) {
      if (verbose)
        console.log(chalk.gray(`Course with slug ${bundle.slug} not found. Will create new.`));
    }
  }

  if (dryRun) {
    if (courseId) {
      console.log(chalk.yellow(`[DRY RUN] Would update existing course (ID: ${courseId})`));
    } else {
      console.log(chalk.yellow(`[DRY RUN] Would create new course: "${bundle.title}"`));
    }
    console.log(
      chalk.yellow(
        `[DRY RUN] Would import ${bundle.modules.length} modules and ${bundle.modules.reduce((acc, m) => acc + m.sections.length, 0)} sections.`
      )
    );
  } else {
    console.log(
      chalk.blue(
        courseId ? `Updating course (ID: ${courseId})...` : 'Creating new course via import...'
      )
    );
    const result = await client.importCourse(bundle);
    courseId = result.courseId;
    console.log(chalk.green(`Successfully imported course (ID: ${courseId})`));
  }

  if (publish && courseId) {
    if (dryRun) {
      console.log(chalk.yellow('[DRY RUN] Would publish course'));
    } else {
      console.log(chalk.blue('Publishing course...'));
      const result = await client.publishCourse(courseId);
      console.log(chalk.green(`Course published! Status: ${result.course.status}`));
    }
  }

  if (dryRun) {
    console.log(chalk.bold.yellow('\nDry run complete! Review the log above.'));
  } else {
    console.log(chalk.bold.green('\nAll done! Course synced successfully.'));
  }
}
