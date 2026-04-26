import esbuild from 'esbuild';
import path from 'node:path';

const root = process.cwd();

await esbuild.build({
  entryPoints: [path.join(root, 'src/components/pocketly-mcp/widget-entry.jsx')],
  outfile: path.join(root, 'public/mcp/pocketly-widget-v2.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  jsx: 'automatic',
  minify: true,
  sourcemap: false,
  legalComments: 'none',
});
