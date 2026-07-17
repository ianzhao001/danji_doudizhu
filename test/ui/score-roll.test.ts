/**
 * W-VISION S5a 结算分数滚动纯岛契约（规划者预写红种子 · 2026-07-16 · sota2）。
 *
 * 落位：Codex 逐字节复制到 test/ui/score-roll.test.ts（新建），作为独立 seed commit；
 * 并新建纯岛 assets/scripts/ui/score-roll.ts 实现 scoreRollFrames。内容一字不得改动。
 *
 * ── 契约 ──
 *   · scoreRollFrames(from: number, to: number, steps: number): number[]
 *     结算面板分数从 from 滚到 to 的每帧整数值（线性插值 + 四舍五入），供 S5b 逐帧写 Label。
 *   · frames.length === steps；末帧严格 === to；每帧为整数；单调朝 to（不回头、不越过 to）。
 *   · from === to → 全 steps 帧均 === to（静止也出满帧，供接线统一逐帧写）。
 *   · steps < 1 或非整数 → 抛错（防呆；分数为整数，from/to 传整数）。
 *   · 纯函数、确定性、禁 cc / Math.random / Date.now。
 *   · 锚点用例为**手算独立字面量**（不经被测实现推导）。
 *
 * ── 公式（供实现方对齐，避免 off-by-one）──
 *   frames[i] = round(from + (to - from) * (i + 1) / steps)，i ∈ [0, steps)；末帧强制 === to。
 *   例：scoreRollFrames(0,10,5) = [2,4,6,8,10]；scoreRollFrames(0,3,3) = [1,2,3]。
 *
 * ── 预期红（实现前）── assets/scripts/ui/score-roll.ts 不存在 → 全红 + TS2307。建岛后转绿。
 *
 * ── 负向变异自证（实现后自查，报告注明红几条）──
 *   ① 用 (i)/steps 而非 (i+1)/steps（off-by-one，末帧 ≠ to）→「末帧===to」+ 锚点红。
 *   ② 不 round（留浮点）→「每帧整数」+ 锚点红。
 *   ③ from===to 返回 [] →「静止出满帧」红。
 *   ④ steps=0 不抛错 →「防呆」红。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { scoreRollFrames } from '../../assets/scripts/ui/score-roll';

describe('W-VISION S5a 结算分数滚动纯岛', () => {
  it('线性整数插值：锚点用例（手算独立期望）', () => {
    expect(scoreRollFrames(0, 10, 5)).toEqual([2, 4, 6, 8, 10]);
    expect(scoreRollFrames(0, 3, 3)).toEqual([1, 2, 3]);
    expect(scoreRollFrames(-6, 0, 3)).toEqual([-4, -2, 0]);
    expect(scoreRollFrames(4, -2, 3)).toEqual([2, 0, -2]); // 负向滚动（农民扣分）
  });

  it('末帧恒等于 to、帧数恒等于 steps、全整数', () => {
    const cases: Array<readonly [number, number, number]> = [
      [0, 7, 4],
      [3, 3, 5],
      [-9, 5, 6],
      [10, -10, 7],
    ];
    for (const [from, to, steps] of cases) {
      const frames = scoreRollFrames(from, to, steps);
      expect(frames, `steps=${steps}`).toHaveLength(steps);
      expect(frames.at(-1), `末帧 from=${from} to=${to}`).toBe(to);
      for (const value of frames) expect(Number.isInteger(value), `帧 ${value} 应为整数`).toBe(true);
    }
  });

  it('单调朝 to，不越过 to（升/降两向）', () => {
    const up = scoreRollFrames(0, 10, 5);
    for (let i = 1; i < up.length; i += 1) {
      expect(up[i]).toBeGreaterThanOrEqual(up[i - 1]);
      expect(up[i]).toBeLessThanOrEqual(10);
    }
    const down = scoreRollFrames(0, -10, 5);
    for (let i = 1; i < down.length; i += 1) {
      expect(down[i]).toBeLessThanOrEqual(down[i - 1]);
      expect(down[i]).toBeGreaterThanOrEqual(-10);
    }
  });

  it('from===to：全 steps 帧均为 to（静止也出满帧）', () => {
    expect(scoreRollFrames(5, 5, 4)).toEqual([5, 5, 5, 5]);
  });

  it('确定性：同参两次调用逐帧相等', () => {
    expect(scoreRollFrames(-3, 12, 6)).toEqual(scoreRollFrames(-3, 12, 6));
  });

  it('防呆：steps < 1 或非整数抛错', () => {
    expect(() => scoreRollFrames(0, 10, 0)).toThrow();
    expect(() => scoreRollFrames(0, 10, -2)).toThrow();
    expect(() => scoreRollFrames(0, 10, 2.5)).toThrow();
  });

  it("纯岛：源码不含 cc / 非确定性来源", () => {
    const source = readFileSync(new URL('../../assets/scripts/ui/score-roll.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/from\s+['"]cc['"]/);
    expect(source).not.toMatch(/\bMath\.random\b/);
    expect(source).not.toMatch(/\bDate\.now\b/);
  });
});
