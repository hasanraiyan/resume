import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import matter from 'gray-matter';

export async function packageCourse(dir) {
  const absDir = path.resolve(dir);

  if (!(await fs.pathExists(absDir))) {
    throw new Error(`Directory not found: ${absDir}`);
  }

  // 1. Parse Course Metadata
  const courseInfoPath = path.join(absDir, 'info.yaml');
  const agentInfoPath = path.join(absDir, 'agent.yaml');

  if (!(await fs.pathExists(courseInfoPath))) {
    throw new Error(`Course info.yaml missing in ${absDir}`);
  }

  const courseMetadata = yaml.load(await fs.readFile(courseInfoPath, 'utf8'));
  let agentMetadata = {};

  if (await fs.pathExists(agentInfoPath)) {
    agentMetadata = yaml.load(await fs.readFile(agentInfoPath, 'utf8'));
  }

  const bundle = {
    ...courseMetadata,
    ...agentMetadata,
    modules: [],
  };

  // 2. Traverse Modules
  const entries = await fs.readdir(absDir, { withFileTypes: true });
  const moduleDirs = entries
    .filter((e) => e.isDirectory() && e.name.startsWith('m'))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  for (const modDirEntry of moduleDirs) {
    const modPath = path.join(absDir, modDirEntry.name);
    const modInfoPath = path.join(modPath, 'info.yaml');

    if (!(await fs.pathExists(modInfoPath))) {
      console.warn(`Warning: Module info.yaml missing in ${modPath}. Skipping.`);
      continue;
    }

    const modMetadata = yaml.load(await fs.readFile(modInfoPath, 'utf8'));
    const mod = {
      ...modMetadata,
      sections: [],
    };

    // 3. Traverse Sections
    const secEntries = await fs.readdir(modPath, { withFileTypes: true });
    const secDirs = secEntries
      .filter((e) => e.isDirectory() && e.name.match(/^s\d+/))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    for (const secDirEntry of secDirs) {
      const secPath = path.join(modPath, secDirEntry.name);
      const dataPath = path.join(secPath, 'data.md');

      if (!(await fs.pathExists(dataPath))) {
        console.warn(`Warning: Section data.md missing in ${secPath}. Skipping.`);
        continue;
      }

      const fileContent = await fs.readFile(dataPath, 'utf8');
      const { data: frontmatter, content } = matter(fileContent);

      mod.sections.push({
        ...frontmatter,
        content: content.trim(),
      });
    }

    bundle.modules.push(mod);
  }

  return bundle;
}
