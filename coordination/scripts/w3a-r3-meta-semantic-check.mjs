#!/usr/bin/env node
/**
 * W3-A R3 验收器:对 eba23e1 曾触碰的全部存量 .meta 做「工作区 vs 基准 revision」的
 * JSON **递归语义比较**(键序无关、逐值)。默认基准 2cc1891。
 * 运行:cd coordination/scripts && node w3a-r3-meta-semantic-check.mjs [baseRev]
 * 输出:coordination/reports/W-JUICE-W3A-evidence/meta-semantic-check.json;有任何值差异则 exit 1。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BASE = process.argv[2] ?? '2cc1891';
const TOUCHED_RANGE = '2cc1891..eba23e1';

const files = execFileSync('git', ['diff', '--name-only', ...TOUCHED_RANGE.split('..').length === 2 ? [TOUCHED_RANGE] : [], '--', '*.meta'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(Boolean);

function atRev(rev, file) {
  return JSON.parse(execFileSync('git', ['show', `${rev}:${file}`], { cwd: ROOT, encoding: 'utf8' }));
}

function diffDeep(a, b, prefix, out) {
  if (typeof a !== typeof b || (typeof a !== 'object' || a === null || b === null)) {
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ path: prefix, base: a, current: b });
    return;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (!(k in a)) { out.push({ path: `${prefix}/${k}`, base: undefined, current: b[k] }); continue; }
    if (!(k in b)) { out.push({ path: `${prefix}/${k}`, base: a[k], current: undefined }); continue; }
    diffDeep(a[k], b[k], `${prefix}/${k}`, out);
  }
}

const result = { baseRev: BASE, touchedBy: TOUCHED_RANGE, fileCount: files.length, checkedAt: new Date().toISOString(), diffs: {} };
let bad = 0;
for (const f of files) {
  const base = atRev(BASE, f);
  const cur = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const out = [];
  diffDeep(base, cur, '', out);
  if (out.length) { result.diffs[f] = out; bad += 1; }
}
result.filesWithValueDiffs = bad;
result.verdict = bad === 0 ? 'ZERO-SEMANTIC-DIFF' : 'VALUE-DIFFS-FOUND';
const dest = path.join(ROOT, 'coordination/reports/W-JUICE-W3A-evidence/meta-semantic-check.json');
fs.writeFileSync(dest, JSON.stringify(result, null, 2));
console.log(`checked ${files.length} metas vs ${BASE}: ${result.verdict} (filesWithValueDiffs=${bad})`);
if (bad) {
  console.log(JSON.stringify(Object.entries(result.diffs).slice(0, 3), null, 1));
  process.exit(1);
}
