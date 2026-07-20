import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FIXED_TIME = '2026-07-13T12:34:56+08:00';
const DISPLAY_TIME = '2026-07-13 12:34:56 +08:00';

function run(cwd, executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
  });
  if (!options.allowFailure && result.status !== 0) {
    throw new Error([
      `${executable} ${args.join(' ')} failed with ${result.status}`,
      result.stdout,
      result.stderr,
    ].join('\n'));
  }
  return result;
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

function commit(repo, subject) {
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-m', subject]);
  return git(repo, ['rev-parse', 'HEAD']);
}

function replaceMarker(repo, sha) {
  for (const file of ['README.md', 'README.en.md']) {
    const path = resolve(repo, file);
    const content = readFileSync(path, 'utf8').replace(
      /readme-changelog-covered-through: [0-9a-f]{40}/,
      `readme-changelog-covered-through: ${sha}`,
    );
    writeFileSync(path, content, 'utf8');
  }
}

function setupRepository() {
  const root = mkdtempSync(resolve(tmpdir(), 'readme-changelog-'));
  const repo = resolve(root, 'repo');
  const bare = resolve(root, 'remote.git');
  mkdirSync(repo, { recursive: true });
  git(repo, ['init', '-b', 'main']);
  git(repo, ['config', 'user.name', 'README Test']);
  git(repo, ['config', 'user.email', 'readme-test@example.com']);

  for (const file of ['readme-changelog.mjs', 'push-with-readme.mjs', 'install-git-hooks.mjs']) {
    const destination = resolve(repo, 'scripts', file);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(resolve(SOURCE_ROOT, 'scripts', file), destination);
  }
  mkdirSync(resolve(repo, '.githooks'), { recursive: true });
  copyFileSync(resolve(SOURCE_ROOT, '.githooks/pre-push'), resolve(repo, '.githooks/pre-push'));
  chmodSync(resolve(repo, '.githooks/pre-push'), 0o755);

  const emptyMarker = '<!-- readme-changelog-covered-through: 0000000000000000000000000000000000000000 -->';
  write(resolve(repo, 'README.md'), `# 测试\n\n## 更新记录\n\n<!-- readme-changelog-insert-here -->\n\n### 2026-01-01 00:00:00 +08:00\n\n- 历史记录\n\n${emptyMarker}\n`);
  write(resolve(repo, 'README.en.md'), `# Test\n\n## Update Log\n\n<!-- readme-changelog-insert-here -->\n\n### 2026-01-01 00:00:00 +08:00\n\n- Historical entry\n\n${emptyMarker}\n`);
  write(resolve(repo, 'seed.txt'), 'seed\n');
  const seed = commit(repo, 'chore: seed repository tooling');
  replaceMarker(repo, seed);
  commit(repo, 'docs: anchor update log');

  git(root, ['init', '--bare', bare]);
  git(repo, ['remote', 'add', 'origin', bare]);
  git(repo, ['push', '-u', 'origin', 'main']);
  run(repo, 'node', ['scripts/install-git-hooks.mjs']);

  return {
    root,
    repo,
    bare,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

function occurrenceCount(content, needle) {
  return content.split(needle).length - 1;
}

test('one command summarizes multiple commits, updates both READMEs, and is idempotent', () => {
  const fixture = setupRepository();
  try {
    write(resolve(fixture.repo, 'assets/scripts/ai/alpha.ts'), 'export const alpha = 1;\n');
    commit(fixture.repo, 'feat(ai): add alpha decision');
    write(resolve(fixture.repo, 'docs/alpha.md'), '# Alpha\n');
    const coveredHead = commit(fixture.repo, 'docs: explain alpha decision');

    const result = run(fixture.repo, 'node', ['scripts/push-with-readme.mjs'], {
      env: { README_CHANGELOG_NOW: FIXED_TIME },
    });
    assert.match(result.stdout, /Published main to origin\/main/);

    const zh = readFileSync(resolve(fixture.repo, 'README.md'), 'utf8');
    const en = readFileSync(resolve(fixture.repo, 'README.en.md'), 'utf8');
    for (const content of [zh, en]) {
      assert.ok(content.includes(DISPLAY_TIME));
      assert.match(content, new RegExp(coveredHead));
      assert.match(content, /feat\(ai\): add alpha decision/);
      assert.match(content, /docs: explain alpha decision/);
      assert.equal(occurrenceCount(content, DISPLAY_TIME), 1);
      assert.ok(content.indexOf(DISPLAY_TIME) < content.indexOf('2026-01-01 00:00:00 +08:00'));
    }
    assert.match(zh, /本期更新：feat\(ai\): add alpha decision；docs: explain alpha decision/);
    assert.match(en, /Summary: feat\(ai\): add alpha decision; docs: explain alpha decision/);
    assert.equal(git(fixture.bare, ['rev-parse', 'main']), git(fixture.repo, ['rev-parse', 'HEAD']));
    assert.deepEqual(
      git(fixture.repo, ['diff', '--name-only', `${coveredHead}..HEAD`]).split('\n').sort(),
      ['README.en.md', 'README.md'],
    );

    const beforeRetry = git(fixture.repo, ['rev-parse', 'HEAD']);
    const retry = run(fixture.repo, 'node', ['scripts/push-with-readme.mjs'], {
      env: { README_CHANGELOG_NOW: FIXED_TIME },
    });
    assert.match(retry.stdout, /already up to date/);
    assert.equal(git(fixture.repo, ['rev-parse', 'HEAD']), beforeRetry);
    assert.equal(occurrenceCount(readFileSync(resolve(fixture.repo, 'README.md'), 'utf8'), DISPLAY_TIME), 1);
  } finally {
    fixture.cleanup();
  }
});

test('dirty worktree is rejected before fetch, commit, or push', () => {
  const fixture = setupRepository();
  try {
    write(resolve(fixture.repo, 'dirty.txt'), 'not committed\n');
    const before = git(fixture.repo, ['rev-parse', 'HEAD']);
    const result = run(fixture.repo, 'node', ['scripts/push-with-readme.mjs'], { allowFailure: true });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Working tree is not clean/);
    assert.equal(git(fixture.repo, ['rev-parse', 'HEAD']), before);
  } finally {
    fixture.cleanup();
  }
});

test('a diverged main branch is rejected without rebasing or rewriting history', () => {
  const fixture = setupRepository();
  try {
    const other = resolve(fixture.root, 'other');
    git(fixture.root, ['clone', fixture.bare, other]);
    git(other, ['config', 'user.name', 'Remote Test']);
    git(other, ['config', 'user.email', 'remote-test@example.com']);
    write(resolve(other, 'remote.txt'), 'remote\n');
    commit(other, 'feat: remote change');
    git(other, ['push', 'origin', 'main']);

    write(resolve(fixture.repo, 'local.txt'), 'local\n');
    const localHead = commit(fixture.repo, 'feat: local change');
    const result = run(fixture.repo, 'node', ['scripts/push-with-readme.mjs'], { allowFailure: true });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /behind origin\/main by 1 commit/);
    assert.equal(git(fixture.repo, ['rev-parse', 'HEAD']), localHead);
  } finally {
    fixture.cleanup();
  }
});

