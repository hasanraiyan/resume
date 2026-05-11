import chalk from 'chalk';
import fs from 'fs';
import { parseMarkdownToBlocks, lintContent } from '../utils.js';

export function setupUtilsCommands(program) {
  program
    .command('preview <file>')
    .description('Validate and preview Markdown content blocks (dry-run)')
    .action((file) => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const blocks = parseMarkdownToBlocks(content);
        const issues = lintContent(file, content);

        console.log(JSON.stringify(blocks, null, 2));

        if (issues.length > 0) {
          console.log(chalk.yellow('\nLint Issues:'));
          issues.forEach((i) => console.log(chalk.yellow(`- ${i}`)));
        } else {
          console.log(chalk.green('\nNo lint issues found.'));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });

  program
    .command('init-section')
    .description('Generate a scaffolded Markdown lesson file')
    .option('-t, --title <string>', 'Section title', 'New Section')
    .option('-o, --output <path>', 'Output file path', 'new-section.md')
    .action((options) => {
      const template = `---
title: ${options.title}
status: draft
---

## [MdBlock]
### Overview

Introduction to ${options.title}...

## [QuizBlock]
- question: "Quick check: What is..."
  options: ["Option A", "Option B", "Option C"]
  correctAnswer: "Option B"
  explanation: "Contextual explanation..."
`;
      fs.writeFileSync(options.output, template);
      console.log(chalk.green(`Template created: ${options.output}`));
    });
}
