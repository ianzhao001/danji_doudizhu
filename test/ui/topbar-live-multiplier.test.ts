/**
 * T-HUD-LIVE 失败测试（规划者种入·不可改）：顶栏实时倍数/炸弹数 VM 取数分相（BUG-02 显示端·消费 T-LIVE-MULT 口子）。
 * 契约见 coordination/tasks/T-HUD-LIVE.md（2026-07-07 规划者种子期修订：优先级 + bidding 零值语义）。规则钉死：
 *   优先级 settlement > snapshot > bidding > 缺省；
 *   bidding 相：multiplier = bidding.multiplier > 0 ? bidding.multiplier : 1（未叫时 createBidding 的 multiplier=0
 *     须显 1——不可用 `??`，0 不是 undefined）；bombs 恒 0；
 *   playing 相：multiplier = snapshot.bidMultiplier ?? 1；bombs = snapshot.bombsPlayed ?? 0（旧快照缺字段回退）；
 *   settled 相：settlement.multiplier / settlement.bombs（既有·优先级最高·不回退）；
 *   UI 不重算结算公式、不自行统计事件、不自行算 2**bombs；landlordSeat 透传语义不动。
 *   「顶栏 bombs label 存在」是 cc 渲染·不入种子——归审查者逐行核（skeleton:433/:495-511 已全相消费 vm.topBar·
 *     只需新增 bombs label）+ 双层视觉预审（cc 组件不可入 vitest·同 T-RESUME-REPLAY 先例）。
 * 今日红因：screen-view.ts:61-65 topBar 只读 settlement（bidding/playing 相恒 1/0）→ 案例①②失败；案例③为绿锚。
 */
import { describe, expect, it } from 'vitest';
import { deriveScreenVM } from '../../assets/scripts/ui/screen-view';
import { createBidding, GamePhase, type BiddingState, type GameSnapshot, type Settlement } from '../../assets/scripts/game';

const layoutOpts = { containerWidth: 844, containerHeight: 390, cardWidth: 100, liftOffset: 20 };

function vm(args: Partial<Parameters<typeof deriveScreenVM>[0]> = {}) {
  return deriveScreenVM({ heroSeat: 0, selectedCards: [], recentEvents: [], layoutOpts, ...args });
}

function snap(over: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn: 0,
    landlord: 0,
    top: null,
    handCounts: [17, 17, 17],
    winner: null,
    ...over,
  };
}

function biddingAt(multiplier: number): BiddingState {
  return { ...createBidding(0), multiplier };
}

describe('T-HUD-LIVE 顶栏实时倍数/炸弹数分相取数', () => {
  it('① bidding 相：未叫 0 显 1·叫/抢后跟随 bidding.multiplier·bombs 恒 0', () => {
    expect(vm({ bidding: biddingAt(0) }).topBar).toMatchObject({ multiplier: 1, bombs: 0 }); // 未叫·0→1
    expect(vm({ bidding: biddingAt(1) }).topBar.multiplier).toBe(1); // 叫地主
    expect(vm({ bidding: biddingAt(2) }).topBar.multiplier).toBe(2); // 抢 ×2 —— 今日红（现恒 1）
    expect(vm({ bidding: biddingAt(4) }).topBar.multiplier).toBe(4); // 反抢 ×2×2
    expect(vm({ bidding: biddingAt(4) }).topBar.bombs).toBe(0); // bidding 相无炸弹
  });

  it('② playing 相：snapshot.bidMultiplier/bombsPlayed 实时取数·旧快照缺字段回退 1/0·landlordSeat 透传不动', () => {
    const live = snap({ bidMultiplier: 4, bombsPlayed: 2, landlord: 1 });
    const top = vm({ snapshot: live }).topBar;
    expect(top.multiplier, 'playing 相取 snapshot.bidMultiplier').toBe(4); // 今日红（现恒 1）
    expect(top.bombs, 'playing 相取 snapshot.bombsPlayed').toBe(2); //        今日红（现恒 0）
    expect(top.landlordSeat, '透传语义不动').toBe(1);

    // 旧存档快照无二字段（T-LIVE-MULT 可选口子）→ 回退 1/0 不崩
    expect(vm({ snapshot: snap() }).topBar).toMatchObject({ multiplier: 1, bombs: 0 });
  });

  it('③ 绿锚：settled 相 settlement 优先（与 snapshot 并存时胜出·既有行为不回退）·三源皆无时缺省 1/0', () => {
    const settlement: Settlement = { multiplier: 8, spring: 'none', bombs: 3, scores: [16, -8, -8] };
    const top = vm({ snapshot: snap({ bidMultiplier: 4, bombsPlayed: 2 }), settlement }).topBar;
    expect(top.multiplier, 'settlement 优先于 snapshot').toBe(8);
    expect(top.bombs).toBe(3);

    expect(vm({}).topBar).toMatchObject({ multiplier: 1, bombs: 0, landlordSeat: null }); // 缺省
  });
});
