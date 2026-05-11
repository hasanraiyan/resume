import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { apiClient } from '../http-client.js';
import { parseFile } from '../utils.js';

export function setupCoursesCommands(program) {
  const courses = program
    .command('courses')
    .description('Manage course metadata, planning, and research');

  courses
    .command('list')
    .description('List available courses with optional filtering')
    .option('-q, --query <string>', 'Search query')
    .option('-s, --status <status>', 'Filter by status (draft, published, all)', 'all')
    .action(async (options) => {
      try {
        const query = options.query ? `&query=${encodeURIComponent(options.query)}` : '';
        const data = await apiClient(`/api/coursify/courses?status=${options.status}${query}`);
        console.table(
          data.courses.map((c) => ({
            ID: c.id,
            Title: c.title,
            Status: c.status,
            Sections: c.sectionCount,
          }))
        );
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });

  courses
    .command('create')
    .description('Create a new course (via flags, JSON, or YAML file)')
    .option('-t, --title <title>', 'Course title')
    .option('-d, --description <desc>', 'Course description')
    .option('--difficulty <level>', 'beginner, intermediate, advanced', 'beginner')
    .option('--duration <string>', 'Estimated duration')
    .option('--tags <items>', 'Comma-separated tags')
    .option('--file <path>', 'Create from JSON or YAML file')
    .action(async (options) => {
      try {
        let payload = {};
        if (options.file) {
          payload = parseFile(options.file);
        } else {
          payload = {
            ...options,
            tags: options.tags ? options.tags.split(',').map((t) => t.trim()) : [],
            estimatedDuration: options.duration,
          };
        }

        const data = await apiClient('/api/coursify/courses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        console.log(chalk.green(`Course created: ${data.course.id}`));
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });

  courses
    .command('init-template')
    .description('Generate a scaffolded JSON or YAML file for a new course')
    .option('-o, --output <path>', 'Save to file (supports .json, .yaml, .yml)', 'course-plan.yaml')
    .action((options) => {
      const template = {
        title: 'Course Title',
        description: 'Short description of the course.',
        difficulty: 'beginner',
        estimatedDuration: '10hrs',
        tags: ['tag1', 'tag2'],
        targetAudience: 'Who is this course for?',
        learningObjectives: ['Objective 1', 'Objective 2'],
        prerequisites: ['Knowledge 1'],
        outcome: 'What will students achieve?',
        outline: '## Module 1\n- Section 1\n- Section 2',
        planningNotes: 'Internal pedagogy notes...',
        agentNotes: 'AI state management: [Current Module: X, Next: Y]',
        authoringStatus: 'idea',
        researchNotes: [
          {
            title: 'Research Source 1',
            summary: 'Summary of findings',
            sourceUrl: 'https://...',
            sourceType: 'web',
            notes: 'Detailed insights...',
          },
        ],
      };

      let output;
      if (options.output.endsWith('.json')) {
        output = JSON.stringify(template, null, 2);
      } else {
        output = yaml.dump(template);
      }

      if (options.output) {
        fs.writeFileSync(options.output, output);
        console.log(chalk.green(`Template written to ${options.output}`));
      } else {
        console.log(output);
      }
    });

  courses
    .command('notes <id>')
    .description('Update planning or agent notes')
    .requiredOption('--type <planning|agent>', 'Type of notes to update')
    .option('--content <text>', 'Note content')
    .option('--file <path>', 'Read content from file')
    .action(async (id, options) => {
      try {
        let content = options.content;
        if (options.file) {
          content = fs.readFileSync(path.resolve(process.cwd(), options.file), 'utf8');
        }

        if (!content) throw new Error('No content provided');

        const key = options.type === 'planning' ? 'planningNotes' : 'agentNotes';
        await apiClient(`/api/coursify/courses/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ [key]: content }),
        });
        console.log(chalk.green(`Successfully updated ${options.type} notes for ${id}`));
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });

  const research = courses.command('research').description('Manage course research findings');

  research
    .command('add <id>')
    .description('Add a structured research finding')
    .requiredOption('-t, --title <title>', 'Source title')
    .option('-s, --summary <text>', 'Summary of finding')
    .option('-u, --url <url>', 'Source URL')
    .option('--type <web|paper|book|video|other>', 'Source type', 'web')
    .option('-n, --notes <text>', 'Detailed insights')
    .action(async (id, options) => {
      try {
        const payload = {
          researchNotes: [
            {
              title: options.title,
              summary: options.summary || '',
              sourceUrl: options.url || '',
              sourceType: options.type,
              notes: options.notes || '',
              accessedAt: new Date(),
            },
          ],
        };

        await apiClient(`/api/coursify/courses/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        console.log(chalk.green(`Added research finding: ${options.title}`));
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });

  courses
    .command('get <id>')
    .description('Fetch full course metadata and structure')
    .action(async (id) => {
      try {
        const data = await apiClient(`/api/coursify/courses/${id}`);
        console.log(JSON.stringify(data, null, 2));
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });

  courses
    .command('update <id>')
    .description('Update course metadata and planning details')
    .option('-t, --title <title>', 'Course title')
    .option('-d, --description <desc>', 'Course description')
    .option('-s, --status <status>', 'draft or published')
    .option('--difficulty <level>', 'beginner, intermediate, advanced')
    .option('--duration <string>', 'Estimated duration')
    .option('--tags <items>', 'Comma-separated tags')
    .option('--audience <string>', 'Target audience')
    .option('--objectives <items>', 'Comma-separated learning objectives')
    .option('--prerequisites <items>', 'Comma-separated prerequisites')
    .option('--outcome <string>', 'Learning outcome')
    .option('--outline <string>', 'Course outline (Markdown)')
    .option(
      '--authoring-status <status>',
      'idea, researching, planning, drafting, reviewing, complete'
    )
    .option('--file <path>', 'Update via JSON file for bulk changes')
    .action(async (id, options) => {
      try {
        let payload = {};

        if (options.file) {
          const filePath = path.resolve(process.cwd(), options.file);
          payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else {
          payload = {
            ...options,
            tags: options.tags ? options.tags.split(',').map((t) => t.trim()) : undefined,
            learningObjectives: options.objectives
              ? options.objectives.split(',').map((o) => o.trim())
              : undefined,
            prerequisites: options.prerequisites
              ? options.prerequisites.split(',').map((p) => p.trim())
              : undefined,
            targetAudience: options.audience,
            estimatedDuration: options.duration,
          };
        }

        const data = await apiClient(`/api/coursify/courses/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        console.log(chalk.green(`Course ${id} updated successfully.`));
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });

  courses
    .command('delete <id>')
    .description('Soft-delete a course and its associated content')
    .action(async (id) => {
      try {
        await apiClient(`/api/coursify/courses/${id}`, { method: 'DELETE' });
        console.log(chalk.green(`Course ${id} deleted successfully.`));
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });
}
