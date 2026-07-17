/**
 * W-VISION-COLOR 信息层级 · UI 文字色独立 AA 契约（规划者预写红种子 · 2026-07-16 · sota2）。
 *
 * 落位：Codex 逐字节复制到 test/ui/ui-text-colors.test.ts（新建），独立 seed commit；
 * 并新建单一真相源纯岛 assets/scripts/ui/ui-text-colors.ts（把散落在 ui-runtime-helpers 的
 * BUTTON_*_TEXT 归并进来 + 新增角色），renderer 改为消费该岛。内容一字不得改动。
 *
 * ── 用户裁决（2026-07-16「全员皆粉」信息层级重构，逐条机检化）──
 *   · 纯黑/冷黑 UI 文字 → 深咖/深豆沙（暖深，蓝不得为主导通道）——裁决 ⑦。
 *   · 「叫地主」暖黄橙保留；「不叫」马卡龙薄荷绿、**去商务深蓝**——裁决 ⑤。
 *   · 暂停等非核心按钮 → 银白/淡灰低权重（低饱和暖灰字）——裁决 ⑥。
 *   · 当前行动状态 → 淡紫罗兰强调——裁决 ④。
 *   · 牌面黑点数/黑花色**不动**——裁决 ⑦（card-node.ts::cardFaceColor 出本波文件域，红线守）。
 *
 * ── 契约（AA 阈值 = 独立 WCAG 相对亮度，期望不经被测实现推导）──
 *   岛导出 `UI_TEXT_COLORS`（frozen）：primary / bidCall / bidPass / neutralButton /
 *   disabledButton / activeAccent，每个为 {r,g,b,a} 整数通道。
 *   · 全部文字角色：蓝非主导通道（b ≤ max(r,g)）——机检「去冷黑/去深蓝」。
 *   · primary：暖深（r ≥ b）、非纯黑、亮度 < 0.22（深咖/豆沙档）。
 *   · AA：primary 对珍珠白/象牙白 ≥ 4.5；bidCall 对暖黄橙钮 ≥ 4.5；bidPass 对薄荷绿钮 ≥ 4.5；
 *     neutralButton 对银白钮 ≥ 4.5；disabledButton 对银白钮 ≥ 3.0。
 *   · neutralButton 低饱和（max−min ≤ 60）——低视觉权重。
 *   · activeAccent 紫罗兰（r > g 且 b > g）、中调（0.10 < L < 0.60，读作强调非正文）。
 *   参考底色 = 本波 PNG 改色目标（珍珠白出牌区/象牙白信息框/暖黄橙·薄荷绿·银白钮），
 *   仅作字色 AA 的独立参照；**渲染后真实底色的 AA 由五视口图像门C 复核**（背景色 AA 契约）。
 *
 * ── 预期红（实现前）── assets/scripts/ui/ui-text-colors.ts 不存在 → 全红 + TS2307。
 *   建岛并按 band 选色后转绿；若选到蓝主导/低对比/高饱和 neutral，本门精确红。
 *
 * ── 负向变异自证（实现后自查，报告注明红几条）──
 *   ① bidPass 设成旧深蓝 (4,10,22) →「蓝非主导」红 + 「bidPass AA」可能红。
 *   ② primary 设成纯黑 (0,0,0) →「primary 非纯黑」红（AA 反而更高，故必须显式禁纯黑）。
 *   ③ neutralButton 设成高饱和色 →「低饱和」红。
 *   ④ activeAccent 设成绿 (g 主导) →「紫罗兰」红。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UI_TEXT_COLORS } from '../../assets/scripts/ui/ui-text-colors';

interface Rgba { r: number; g: number; b: number; a: number }

// 独立 WCAG 相对亮度 + 对比度（本文件自持，绝不 import 被测实现的任何算色函数）。
function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function luminance(color: Rgba): number {
  return 0.2126 * srgbToLinear(color.r) + 0.7152 * srgbToLinear(color.g) + 0.0722 * srgbToLinear(color.b);
}
function contrastRatio(fg: Rgba, bg: Rgba): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// 本波 PNG 改色目标底色（独立参照；真实渲染 AA 由五视口图像门C 复核）。
const SURFACE = {
  pearl: { r: 250, g: 245, b: 249, a: 255 },   // 珍珠白出牌区 + 极淡粉
  ivory: { r: 255, g: 251, b: 242, a: 255 },   // 象牙白信息框
  bidCall: { r: 245, g: 178, b: 92, a: 255 },  // 暖黄橙 叫地主钮
  bidPass: { r: 168, g: 224, b: 190, a: 255 }, // 马卡龙薄荷绿 不叫钮
  neutral: { r: 230, g: 231, b: 235, a: 255 }, // 银白/淡灰 暂停钮
} as const;

const TEXT_ROLES = ['primary', 'bidCall', 'bidPass', 'neutralButton', 'disabledButton'] as const;

describe('W-VISION-COLOR UI 文字色独立 AA 契约', () => {
  it('每个文字色为合法整数通道', () => {
    for (const [role, c] of Object.entries(UI_TEXT_COLORS)) {
      for (const ch of ['r', 'g', 'b', 'a'] as const) {
        expect(Number.isInteger((c as Rgba)[ch]), `${role}.${ch} 整数`).toBe(true);
        expect((c as Rgba)[ch], `${role}.${ch} 0..255`).toBeGreaterThanOrEqual(0);
        expect((c as Rgba)[ch], `${role}.${ch} 0..255`).toBeLessThanOrEqual(255);
      }
    }
  });

  it('文字色蓝非主导通道（去冷黑/去商务深蓝·裁决⑤⑦）', () => {
    for (const role of TEXT_ROLES) {
      const c = UI_TEXT_COLORS[role] as Rgba;
      expect(c.b, `${role} 蓝不得为主导通道 (b ≤ max(r,g))`).toBeLessThanOrEqual(Math.max(c.r, c.g));
    }
  });

  it('primary 是暖深咖/豆沙：非纯黑、亮度<0.22、暖(r≥b)（裁决⑦）', () => {
    const c = UI_TEXT_COLORS.primary as Rgba;
    expect(c.r + c.g + c.b, 'primary 非纯黑').toBeGreaterThan(12);
    expect(luminance(c), 'primary 深(亮度<0.22)').toBeLessThan(0.22);
    expect(c.r, 'primary 暖(r≥b)').toBeGreaterThanOrEqual(c.b);
  });

  it('AA：正文/按钮字对各自底色达标', () => {
    const c = UI_TEXT_COLORS;
    expect(contrastRatio(c.primary as Rgba, SURFACE.pearl), 'primary/珍珠白').toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.primary as Rgba, SURFACE.ivory), 'primary/象牙白').toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.bidCall as Rgba, SURFACE.bidCall), 'bidCall/暖黄橙').toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.bidPass as Rgba, SURFACE.bidPass), 'bidPass/薄荷绿').toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.neutralButton as Rgba, SURFACE.neutral), 'neutral/银白').toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.disabledButton as Rgba, SURFACE.neutral), 'disabled/银白').toBeGreaterThanOrEqual(3.0);
  });

  it('neutralButton 低饱和（低视觉权重·裁决⑥）', () => {
    const c = UI_TEXT_COLORS.neutralButton as Rgba;
    expect(Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b), 'neutral 低饱和 max−min≤60').toBeLessThanOrEqual(60);
  });

  it('activeAccent 是淡紫罗兰中调强调（裁决④）', () => {
    const c = UI_TEXT_COLORS.activeAccent as Rgba;
    expect(c.r, 'violet r>g').toBeGreaterThan(c.g);
    expect(c.b, 'violet b>g').toBeGreaterThan(c.g);
    const l = luminance(c);
    expect(l, 'accent 中调下限').toBeGreaterThan(0.10);
    expect(l, 'accent 中调上限').toBeLessThan(0.60);
  });

  it("纯岛：ui-text-colors.ts 源码不含 cc / 非确定性来源", () => {
    const source = readFileSync(new URL('../../assets/scripts/ui/ui-text-colors.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/from\s+['"]cc['"]/);
    expect(source).not.toMatch(/\bMath\.random\b/);
    expect(source).not.toMatch(/\bDate\.now\b/);
  });
});
