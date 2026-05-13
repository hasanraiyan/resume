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
    const potentialModuleDirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'));

    if (potentialModuleDirs.length === 0) {
      results.warnings.push('No directories found in course root.');
    }

    for (const modDirEntry of potentialModuleDirs) {
      const modPath = path.join(absDir, modDirEntry.name);
      const modInfoPath = path.join(modPath, 'info.yaml');

      if (!(await fs.pathExists(modInfoPath))) {
        // If it starts with 'm', it's likely a module missing info.yaml
        if (modDirEntry.name.match(/^m\d+/)) {
          results.errors.push(`Module info.yaml missing in ${modDirEntry.name}`);
        }
        continue;
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
      const potentialSecDirs = secEntries.filter((e) => e.isDirectory() && !e.name.startsWith('.'));

      for (const secDirEntry of potentialSecDirs) {
        const secPath = path.join(modPath, secDirEntry.name);
        const dataPath = path.join(secPath, 'data.md');

        if (!(await fs.pathExists(dataPath))) {
          // If it starts with 's', it's likely a section missing data.md
          if (secDirEntry.name.match(/^s\d+/)) {
            results.errors.push(
              `Section data.md missing in ${modDirEntry.name}/${secDirEntry.name}`
            );
          }
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

          // These should ideally be imported, but for CLI we'll define the current standard
          const SUPPORTED_BLOCKS = [
            'MdBlock',
            'QuizBlock',
            'VideoBlock',
            'ResourceBlock',
            'StepByStepBlock',
            'AccordionBlock',
            'TabsBlock',
            'CalloutBlock',
            'TimelineBlock',
          ];
          const AUTHORING_ALIASES = ['MermaidBlock', 'CodeBlock'];
          const VALID_BLOCKS = [...SUPPORTED_BLOCKS, ...AUTHORING_ALIASES];

          while ((match = blockHeaderRegex.exec(content)) !== null) {
            const blockType = match[1];
            foundBlocks.push(blockType);
            if (!VALID_BLOCKS.includes(blockType)) {
              results.warnings.push(
                `Unknown Magic Block type [${blockType}]: ${modDirEntry.name}/${secDirEntry.name}. Supported: ${SUPPORTED_BLOCKS.join(', ')}. Aliases: ${AUTHORING_ALIASES.join(', ')}`
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

          // Mermaid Syntax Validation (for both standalone and inline)
          const mermaidKeywords = [
            'graph',
            'flowchart',
            'sequenceDiagram',
            'classDiagram',
            'stateDiagram',
            'erDiagram',
            'journey',
            'gantt',
            'pie',
            'quadrantChart',
            'xychart',
            'mindmap',
            'timeline',
            'zenuml',
            'gitGraph',
            'requirementDiagram',
          ];

          if (foundBlocks.includes('MermaidBlock')) {
            const mermaidContent = content
              .split(/##\s+\[MermaidBlock\]/)[1]
              .split(/##\s+\[/)[0]
              .trim();
            const hasKeyword = mermaidKeywords.some((k) => mermaidContent.includes(k));
            if (!mermaidContent) {
              results.errors.push(
                `MermaidBlock is empty in ${modDirEntry.name}/${secDirEntry.name}`
              );
            } else if (!hasKeyword) {
              results.warnings.push(
                `MermaidBlock might have invalid syntax (no recognized diagram type): ${modDirEntry.name}/${secDirEntry.name}`
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
