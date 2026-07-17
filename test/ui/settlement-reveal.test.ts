/**
 * W-AI 口径②种子：结算放行窗纯岛（规划者预写红种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制到 test/ui/settlement-reveal.test.ts（新建），独立 seed commit。
 * 实现目标：
 *   · assets/scripts/ui/settlement-reveal.ts（新建纯岛：hold 状态机 reducer）；
 *   · assets/scripts/ui/animation-params.ts 新增 settlementReveal()（纯增量）。
 *
 * ── 契约（用户裁决：终局最后一手也要显示牌型标签，结算面板延迟放行）──
 *   beginSettlementHold(animation, { holdMs }): SettlementHold
 *     · animation=false → { remainingMs: 0 }（动效关：零延迟直显，行为与旧口径一致）；
 *     · animation=true  → { remainingMs: holdMs }。
 *   tickSettlementHold(hold, deltaMs): { hold; justExpired }
 *     · 递减并夹底 0；justExpired 仅在本次 tick 从 >0 跨到 0 时为 true（恰一次）；
 *     · 已到 0 再 tick → false；deltaMs<0 视作 0（防御）。
 *   isHoldingSettlement(hold): boolean —— remainingMs > 0。
 *   settlementReveal().holdMs ≡ patternBurst() 三段和（popMs+holdMs+fadeMs，单源防漂移）。
 *
 * ── 预期红（实现前）── 两模块导出缺失 → 全文件红（5 用例）。
 *
 * ── 负向变异自证（执行者实现后自查，报告注明红几条）──
 *   ① beginSettlementHold 忽略 animation=false 恒给 holdMs →「动效关直显」用例红。
 *   ② tick 不夹底/越 0 不置 justExpired →「跨零恰一次」用例红。
 *   ③ settlementReveal 写死字面量而不引 patternBurst → 改 patternBurst 任一段后「单源」用例红
 *     （自证做法：临时把 patternBurst 的 fadeMs +1 跑本文件，应红，改回）。
 */
import { describe, expect, it } from 'vitest';
import {
  beginSettlementHold,
  isHoldingSettlement,
  tickSettlementHold,
  type SettlementHold,
} from '../../assets/scripts/ui/settlement-reveal';
import { patternBurst, settlementReveal } from '../../assets/scripts/ui/animation-params';

describe('W-AI 口径② settlement-reveal 纯岛（结算放行窗）', () => {
  it('动效关：begin(false) 直接归零，不产生任何延迟', () => {
    const hold = beginSettlementHold(false, { holdMs: 600 });
    expect(hold.remainingMs).toBe(0);
    expect(isHoldingSettlement(hold)).toBe(false);
  });

  it('动效开：begin(true) 取 holdMs 并进入持有态', () => {
    const hold = beginSettlementHold(true, { holdMs: 600 });
    expect(hold.remainingMs).toBe(600);
    expect(isHoldingSettlement(hold)).toBe(true);
  });

  it('tick 递减、夹底 0、跨零恰好触发一次 justExpired', () => {
    let hold: SettlementHold = beginSettlementHold(true, { holdMs: 600 });
    const step1 = tickSettlementHold(hold, 250);
    expect(step1.hold.remainingMs).toBe(350);
    expect(step1.justExpired).toBe(false);
    const step2 = tickSettlementHold(step1.hold, 350);
    expect(step2.hold.remainingMs).toBe(0);
    expect(step2.justExpired).toBe(true);
    const step3 = tickSettlementHold(step2.hold, 16);
    expect(step3.hold.remainingMs).toBe(0);
    expect(step3.justExpired, 'justExpired 只在跨零那一次').toBe(false);

    // 大步长越 0：同样夹底且只触发一次。
    hold = beginSettlementHold(true, { holdMs: 100 });
    const jump = tickSettlementHold(hold, 1000);
    expect(jump.hold.remainingMs).toBe(0);
    expect(jump.justExpired).toBe(true);
    expect(tickSettlementHold(jump.hold, 1000).justExpired).toBe(false);
  });

  it('防御：负 deltaMs 视作 0，不得把 remainingMs 加大或触发过期', () => {
    const hold = beginSettlementHold(true, { holdMs: 100 });
    const step = tickSettlementHold(hold, -50);
    expect(step.hold.remainingMs).toBe(100);
    expect(step.justExpired).toBe(false);
  });

  it('settlementReveal 单源：holdMs ≡ patternBurst 三段和且 ≥400ms（标签完整播完）', () => {
    const burst = patternBurst();
    const reveal = settlementReveal();
    expect(reveal.holdMs).toBe(burst.popMs + burst.holdMs + burst.fadeMs);
    expect(reveal.holdMs).toBeGreaterThanOrEqual(400);
  });
});
