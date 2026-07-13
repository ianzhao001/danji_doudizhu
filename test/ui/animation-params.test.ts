/**
 * M6-L2 失败测试：animation-params 纯映射表（架构种入·不可改）。当前 animation-params.ts 未实现 → 应先红。
 * 规则见 coordination/tasks/M6-L2-animation-params.md。纯函数、确定性、禁止 import `cc`。
 *
 * 抽出 game-scene-skeleton.playEffect 内联的 tween 参数为纯函数，并补 deal 飞入延迟/出牌飞入 from-to：
 * - pulseParams(cue) → { scaleUp, upMs, downMs }：bomb/rocket scaleUp=1.12、deal/play scaleUp=1.04；
 *   所有 cue 的 upMs+downMs ≤ 300（与现有 0.1+0.16=260ms 对齐，留余量）；非动效 cue 返回 null。
 * - dealCardDelay(index, total) → ms：单调非负、index=0 返回 0（第一张立即入场）、index 递增延迟递增。
 * - playFlyFromTo() → { fromY, toY, durationMs }：出牌区牌面从下方飞入到 playArea 槽位。
 */
import { describe, it, expect } from 'vitest';
import { pulseParams, dealCardDelay, playFlyFromTo } from '../../assets/scripts/ui/animation-params';

describe('M6-L2 animation-params 纯映射', () => {
  it('pulseParams(bomb)/pulseParams(rocket) scaleUp=1.12', () => {
    expect(pulseParams('bomb')!.scaleUp).toBe(1.12);
    expect(pulseParams('rocket')!.scaleUp).toBe(1.12);
  });

  it('pulseParams(deal)/pulseParams(play) scaleUp=1.04', () => {
    expect(pulseParams('deal')!.scaleUp).toBe(1.04);
    expect(pulseParams('play')!.scaleUp).toBe(1.04);
  });

  it('所有动效 cue 的 upMs+downMs ≤ 300', () => {
    for (const cue of ['bomb', 'rocket', 'deal', 'play'] as const) {
      const p = pulseParams(cue)!;
      expect(p.upMs + p.downMs).toBeLessThanOrEqual(300);
      expect(p.upMs).toBeGreaterThan(0);
      expect(p.downMs).toBeGreaterThan(0);
    }
  });

  it('非动效 cue 返回 null', () => {
    for (const cue of ['pass', 'win', 'settled', 'landlordDecided', 'redeal', 'bid', 'reset'] as const) {
      expect(pulseParams(cue)).toBeNull();
    }
  });

  it('dealCardDelay(index,total) 单调非负且 index=0 返回 0', () => {
    const total = 17;
    const delays = Array.from({ length: total }, (_, i) => dealCardDelay(i, total));
    expect(delays[0]).toBe(0);
    for (let i = 1; i < total; i++) {
      expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
      expect(delays[i]).toBeGreaterThanOrEqual(0);
    }
  });

  it('playFlyFromTo 返回 fromY<toY 且 durationMs>0（从下方飞入到槽位）', () => {
    const r = playFlyFromTo();
    expect(r.durationMs).toBeGreaterThan(0);
    expect(r.fromY).toBeLessThan(r.toY);
  });

  it('确定性：同 cue 两次 pulseParams 深相等', () => {
    expect(pulseParams('bomb')).toEqual(pulseParams('bomb'));
  });
});

// ---- v1.5 W-JUICE 新增参数(T-ANIM-PARAMS·纯增量,不改上方既有断言) ----
import {
  dealFlight,
  fxBurst,
  playFlyArc,
  pressFeedback,
  resultEntrance,
  buttonRipple,
  rocketBurst,
  resultWinFx,
  sceneFade,
} from '../../assets/scripts/ui/animation-params';

