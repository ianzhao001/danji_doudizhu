/**
 * W-AI-R3 v1.9 冻结基线防漂移门（sota2 · B0 立度量）。
 * test/fixtures/ai-v19/ 是 v1.9 收版当刻 assets/scripts/ai 层的逐字节拷贝（仅 rules/game import 重定向），
 * 作竞技场 candidate-vs-v19 的旧引擎一侧。**本门以 sha256 manifest 钉死每个文件**：
 * 任何人（含 B1–B4 改产品 ai 时的顺手连改）动 v19 拷贝 → 立红。
 *
 * 重新冻结（**仅在需要把新收版快照为基线时跑，之后永不常规跑**）：
 *   node coordination/scripts/w-ai-freeze-baseline.mjs   （重写拷贝 + manifest，随后提交冻结件）
 *
 * ── 负向变异自证 ──
 *   ① 改 test/fixtures/ai-v19/ 任一字节 → 第二个用例 sha256 漂移红。
 *   ② 删/增 fixture 任一 .ts → 「manifest 与磁盘文件集不一致」红。
 *   ③ 缺入口件（v19.ts / strategy.ts / levels/hard.ts…）→ 第一个用例红。
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const V19_ROOT = fileURLToPath(new URL('./ai-v19', import.meta.url));
const MANIFEST_PATH = join(V19_ROOT, 'manifest.json');

function v19Files(): string[] {
  return readdirSync(V19_ROOT, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => relative(V19_ROOT, join(entry.parentPath, entry.name)).split('\\').join('/'))
    .sort();
}

function sha256(rel: string): string {
  return createHash('sha256').update(readFileSync(join(V19_ROOT, rel))).digest('hex');
}

describe('W-AI-R3 v1.9 冻结基线防漂移（sha256 manifest）', () => {
  it('ai-v19 拷贝存在且入口件齐备（barrel + 三档策略 + 叫牌 + 搜索核）', () => {
    const files = v19Files();
    expect(files.length, `实际文件: ${files.join(', ')}`).toBeGreaterThanOrEqual(20);
    for (const required of [
      'v19.ts', 'strategy.ts', 'bidding-levels.ts', 'pimc.ts', 'rollout.ts',
      'worldSolver.ts', 'pressure.ts', 'handWeight.ts',
      'levels/simple.ts', 'levels/normal.ts', 'levels/hard.ts', 'levels/_shared.ts',
    ]) {
      expect(files, `缺冻结入口件: ${required}`).toContain(required);
    }
  });

  it('每个冻结文件 sha256 与 manifest 逐一相等（双向：无缺失无多余）', () => {
    const files = v19Files();
    const actual: Record<string, string> = {};
    for (const rel of files) actual[rel] = sha256(rel);

    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Record<string, string>;
    const manifestKeys = Object.keys(manifest).sort();
    expect(manifestKeys, 'manifest 与磁盘文件集不一致（重跑 w-ai-freeze-baseline.mjs 冻结）').toEqual(files);
    for (const rel of files) {
      expect(actual[rel], `冻结漂移: ${rel}（v19 拷贝任何字节都不许动）`).toBe(manifest[rel]);
    }
  });
});
