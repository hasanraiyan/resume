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
  const potentialModuleDirs = entries.filter((e) => e.isDirectory());
  const modules = [];

  for (const entry of potentialModuleDirs) {
    const modPath = path.join(absDir, entry.name);
    const modInfoPath = path.join(modPath, 'info.yaml');

    // Only treat as a module if info.yaml exists
    if (await fs.pathExists(modInfoPath)) {
      const modMetadata = yaml.load(await fs.readFile(modInfoPath, 'utf8'));
      const mod = {
        ...modMetadata,
        folderName: entry.name,
        sections: [],
      };

      // 3. Traverse Sections
      const secEntries = await fs.readdir(modPath, { withFileTypes: true });
      const potentialSecDirs = secEntries.filter((e) => e.isDirectory());

      for (const secEntry of potentialSecDirs) {
        const secPath = path.join(modPath, secEntry.name);
        const dataPath = path.join(secPath, 'data.md');

        // Only treat as a section if data.md exists
        if (await fs.pathExists(dataPath)) {
          const fileContent = await fs.readFile(dataPath, 'utf8');
          const { data: frontmatter, content } = matter(fileContent);

          mod.sections.push({
            ...frontmatter,
            content: content.trim(),
            folderName: secEntry.name,
          });
        }
      }

      // Sort Sections within module
      mod.sections.sort((a, b) => {
        const orderA = a.order ?? 999;
        const orderB = b.order ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.folderName.localeCompare(b.folderName, undefined, { numeric: true });
      });

      modules.push(mod);
    }
  }

  // Sort Modules
  modules.sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.folderName.localeCompare(b.folderName, undefined, { numeric: true });
  });

  bundle.modules = modules;
  return bundle;
}