test('pre-push blocks direct origin/main updates that lack an update-log commit', () => {
  const fixture = setupRepository();
  try {
    write(resolve(fixture.repo, 'feature.txt'), 'feature\n');
    commit(fixture.repo, 'feat: direct push should be blocked');
    const result = run(fixture.repo, 'git', ['push', 'origin', 'main'], { allowFailure: true });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not covered by the README update log/);
    assert.match(result.stderr, /node scripts\/push-with-readme\.mjs/);
  } finally {
    fixture.cleanup();
  }
});

test('a failed push keeps one prepared log entry and retry does not duplicate it', () => {
  const fixture = setupRepository();
  try {
    write(resolve(fixture.repo, 'retry.txt'), 'retry\n');
    const coveredHead = commit(fixture.repo, 'fix: retry-safe publication');

    const rejectHook = resolve(fixture.bare, 'hooks/pre-receive');
    write(rejectHook, '#!/bin/sh\nexit 1\n');
    chmodSync(rejectHook, 0o755);
    git(fixture.bare, ['config', '--local', 'core.hooksPath', 'hooks']);
    const failed = run(fixture.repo, 'node', ['scripts/push-with-readme.mjs'], {
      allowFailure: true,
      env: { README_CHANGELOG_NOW: FIXED_TIME },
    });
    assert.notEqual(failed.status, 0);
    assert.match(failed.stderr, /prepared README log commit was kept/);
    const preparedHead = git(fixture.repo, ['rev-parse', 'HEAD']);
    assert.notEqual(preparedHead, coveredHead);
    assert.equal(occurrenceCount(readFileSync(resolve(fixture.repo, 'README.md'), 'utf8'), DISPLAY_TIME), 1);

    rmSync(rejectHook);
    const retry = run(fixture.repo, 'node', ['scripts/push-with-readme.mjs'], {
      env: { README_CHANGELOG_NOW: FIXED_TIME },
    });
    assert.match(retry.stdout, /already prepared/);
    assert.equal(git(fixture.repo, ['rev-parse', 'HEAD']), preparedHead);
    assert.equal(git(fixture.bare, ['rev-parse', 'main']), preparedHead);
    assert.equal(occurrenceCount(readFileSync(resolve(fixture.repo, 'README.md'), 'utf8'), DISPLAY_TIME), 1);
  } finally {
    fixture.cleanup();
  }
});
