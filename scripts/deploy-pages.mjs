import { cp, mkdtemp, readdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = fileURLToPath(new URL('..', import.meta.url));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    ...options,
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function output(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    shell: false,
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result.stdout.trim();
}

async function emptyDirectoryExceptGit(directory) {
  for (const entry of await readdir(directory)) {
    if (entry === '.git') continue;
    await rm(path.join(directory, entry), { recursive: true, force: true });
  }
}

async function copyDirectoryContents(source, destination) {
  for (const entry of await readdir(source)) {
    await cp(path.join(source, entry), path.join(destination, entry), { recursive: true });
  }
}

run(npm, ['run', 'build:offline'], { shell: process.platform === 'win32' });
run(npm, ['run', 'test:core'], { shell: process.platform === 'win32' });

const remote = output('git', ['config', '--get', 'remote.origin.url']);
const temp = await mkdtemp(path.join(os.tmpdir(), 'morse-pages-'));

let cloned = spawnSync('git', ['clone', '--branch', 'gh-pages', '--single-branch', remote, temp], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
});

if (cloned.status !== 0) {
  run('git', ['init'], { cwd: temp });
  run('git', ['checkout', '-b', 'gh-pages'], { cwd: temp });
  run('git', ['remote', 'add', 'origin', remote], { cwd: temp });
} else {
  await emptyDirectoryExceptGit(temp);
}

await copyDirectoryContents(path.join(root, 'dist'), temp);
run('git', ['add', '-A'], { cwd: temp });

const diff = spawnSync('git', ['diff', '--cached', '--quiet'], {
  cwd: temp,
  shell: false,
});

if (diff.status === 0) {
  console.log('No Pages changes to deploy.');
  process.exit(0);
}

run('git', ['commit', '-m', 'Deploy GitHub Pages'], { cwd: temp });
run('git', ['push', 'origin', 'gh-pages'], { cwd: temp });