describe('v1.5 W-JUICE 动效参数', () => {
  it('确定性：六函数两次调用深相等', () => {
    expect(playFlyArc()).toEqual(playFlyArc());
    expect(dealFlight()).toEqual(dealFlight());
    expect(resultEntrance()).toEqual(resultEntrance());
    expect(fxBurst()).toEqual(fxBurst());
    expect(pressFeedback()).toEqual(pressFeedback());
    expect(sceneFade()).toEqual(sceneFade());
  });

  it('playFlyArc/dealFlight 参数为正且入场缩放 <1', () => {
    const arc = playFlyArc();
    expect(arc.liftY).toBeGreaterThan(0);
    expect(arc.durationMs).toBeGreaterThan(0);
    expect(arc.fromScale).toBeGreaterThan(0);
    expect(arc.fromScale).toBeLessThan(1);
    const deal = dealFlight();
    expect(deal.durationMs).toBeGreaterThan(0);
    expect(deal.fromScale).toBeLessThan(1);
  });

  it('resultEntrance 关键链总时长 ≤900ms、stagger>0、彩带数 12–16', () => {
    const r = resultEntrance();
    const criticalPath = r.scrimMs + r.panelMs + r.bannerDelayMs + r.bannerMs + r.detailDelayMs;
    expect(criticalPath).toBeLessThanOrEqual(900);
    expect(r.buttonStaggerMs).toBeGreaterThan(0);
    expect(r.confettiCount).toBeGreaterThanOrEqual(12);
    expect(r.confettiCount).toBeLessThanOrEqual(16);
    expect(r.confettiFallMs).toBeGreaterThan(0);
    // R2 增量:renderer 消费的四个编排时长入参数源(魔法数清零),正值且按钮链仍在预算内。
    expect(r.detailFadeMs).toBeGreaterThan(0);
    expect(r.springPopMs).toBeGreaterThan(0);
    expect(r.buttonSlideMs).toBeGreaterThan(0);
    expect(r.buttonFadeMs).toBeGreaterThan(0);
    expect(r.detailDelayMs + r.buttonStaggerMs + Math.max(r.buttonSlideMs, r.buttonFadeMs)).toBeLessThanOrEqual(900);
  });

  // W3-B 纯增量:涟漪/火箭爆点/胜局彩带星光参数确定且在合理域。
  it('W3-B 参数:buttonRipple/rocketBurst/resultWinFx 确定、正值、比例合法', () => {
    expect(buttonRipple()).toEqual(buttonRipple());
    expect(rocketBurst()).toEqual(rocketBurst());
    expect(resultWinFx()).toEqual(resultWinFx());
    const r = buttonRipple();
    expect(r.scaleTo).toBeGreaterThan(r.scaleFrom);
    expect(r.ms).toBeGreaterThan(0);
    expect(r.alphaFrom).toBeGreaterThan(0);
    expect(r.alphaFrom).toBeLessThanOrEqual(255);
    const k = rocketBurst();
    expect(k.riseHeight).toBeGreaterThan(0);
    expect(k.riseMs).toBeGreaterThan(0);
    expect(k.starCount).toBeGreaterThanOrEqual(3);
    expect(k.starRadius).toBeGreaterThan(0);
    const w = resultWinFx();
    expect(w.starCount).toBeGreaterThan(0);
    expect(w.starPulseMs).toBeGreaterThan(0);
    expect(w.starScaleTo).toBeGreaterThan(1);
    expect(w.spreadRatio).toBeGreaterThan(0);
    expect(w.spreadRatio).toBeLessThanOrEqual(1);
  });

  it('fxBurst 角度表恒 6 个、互异、均在 [0,360)', () => {
    const b = fxBurst();
    expect(b.sparkAngles).toHaveLength(6);
    expect(new Set(b.sparkAngles).size).toBe(6);
    for (const a of b.sparkAngles) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(360);
    }
    expect(b.sparkDistance).toBeGreaterThan(0);
    expect(b.ringScaleTo).toBeGreaterThan(1);
    expect(b.shakeAmp).toBeGreaterThan(0);
  });

  it('pressFeedback 缩放在 (0,1)、sceneFade 总时长 ≤400ms', () => {
    const p = pressFeedback();
    expect(p.scale).toBeGreaterThan(0);
    expect(p.scale).toBeLessThan(1);
    expect(p.ms).toBeGreaterThan(0);
    const f = sceneFade();
    expect(f.outMs + f.inMs).toBeLessThanOrEqual(400);
  });
});
