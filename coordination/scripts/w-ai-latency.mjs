#!/usr/bin/env node
/**
 * W-AI-R3（B0 立度量）：困难档决策+提示延迟门入口（sota2）。
 * 转发到 tsx 计时器（test/bench/ai-latency.ts），把 M4 基线天花板回归作硬门，
 * 低端机代理估计（实测×factor）随报——需真机校准，不作硬门（三方审查 #21）。
 *
 *   node coordination/scripts/w-ai-latency.mjs [--low-end-factor=4]
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const factor = process.argv.find((a) => a.startsWith('--low-end-factor=')) ?? '--low-end-factor=4';

const result = spawnSync(
  'npm',
  ['--prefix', 'test', 'exec', 'tsx', '--', 'test/bench/ai-latency.ts', factor],
  { cwd: REPO, stdio: 'inherit', encoding: 'utf8' },
);
process.exit(result.status ?? 1);
