import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

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
  - Objective 2
prerequisites:
  - Requirement 1
outcome: "Mastery of ${courseName}."
outline: |
  # Syllabus
  1. Introduction to ${courseName}
  2. Core Concepts
  3. Advanced Implementation
  4. Final Project
`
  );

  // 1b. Create root agent.yaml (Internal Agent Context)
  await fs.writeFile(
    path.join(root, 'agent.yaml'),
    `authoringStatus: "idea"
planningNotes: "Initial brainstorm phase."
agentNotes: "Scaffolded using coursify init."
researchNotes:
  - title: "Key Research Paper"
    sourceUrl: "https://arxiv.org/example"
    sourceType: "paper"
    summary: "Essential findings for this course."
    notes: "Focus on section 3 for the architecture diagrams."
`
  );

  // 2. Create sample module
  const modDir = path.join(root, 'm1-introduction');
  await fs.ensureDir(modDir);
  await fs.writeFile(
    path.join(modDir, 'info.yaml'),
    `title: "Getting Started"
summary: "Introduction to ${courseName} fundamentals."
learningGoals:
  - "Goal 1"
  - "Goal 2"
order: 1
`
  );

  // 3. Create sample section
  const secDir = path.join(modDir, 's1-welcome');
  await fs.ensureDir(secDir);
  await fs.writeFile(
    path.join(secDir, 'data.md'),
    `---
title: "Introduction to ${courseName}"
description: "Setting the stage for your learning journey in ${courseName}."
learningGoals:
  - "Identify the core concepts of ${courseName}"
  - "Understand the primary architecture and data flow"
estimatedDuration: "15 mins"
status: "draft"
order: 1
---

## [MdBlock]
### Welcome to the Course

Welcome to the **${courseName}** course! In this section, we will cover the foundational concepts and set the mental stage for your journey.

${courseName} represents a paradigm shift in how we approach this domain. To master it, you must understand its core architectural pillars.

## [StepByStepBlock]
title: "The Core Process Flow"
- step: "Initialization"
  content: "Setting up the environment and loading initial data structures."
- step: "Processing"
  content: "Transforming inputs into high-value outputs through our specialized pipeline."
- step: "Validation"
  content: "Ensuring the integrity and quality of the final result."

## [QuizBlock]
- question: "What is the primary goal of this introductory module?"
  options: ["Mastery of basics", "Skipping to advanced topics", "Ignoring the foundation"]
  correctAnswer: "Mastery of basics"
  explanation: "A strong foundation is critical for mastering complex systems."

## [ResourceBlock]
url: "https://github.com/hasanraiyan/resume"
title: "Official ${courseName} Documentation"
type: "doc"
`
  );

  // 4. Create .gitignore
  await fs.writeFile(
    path.join(root, '.gitignore'),
    `course-bundle.json
node_modules
.DS_Store
`
  );
}
