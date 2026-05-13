import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export async function scaffoldModule(courseDir, moduleName, order) {
  const modDir = path.join(courseDir, moduleName.toLowerCase().replace(/\s+/g, '-'));
  await fs.ensureDir(modDir);
  await fs.writeFile(
    path.join(modDir, 'info.yaml'),
    `title: "${moduleName}"
summary: "Summary for ${moduleName}."
learningGoals:
  - "Goal 1"
order: ${order}
`
  );
  return modDir;
}

export async function scaffoldSection(moduleDir, sectionName, order) {
  const secDir = path.join(moduleDir, sectionName.toLowerCase().replace(/\s+/g, '-'));
  await fs.ensureDir(secDir);

  const content = `---
title: "${sectionName}"
description: "Description for ${sectionName}."
learningGoals:
  - "Goal 1"
estimatedDuration: "15 mins"
status: "draft"
order: ${order}
---

## [MdBlock]
### Overview
Add your markdown content here. This is a standard markdown block for explanations, concepts, and narrative content.

## [StepByStepBlock]
title: "Implementation Steps"
- step: "Step 1"
  content: "First step description."
- step: "Step 2"
  content: "Second step description."
- step: "Step 3"
  content: "Third step description."

## [AccordionBlock]
title: "Common Questions"
- item: "Question 1"
  content: "Answer 1"
- item: "Question 2"
  content: "Answer 2"

## [TimelineBlock]
title: "Project Roadmap"
- event: "2023-Q1"
  title: "Conceptualization"
  content: "Brainstorming and feasibility studies."
- event: "2023-Q2"
  title: "Development"
  content: "Building the core engine."

## [QuizBlock]
- question: "What is the key concept?"
  options: ["Option A", "Option B", "Option C"]
  correctAnswer: "Option A"
  explanation: "Option A is correct because..."

## [MdBlock]
### Additional Resources
Link to external resources, documentation, or references here.
`;

  await fs.writeFile(path.join(secDir, 'data.md'), content);
  return secDir;
}

export async function scaffold(courseName) {
  const root = path.resolve(courseName);

  if (await fs.pathExists(root)) {
    throw new Error(`Directory already exists: ${courseName}`);
  }

  console.log(chalk.blue(`Scaffolding course in ${root}...`));

  // 1. Create root info.yaml (Public Metadata)
  await fs.ensureDir(root);
  await fs.writeFile(
    path.join(root, 'info.yaml'),
    `title: "${courseName}"
description: "A professional course about ${courseName}."
difficulty: "beginner"
estimatedDuration: "4 weeks"
tags: ["${courseName.toLowerCase().replace(/\s+/g, '-')}"]
targetAudience: "Developers looking to learn ${courseName}."
learningObjectives:
  - Objective 1
outcome: "Mastery of ${courseName}."
outline: |
  # Syllabus
  1. Introduction
`
  );

  // 1b. Create root agent.yaml (Internal Agent Context)
  await fs.writeFile(
    path.join(root, 'agent.yaml'),
    `authoringStatus: "idea"
planningNotes: "Initial brainstorm phase."
agentNotes: "Scaffolded using coursify init."
`
  );

  // 2. Create .gitignore
  await fs.writeFile(
    path.join(root, '.gitignore'),
    `course-bundle.json
node_modules
.DS_Store
`
  );
}
