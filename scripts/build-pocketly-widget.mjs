import esbuild from 'esbuild';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outdir = path.join(root, 'public', 'mcp-widgets', 'pocketly');
const isProduction = process.env.NODE_ENV !== 'development';

await mkdir(outdir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, 'src', 'mcp-widgets', 'pocketly', 'index.jsx')],
  outfile: path.join(outdir, 'widget.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  jsx: 'automatic',
  minify: isProduction,
  sourcemap: !isProduction,
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
  },
  loader: {
    '.js': 'jsx',
    '.jsx': 'jsx',
  },
  logLevel: 'info',
});

const [css, js] = await Promise.all([
  readFile(path.join(outdir, 'widget.css'), 'utf8'),
  readFile(path.join(outdir, 'widget.js'), 'utf8'),
]);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pocketly</title>
    <style>${css.replaceAll('</style', '<\\/style')}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>${js.replaceAll('</script', '<\\/script')}</script>
  </body>
</html>
`;

await writeFile(path.join(outdir, 'index.html'), html);
