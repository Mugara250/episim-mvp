// One-off: bundles the prototype's sample data (frontend/src/data/*.ts) and writes it as raw JSON.
// The Python seed converter (app/seed_convert.py) turns this into backend/app/data/seed/*.json.
// Usage: node backend/tools/export_frontend_seed.mjs <out.json>
import { build } from '../../frontend/node_modules/esbuild/lib/main.js';
import { readdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const dataDir = resolve(import.meta.dirname, '../../frontend/src/data');
const files = readdirSync(dataDir).filter((f) => f.endsWith('.ts') && f !== 'landing.ts');
const entry = files.map((f) => `export * as ${f.replace('.ts', '')} from ${JSON.stringify(join(dataDir, f))};`).join('\n');
const dir = mkdtempSync(join(tmpdir(), 'episim-seed-'));
const out = join(dir, 'bundle.mjs');
await build({ stdin: { contents: entry, resolveDir: dataDir, loader: 'ts' }, bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error' });
const mod = await import(pathToFileURL(out).href);
const json = JSON.stringify(mod, (k, v) => (typeof v === 'function' ? undefined : v), 1);
writeFileSync(process.argv[2], json);
console.log('exported', Object.keys(mod).join(', '));
