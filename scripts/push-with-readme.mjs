#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import {
  README_FILES,
  prependEntries,
  collectSummary,
  coverageForRef,
  formatShanghaiTime,
  hasUncoveredChanges,
} from './readme-changelog.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REMOTE = 'origin';
const BRANCH = 'main';

function git(args, options = {}) {
  const output = execFileSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
  });
  return typeof output === 'string' ? output.trim() : '';
}

function ensureCleanWorktree() {
  const status = git(['status', '--porcelain']);
  if (status) {
    throw new Error('Working tree is not clean. Commit or stash local changes before publishing.');
  }
}

function aheadBehind(remoteRef) {
  const output = git(['rev-list', '--left-right', '--count', `HEAD...${remoteRef}`]);
  const [ahead, behind] = output.split(/\s+/).map((value) => Number.parseInt(value, 10));
  return { ahead, behind };
}

function push() {
  const result = spawnSync('git', ['push', REMOTE, `HEAD:${BRANCH}`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error('Push failed. The prepared README log commit was kept for a safe retry.');
  }
}

function requestedDate() {
  const value = process.env.README_CHANGELOG_NOW;
  return value ? new Date(value) : new Date();
}

function main() {
  process.chdir(REPO_ROOT);
  const currentBranch = git(['branch', '--show-current']);
  if (currentBranch !== BRANCH) {
    throw new Error(`This command only publishes ${BRANCH}; current branch is ${currentBranch || '(detached HEAD)'}.`);
  }
  ensureCleanWorktree();

  console.log(`Refreshing ${REMOTE}/${BRANCH}...`);
  git(['fetch', '--prune', REMOTE, BRANCH], { stdio: 'inherit' });
  const remoteRef = `${REMOTE}/${BRANCH}`;
  const { ahead, behind } = aheadBehind(remoteRef);
  if (behind > 0) {
    throw new Error(`Local ${BRANCH} is behind ${remoteRef} by ${behind} commit(s). Sync it manually before publishing.`);
  }
  if (ahead === 0) {
    console.log(`${remoteRef} is already up to date; nothing to publish.`);
    return;
  }

  const head = git(['rev-parse', 'HEAD']);
  const coverage = coverageForRef(REPO_ROOT, head);
  if (hasUncoveredChanges(REPO_ROOT, coverage, head)) {
    const timestamp = formatShanghaiTime(requestedDate());
    const summary = collectSummary({ cwd: REPO_ROOT, baseRef: remoteRef, head });
    prependEntries({
      cwd: REPO_ROOT,
      timestamp,
      remote: REMOTE,
      branch: BRANCH,
      head,
      summary,
      summaries: {
        zh: process.env.README_CHANGELOG_SUMMARY_ZH,
        en: process.env.README_CHANGELOG_SUMMARY_EN,
      },
    });
    git(['add', '--', ...README_FILES]);
    git(['commit', '-m', `docs(readme): update change log ${timestamp}`], { stdio: 'inherit' });
    console.log(`Prepared bilingual README update log for ${head.slice(0, 12)}.`);
  } else {
    console.log('README update log is already prepared; retrying without creating a duplicate entry.');
  }

  ensureCleanWorktree();
  push();
  console.log(`Published ${BRANCH} to ${remoteRef} with a synchronized README update log.`);
}

try {
  main();
} catch (error) {
  console.error(`push-with-readme: ${error.message}`);
  process.exitCode = 1;
}
