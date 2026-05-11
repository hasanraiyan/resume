import chalk from 'chalk';
import { packageCourse } from './packager.js';
import { CoursifyApiClient } from './api-client.js';

export async function publishCourse(
  dir,
  { baseUrl, publish = false, dryRun = false, verbose = false } = {}
) {
  const client = new CoursifyApiClient(baseUrl, { verbose });

  if (dryRun) {
    console.log(chalk.bold.yellow('DRY RUN ENABLED - No changes will be made to the server.\n'));
  }

  console.log(chalk.blue('Packaging course...'));
  const bundle = await packageCourse(dir);

  let courseId = bundle.id;

  // Slug-based resolution if ID is missing
  if (!courseId && bundle.slug) {
    try {
      if (verbose) console.log(chalk.gray(`Searching for course by slug: ${bundle.slug}`));
      const existingCourse = await client.getCourseBySlug(bundle.slug);
      if (existingCourse) {
        courseId = existingCourse._id;
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
      courseId = 'MOCK-COURSE-ID';
    }
  } else {
    let course;
    if (courseId) {
      console.log(chalk.blue(`Updating existing course (ID: ${courseId})...`));
      course = await client.updateCourse(courseId, {
        title: bundle.title,
        description: bundle.description,
        difficulty: bundle.difficulty,
        estimatedDuration: bundle.estimatedDuration,
        tags: bundle.tags,
        targetAudience: bundle.targetAudience,
        learningObjectives: bundle.learningObjectives,
        prerequisites: bundle.prerequisites,
        outcome: bundle.outcome,
        outline: bundle.outline,
        authoringStatus: bundle.authoringStatus,
      });
    } else {
      console.log(chalk.blue('Creating new course...'));
      course = await client.createCourse({
        title: bundle.title,
        description: bundle.description,
        difficulty: bundle.difficulty,
        estimatedDuration: bundle.estimatedDuration,
        tags: bundle.tags,
      });

      // Update planning fields if present
      if (
        bundle.targetAudience ||
        bundle.learningObjectives ||
        bundle.outline ||
        bundle.authoringStatus
      ) {
        course = await client.updateCourse(course._id, {
          targetAudience: bundle.targetAudience,
          learningObjectives: bundle.learningObjectives,
          prerequisites: bundle.prerequisites,
          outcome: bundle.outcome,
          outline: bundle.outline,
          authoringStatus: bundle.authoringStatus,
        });
      }
    }
    courseId = course._id;
    console.log(chalk.green(`Course: ${course.title} (ID: ${courseId})`));
  }

  for (const moduleBundle of bundle.modules) {
    let moduleId = moduleBundle.id;
    if (dryRun) {
      console.log(
        chalk.yellow(
          `  [DRY RUN] Would create/update module: "${moduleBundle.title}" (Order: ${moduleBundle.order})`
        )
      );
      moduleId = `MOCK-MOD-ID-${moduleBundle.order}`;
    } else {
      console.log(chalk.blue(`  Creating module: ${moduleBundle.title}...`));
      const mod = await client.createModule(courseId, {
        title: moduleBundle.title,
        summary: moduleBundle.summary,
        learningGoals: moduleBundle.learningGoals,
        order: moduleBundle.order,
      });
      moduleId = mod._id;
    }

    for (const sectionBundle of moduleBundle.sections) {
      if (dryRun) {
        console.log(
          chalk.yellow(
            `    [DRY RUN] Would create/update section: "${sectionBundle.title}" (Order: ${sectionBundle.order})`
          )
        );
      } else {
        console.log(chalk.blue(`    Creating section: ${sectionBundle.title}...`));
        await client.createSection(courseId, {
          title: sectionBundle.title,
          summary: sectionBundle.summary,
          learningGoals: sectionBundle.learningGoals,
          estimatedDuration: sectionBundle.estimatedDuration,
          order: sectionBundle.order,
          moduleId: moduleId,
          content: sectionBundle.content, // Raw markdown
        });
      }
    }
  }

  if (publish) {
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
