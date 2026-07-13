#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const actualRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: root,
  encoding: 'utf8',
}).trim();

if (resolve(actualRoot) !== root) {
  throw new Error(`Expected repository root ${root}, got ${actualRoot}.`);
}

chmodSync(resolve(root, '.githooks/pre-push'), 0o755);
execFileSync('git', ['config', '--local', 'core.hooksPath', '.githooks'], {
  cwd: root,
  stdio: 'inherit',
});

console.log('Installed repository hooks from .githooks.');
console.log('Use node scripts/push-with-readme.mjs for origin/main updates.');
