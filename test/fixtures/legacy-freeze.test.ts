/**
 * W-AI legacy 冻结防漂移门（规划者直落 main · 2026-07-17 · sota2）。
 * test/fixtures/legacy-ai/ 是开波时 main 的 ai 层逐字节拷贝（仅 rules/game import 重定向），
 * 竞技场 new-vs-legacy 的旧引擎一侧。**本门以 sha256 manifest 钉死每个文件**：
 * 任何人（含 B2 改产品 ai 时的顺手连改）动 legacy 拷贝 → 立红。
 *
 * manifest 生成（**仅规划者在冻结当刻跑一次，之后永不再跑**——与 golden 绊线同规矩）：
 *   LEGACY_FREEZE_UPDATE=1 npm --prefix test test -- fixtures/legacy-freeze
 * 更新模式会重写 manifest 并故意 fail（防止在常规跑批里被静默触发）。
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const LEGACY_ROOT = fileURLToPath(new URL('./legacy-ai', import.meta.url));
const MANIFEST_PATH = join(LEGACY_ROOT, 'manifest.json');
const UPDATE = process.env.LEGACY_FREEZE_UPDATE === '1';

function legacyFiles(): string[] {
  return readdirSync(LEGACY_ROOT, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => relative(LEGACY_ROOT, join(entry.parentPath, entry.name)).split('\\').join('/'))
    .sort();
}

function sha256(rel: string): string {
  return createHash('sha256').update(readFileSync(join(LEGACY_ROOT, rel))).digest('hex');
}

describe('W-AI legacy 冻结防漂移（sha256 manifest）', () => {
  it('legacy-ai 拷贝存在且形态完整（barrel + 根 8 文件 + levels 5 文件）', () => {
    const files = legacyFiles();
    expect(files.length, `实际文件: ${files.join(', ')}`).toBe(14);
    for (const required of [
      'legacy.ts', 'strategy.ts', 'decompose.ts', 'cardMemory.ts', 'handStrength.ts', 'endgame.ts',
      'bidding.ts', 'bidding-levels.ts', 'bidding-hard.ts',
      'levels/simple.ts', 'levels/normal.ts', 'levels/hard.ts', 'levels/_shared.ts', 'levels/lead-score.ts',
    ]) {
      expect(files, `缺冻结文件: ${required}`).toContain(required);
    }
  });

  it('每个冻结文件 sha256 与 manifest 逐一相等（双向：无缺失无多余）', () => {
    const files = legacyFiles();
    const actual: Record<string, string> = {};
    for (const rel of files) actual[rel] = sha256(rel);

    if (UPDATE) {
      writeFileSync(MANIFEST_PATH, `${JSON.stringify(actual, null, 2)}\n`);
      throw new Error(`LEGACY_FREEZE_UPDATE: manifest 已重写(${files.length} 条)——更新模式故意失败，去掉环境变量重跑`);
    }

    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Record<string, string>;
    const manifestKeys = Object.keys(manifest).sort();
    expect(manifestKeys, 'manifest 与磁盘文件集不一致').toEqual(files);
    for (const rel of files) {
      expect(actual[rel], `冻结漂移: ${rel}（legacy 拷贝任何字节都不许动）`).toBe(manifest[rel]);
    }
  });
});
