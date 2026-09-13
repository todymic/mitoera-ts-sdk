/**
 * Emit the CommonJS half of the dual ESM/CJS build.
 *
 * The ESM pass (tsc --project tsconfig.build.json) already wrote dist/*.js and
 * the .d.ts files. This pass compiles the same sources to CommonJS in a staging
 * directory, then moves them into dist/ as .cjs.
 *
 * The rename matters: package.json declares "type": "module", so a plain .js in
 * dist/ is parsed as ESM by Node. CommonJS output has to carry the .cjs
 * extension, and every relative require() it emits must be rewritten to match —
 * sources import './foo.js', tsc emits require('./foo.js'), and that file is
 * called foo.cjs on disk.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root    = join(dirname(fileURLToPath(import.meta.url)), '..');
const staging = join(root, 'dist-cjs');
const dist    = join(root, 'dist');

rmSync(staging, { recursive: true, force: true });

execFileSync(
  process.execPath,
  [join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '--project', 'tsconfig.cjs.json'],
  { cwd: root, stdio: 'inherit' },
);

/** @returns {string[]} every .js file under dir, recursively */
function collect(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return collect(full);
    return full.endsWith('.js') ? [full] : [];
  });
}

const files = collect(staging);

for (const file of files) {
  // require('./x.js') and require("../y/z.js") → the .cjs sibling
  const code = readFileSync(file, 'utf8').replace(
    /require\((['"])(\.\.?\/[^'"]*?)\.js\1\)/g,
    (_, quote, path) => `require(${quote}${path}.cjs${quote})`,
  );

  const target = join(dist, relative(staging, file)).replace(/\.js$/, '.cjs');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, code);
}

rmSync(staging, { recursive: true, force: true });

console.log(`build-cjs: wrote ${files.length} .cjs file(s) to dist/`);
