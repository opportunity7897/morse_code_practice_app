import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = fileURLToPath(new URL('..', import.meta.url));
const buildDir = path.join(root, '.build');
const distDir = path.join(root, 'dist');

await rm(buildDir, { recursive: true, force: true });
await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

const candidates = [
  path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc'),
  'tsc'
];
let result = null;
for (const candidate of candidates) {
  result = spawnSync(candidate, ['-p', 'tsconfig.offline.json'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (!result.error) break;
}
if (!result || result.status !== 0) process.exit(result?.status ?? 1);

await mkdir(path.join(distDir, 'assets'), { recursive: true });
await cp(buildDir, path.join(distDir, 'assets'), { recursive: true });
await cp(path.join(root, 'public'), distDir, { recursive: true });
await cp(path.join(root, 'src', 'styles.css'), path.join(distDir, 'assets', 'styles.css'));
await writeFile(path.join(distDir, '.nojekyll'), '');

let html = await readFile(path.join(root, 'index.html'), 'utf8');
html = html.replace('<script type="module" src="/src/main.tsx"></script>', '<script type="module" src="./assets/main.js"></script>');
await writeFile(path.join(distDir, 'index.html'), html);

await rm(buildDir, { recursive: true, force: true });
console.log('Offline production build complete: dist/');
