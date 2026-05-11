import chalk from 'chalk';
import fs from 'fs';
import { parseMarkdownToBlocks, lintContent } from '../utils.js';

export function setupUtilsCommands(program) {
  program
    .command('preview <file>')
    .description('Dry-run: Parse and lint a Markdown file')
    .action((file) => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const blocks = parseMarkdownToBlocks(content);
        const issues = lintContent(file, content);

        console.log(JSON.stringify(blocks, null, 2));

        if (issues.length > 0) {
          console.log(chalk.yellow('\nLint Issues:'));
          issues.forEach(i => console.log(chalk.yellow(`- ${i}`)));
        } else {
          console.log(chalk.green('\nNo lint issues found.'));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
    });

  program
    .command('init-section')
    .description('Generate a scaffolded Markdown file')
    .option('-o, --output <path>', 'Output file path', 'new-section.md')
    .action((options) => {
      const template = `---
title: New Section
status: draft
---

## [MdBlock]
Introduction content here...

## [QuizBlock]
- question: "What is 2+2?"
  options: ["3", "4", "5"]
  correctAnswer: "4"
  explanation: "Basic math."
`;
      fs.writeFileSync(options.output, template);
      console.log(chalk.green(`Template created: ${options.output}`));
    });
}
