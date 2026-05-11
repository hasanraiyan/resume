import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import matter from 'gray-matter';

export async function validateCourse(dir) {
  const absDir = path.resolve(dir);
  const results = { errors: [], warnings: [] };

  try {
    if (!(await fs.pathExists(absDir))) {
      results.errors.push(`Directory not found: ${absDir}`);
      return results;
    }

    // 1. Validate Course Metadata (Public)
    const courseInfoPath = path.join(absDir, 'info.yaml');
    const agentInfoPath = path.join(absDir, 'agent.yaml');

    if (!(await fs.pathExists(courseInfoPath))) {
      results.errors.push(`Course info.yaml missing in ${absDir}`);
    } else {
      try {
        const content = await fs.readFile(courseInfoPath, 'utf8');
        const meta = yaml.load(content);
        if (!meta.title) results.errors.push('Course title is missing in info.yaml');
        if (!meta.description) results.warnings.push('Course description is recommended');
      } catch (e) {
        results.errors.push(`Invalid YAML in course info.yaml: ${e.message}`);
      }
    }

    // 1b. Validate Agent Context (Internal)
    if (await fs.pathExists(agentInfoPath)) {
      try {
        const content = await fs.readFile(agentInfoPath, 'utf8');
        const meta = yaml.load(content);
        if (meta.researchNotes && !Array.isArray(meta.researchNotes)) {
          results.errors.push('Course researchNotes in agent.yaml must be an array');
        }
      } catch (e) {
        results.errors.push(`Invalid YAML in agent.yaml: ${e.message}`);
      }
    } else {
      results.warnings.push('agent.yaml not found (recommended for progress tracking)');
    }

    // 2. Validate Modules and Sections
    const entries = await fs.readdir(absDir, { withFileTypes: true });
    const moduleDirs = entries.filter((e) => e.isDirectory() && e.name.startsWith('m'));

    if (moduleDirs.length === 0) {
      results.warnings.push('No modules found (folders starting with "m")');
    }

    for (const modDirEntry of moduleDirs) {
      const modPath = path.join(absDir, modDirEntry.name);
      const modInfoPath = path.join(modPath, 'info.yaml');

      if (!(await fs.pathExists(modInfoPath))) {
        results.errors.push(`Module info.yaml missing in ${modDirEntry.name}`);
      } else {
        try {
          const modMeta = yaml.load(await fs.readFile(modInfoPath, 'utf8'));
          if (!modMeta.title)
            results.errors.push(`Module title missing in ${modDirEntry.name}/info.yaml`);
          if (modMeta.learningGoals && !Array.isArray(modMeta.learningGoals)) {
            results.errors.push(
              `Module learningGoals must be an array: ${modDirEntry.name}/info.yaml`
            );
          }
        } catch (e) {
          results.errors.push(`Invalid YAML in ${modDirEntry.name}/info.yaml: ${e.message}`);
        }
      }

      const secEntries = await fs.readdir(modPath, { withFileTypes: true });
      const secDirs = secEntries.filter((e) => e.isDirectory() && e.name.match(/^s\d+/));

      for (const secDirEntry of secDirs) {
        const secPath = path.join(modPath, secDirEntry.name);
        const dataPath = path.join(secPath, 'data.md');

        if (!(await fs.pathExists(dataPath))) {
          results.errors.push(`Section data.md missing in ${modDirEntry.name}/${secDirEntry.name}`);
          continue;
        }

        try {
          const fileContent = await fs.readFile(dataPath, 'utf8');
          const { data: frontmatter, content } = matter(fileContent);

          if (!frontmatter.title)
            results.errors.push(
              `Section title missing in frontmatter: ${modDirEntry.name}/${secDirEntry.name}`
            );
          if (frontmatter.learningGoals && !Array.isArray(frontmatter.learningGoals)) {
            results.errors.push(
              `Section learningGoals must be an array: ${modDirEntry.name}/${secDirEntry.name}`
            );
          }
          if (frontmatter.resources && !Array.isArray(frontmatter.resources)) {
            results.errors.push(
              `Section resources must be an array: ${modDirEntry.name}/${secDirEntry.name}`
            );
          }

          // Check for TOC compatibility (no Level 1 headers inside sections)
          const h1Matches = content.match(/^#\s+/m);
          if (h1Matches) {
            results.errors.push(
              `Section contains Level 1 header (#). Use ## or ### for TOC compatibility: ${modDirEntry.name}/${secDirEntry.name}`
            );
          }

          // Check for block headers and valid types
          const blockHeaderRegex = /^##\s+\[(.*?)\]/gm;
          let match;
          const foundBlocks = [];
          const validBlockTypes = [
            'MdBlock',
            'QuizBlock',
            'StepByStepBlock',
            'ResourceBlock',
            'MermaidBlock',
            'VideoBlock',
            'CodeBlock',
          ];

          while ((match = blockHeaderRegex.exec(content)) !== null) {
            const blockType = match[1];
            foundBlocks.push(blockType);
            if (!validBlockTypes.includes(blockType)) {
              results.warnings.push(
                `Unknown Magic Block type [${blockType}]: ${modDirEntry.name}/${secDirEntry.name}`
              );
            }
          }

          if (foundBlocks.length === 0) {
            results.warnings.push(
              `Section has no Magic Blocks: ${modDirEntry.name}/${secDirEntry.name}`
            );
          }

          // Procedural/Lab validation
          const isLab =
            frontmatter.title.toLowerCase().includes('lab') ||
            frontmatter.title.toLowerCase().includes('exercise') ||
            frontmatter.description?.toLowerCase().includes('step');

          if (isLab && !foundBlocks.includes('StepByStepBlock')) {
            results.warnings.push(
              `Lab/Exercise section missing StepByStepBlock: ${modDirEntry.name}/${secDirEntry.name}`
            );
          }

          // Basic Quiz Validation
          if (foundBlocks.includes('QuizBlock')) {
            const quizContent = content.split(/##\s+\[QuizBlock\]/)[1].split(/##\s+\[/)[0];
            if (!quizContent.includes('correctAnswer:')) {
              results.errors.push(
                `QuizBlock missing correctAnswer in ${modDirEntry.name}/${secDirEntry.name}`
              );
            }
          }
        } catch (e) {
          results.errors.push(
            `Error parsing ${modDirEntry.name}/${secDirEntry.name}/data.md: ${e.message}`
          );
        }
      }
    }
  } catch (err) {
    results.errors.push(`Validation failed: ${err.message}`);
  }

  return results;
}
