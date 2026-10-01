import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { userscriptHeader } from './src/meta.js';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));

const common = { bundle: true, format: 'iife', target: 'es2020', legalComments: 'none' };

await build({
  ...common,
  entryPoints: ['src/main.js'],
  outfile: 'dist/rippling-annual-calendar.user.js',
  banner: { js: userscriptHeader(version) },
});

await build({
  ...common,
  entryPoints: ['probe/probe.js'],
  outfile: 'dist/probe.js',
});

await build({
  ...common,
  entryPoints: ['demo/demo.js'],
  outfile: 'dist/demo.js',
});

console.log(`built v${version} -> dist/`);
