#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

export const README_FILES = ['README.md', 'README.en.md'];
export const COVERAGE_PATTERN = /<!-- readme-changelog-covered-through: ([0-9a-f]{40}) -->/;
const ZERO_SHA = '0'.repeat(40);

function git(args, cwd, options = {}) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function gitStatus(args, cwd) {
  return spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function formatShanghaiTime(date = new Date()) {
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid changelog timestamp.');
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second} +08:00`;
}

export function readCoverage(content) {
  const match = content.match(COVERAGE_PATTERN);
  if (!match) {
    throw new Error('README changelog coverage marker is missing.');
  }
  if (content.match(new RegExp(COVERAGE_PATTERN.source, 'g'))?.length !== 1) {
    throw new Error('README must contain exactly one changelog coverage marker.');
  }
  return match[1];
}

function marker(sha) {
  return `<!-- readme-changelog-covered-through: ${sha} -->`;
}

function moduleKey(path) {
  const scriptMatch = path.match(/^assets\/scripts\/(rules|game|ai|flow|data|ui|runtime)(?:\/|$)/);
  if (scriptMatch) return scriptMatch[1];
  if (path.startsWith('assets/resources/')) return 'assets';
  if (path.startsWith('assets/scene/')) return 'scenes';
  if (path.startsWith('test/')) return 'tests';
  if (path === 'README.md' || path === 'README.en.md' || path.startsWith('docs/')) return 'docs';
  if (path.startsWith('coordination/')) return 'coordination';
  if (path.startsWith('scripts/') || path.startsWith('.githooks/')) return 'tooling';
  return path.split('/')[0] || 'root';
}

const MODULE_LABELS = {
  zh: {
    rules: '规则', game: '状态机', ai: 'AI', flow: '流程', data: '本地数据', ui: '界面', runtime: '运行时',
    assets: '资源', scenes: '场景', tests: '测试', docs: '文档', coordination: '验证与发布资料', tooling: '工程工具', root: '根配置',
  },
  en: {
    rules: 'rules', game: 'state machine', ai: 'AI', flow: 'flow', data: 'local data', ui: 'UI', runtime: 'runtime',
    assets: 'assets', scenes: 'scenes', tests: 'tests', docs: 'documentation', coordination: 'verification and release material', tooling: 'tooling', root: 'root configuration',
  },
};

function localizedModules(keys, locale) {
  const labels = MODULE_LABELS[locale];
  return keys.map((key) => labels[key] ?? key).join(locale === 'zh' ? '、' : ', ');
}

export function collectSummary({ cwd, baseRef, head }) {
  const range = `${baseRef}..${head}`;
  const subjects = git(['log', '--reverse', '--format=%s', range], cwd)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
  const files = git(['diff', '--name-only', range], cwd)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
  const moduleKeys = [...new Set(files.map(moduleKey))].sort();
  const numstat = git(['diff', '--numstat', range], cwd)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
  let insertions = 0;
  let deletions = 0;
  let binaryFiles = 0;
  for (const line of numstat) {
    const [added, removed] = line.split('\t');
    if (added === '-' || removed === '-') {
      binaryFiles += 1;
      continue;
    }
    insertions += Number.parseInt(added, 10) || 0;
    deletions += Number.parseInt(removed, 10) || 0;
  }

  return {
    subjects,
    files,
    moduleKeys,
    insertions,
    deletions,
    binaryFiles,
  };
}

function subjectLines(subjects) {
  return subjects.length > 0 ? subjects.map((subject) => `  - ${subject}`).join('\n') : '  - No commit subject available';
}

export function buildEntry({ locale, timestamp, remote, branch, head, summary }) {
  const modules = localizedModules(summary.moduleKeys, locale) || (locale === 'zh' ? '无文件变化' : 'no file changes');
  if (locale === 'zh') {
    return `### ${timestamp}\n\n- 目标：\`${remote}/${branch}\`\n- 覆盖提交：\`${head}\`\n- 受影响模块：${modules}\n- 变更统计：${summary.files.length} 个文件，新增 ${summary.insertions} 行，删除 ${summary.deletions} 行，二进制文件 ${summary.binaryFiles} 个\n- 提交摘要：\n${subjectLines(summary.subjects)}`;
  }
  return `### ${timestamp}\n\n- Target: \`${remote}/${branch}\`\n- Covered commit: \`${head}\`\n- Affected modules: ${modules}\n- Diff statistics: ${summary.files.length} files, ${summary.insertions} insertions, ${summary.deletions} deletions, ${summary.binaryFiles} binary files\n- Commit summary:\n${subjectLines(summary.subjects)}`;
}

export function appendEntries({ cwd, timestamp, remote, branch, head, summary }) {
  for (const [index, file] of README_FILES.entries()) {
    const path = `${cwd}/${file}`;
    const content = readFileSync(path, 'utf8');
    readCoverage(content);
    const entry = buildEntry({
      locale: index === 0 ? 'zh' : 'en',
      timestamp,
      remote,
      branch,
      head,
      summary,
    });
    const updated = content.replace(COVERAGE_PATTERN, `${entry}\n\n${marker(head)}`);
    writeFileSync(path, updated, 'utf8');
  }
}

function coverageAtRef(cwd, ref, file) {
  const content = git(['show', `${ref}:${file}`], cwd);
  return readCoverage(content);
}

export function coverageForRef(cwd, ref) {
  const values = README_FILES.map((file) => coverageAtRef(cwd, ref, file));
  if (values[0] !== values[1]) {
    throw new Error('Chinese and English README coverage markers do not match.');
  }
  return values[0];
}

export function hasUncoveredChanges(cwd, coverage, head) {
  const ancestor = gitStatus(['merge-base', '--is-ancestor', coverage, head], cwd);
  if (ancestor.status !== 0) {
    throw new Error(`Coverage commit ${coverage} is not an ancestor of ${head}.`);
  }
  const diff = gitStatus([
    'diff', '--quiet', `${coverage}..${head}`, '--', '.',
    ':(exclude)README.md', ':(exclude)README.en.md',
  ], cwd);
  if (diff.status === 0) return false;
  if (diff.status === 1) return true;
  throw new Error(diff.stderr.trim() || 'Unable to inspect README changelog coverage.');
}

function readStdin() {
  return readFileSync(0, 'utf8');
}

export function checkPushInput({ cwd, remote, input }) {
  if (remote !== 'origin') return;
  const lines = input.split('\n').map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const [localRef, localSha, remoteRef] = line.split(/\s+/);
    if (remoteRef !== 'refs/heads/main' || localSha === ZERO_SHA) continue;
    let coverage;
    try {
      coverage = coverageForRef(cwd, localSha);
    } catch (error) {
      throw new Error(`Cannot verify README update log for ${localRef}: ${error.message}`);
    }
    if (hasUncoveredChanges(cwd, coverage, localSha)) {
      throw new Error([
        'origin/main contains changes that are not covered by the README update log.',
        'Use: node scripts/push-with-readme.mjs',
        'Use git push --no-verify only for an intentional emergency bypass.',
      ].join('\n'));
    }
  }
}

async function main() {
  const [command, remote] = process.argv.slice(2);
  if (command !== 'check-push') {
    throw new Error('Usage: node scripts/readme-changelog.mjs check-push <remote> <url>');
  }
  const cwd = git(['rev-parse', '--show-toplevel'], process.cwd());
  checkPushInput({ cwd, remote, input: readStdin() });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`pre-push: ${error.message}`);
    process.exitCode = 1;
  });
}
