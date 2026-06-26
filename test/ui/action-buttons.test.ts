/**
 * M3-00 失败测试：操作按钮状态模型（架构种入·不可改）。当前 action-buttons.ts 为桩 → 应先红。
 */
import { describe, it, expect } from 'vitest';
import { deriveActionButtons } from '../../assets/scripts/ui/action-buttons';
import { GamePhase, type GameSnapshot, type TopPlay } from '../../assets/scripts/game';
import { recognize, Rank } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

function snap(turn: 0 | 1 | 2, top: TopPlay | null, viewerHand = cards('5 9 K')): GameSnapshot {
  return {
    phase: GamePhase.Playing,
    turn,
    landlord: 0,
    top,
    handCounts: [3, 1, 3],
    winner: null,
    viewerHand,
  };
}

const top3 = { seat: 1, pattern: recognize(cards('3'))! } as TopPlay;

describe('M3-00 操作按钮状态模型', () => {
  it('非玩家轮 → 全 false', () => {
    const s = snap(1, top3);
    const r = deriveActionButtons({ snapshot: s, selectedCards: [], viewerSeat: 0 });
    expect(r).toEqual({ play: false, pass: false, hint: false });
  });

  it('玩家轮、空选中 → play:false；有 top → pass:true；hint:true', () => {
    const s = snap(0, top3);
    const r = deriveActionButtons({ snapshot: s, selectedCards: [], viewerSeat: 0 });
    expect(r.play).toBe(false);
    expect(r.pass).toBe(true);
    expect(r.hint).toBe(true);
  });

  it('玩家轮、选中合法可压牌（K 压 3）→ play:true', () => {
    const s = snap(0, top3);
    const r = deriveActionButtons({ snapshot: s, selectedCards: cards('K'), viewerSeat: 0 });
    expect(r.play).toBe(true);
  });

  it('玩家轮、选中非法（压不住的小牌 5 也能压单张3? 5>3 合法）→ 用对子压单张才非法', () => {
    // 单张3 用对子压是非法（不同牌型）
    const s = snap(0, top3);
    const r = deriveActionButtons({ snapshot: s, selectedCards: cards('5 5'), viewerSeat: 0 });
    expect(r.play).toBe(false);
  });

  it('top===null（自由领出）→ pass:false', () => {
    const s = snap(0, null);
    const r = deriveActionButtons({ snapshot: s, selectedCards: cards('K'), viewerSeat: 0 });
    expect(r.pass).toBe(false);
    expect(r.play).toBe(true);
  });

  it('入参不被改动', () => {
    const s = snap(0, top3);
    const sel = cards('K');
    const selFrozen = [...sel];
    deriveActionButtons({ snapshot: s, selectedCards: sel, viewerSeat: 0 });
    expect(sel).toEqual(selFrozen);
  });
});
