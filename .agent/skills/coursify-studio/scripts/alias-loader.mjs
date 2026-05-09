import { pathToFileURL } from 'node:url';
import { resolve as pathResolve } from 'node:path';

const projectRoot = process.env.PROJECT_ROOT || process.cwd();

export function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith('@/')) {
    const absolutePath = pathResolve(projectRoot, specifier.replace('@/', 'src/'));
    // Ensure we add .js if missing (simple heuristic for this project)
    let url = pathToFileURL(absolutePath).href;
    if (!url.endsWith('.js') && !url.endsWith('.mjs') && !url.endsWith('.json')) {
      url += '.js';
    }
    return {
      shortCircuit: true,
      url: url
    };
  }
  return defaultResolve(specifier, context, defaultResolve);
}
