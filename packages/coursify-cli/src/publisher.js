import chalk from 'chalk';
import { packageCourse } from './packager.js';
import { CoursifyApiClient } from './api-client.js';

export async function publishCourse(dir, { baseUrl, publish = false } = {}) {
  const client = new CoursifyApiClient(baseUrl);

  console.log(chalk.blue('Packaging course...'));
  const bundle = await packageCourse(dir);

  let course;
  if (bundle.id) {
    console.log(chalk.blue(`Updating existing course (ID: ${bundle.id})...`));
    course = await client.updateCourse(bundle.id, {
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

  const courseId = course._id;
  console.log(chalk.green(`Course: ${course.title} (ID: ${courseId})`));

  for (const moduleBundle of bundle.modules) {
    console.log(chalk.blue(`  Creating module: ${moduleBundle.title}...`));
    const mod = await client.createModule(courseId, {
      title: moduleBundle.title,
      summary: moduleBundle.summary,
      learningGoals: moduleBundle.learningGoals,
      order: moduleBundle.order,
    });

    for (const sectionBundle of moduleBundle.sections) {
      console.log(chalk.blue(`    Creating section: ${sectionBundle.title}...`));
      await client.createSection(courseId, {
        title: sectionBundle.title,
        summary: sectionBundle.summary,
        learningGoals: sectionBundle.learningGoals,
        estimatedDuration: sectionBundle.estimatedDuration,
        order: sectionBundle.order,
        moduleId: mod._id,
        content: sectionBundle.content, // Raw markdown
      });
    }
  }

  if (publish) {
    console.log(chalk.blue('Publishing course...'));
    const result = await client.publishCourse(courseId);
    console.log(chalk.green(`Course published! Status: ${result.course.status}`));
  }

  console.log(chalk.bold.green('\nAll done! Course synced successfully.'));
}
